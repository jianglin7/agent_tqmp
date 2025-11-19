import sys
import os
import logging  # 新增：导入日志模块

from fastapi import FastAPI, Request, Response, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Dict, Optional, Generator, Tuple
import requests
import json
import re
from html import escape
from config import get_config

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# 新增：配置日志，输出到控制台（后台）
logging.basicConfig(
    level=logging.INFO,  # 日志级别：INFO及以上
    format="%(asctime)s - %(levelname)s - %(message)s",  # 日志格式：时间+级别+内容
    handlers=[logging.StreamHandler(sys.stdout)]  # 输出到控制台
)
logger = logging.getLogger(__name__)  # 创建日志实例

# 全局会话管理（内存）
sessions: Dict[str, str] = {}

def sanitize_answer_text(answer_text: str) -> str:
    """
    清理运行提示/思考块/旋转符号，并移除一切前导空白与无意义的起始 <br>。
    """
    if not answer_text:
        return ""

    text = answer_text

    # —— 去 RagFlow 运行提示行
    text = re.sub(r"(?mi)^[^\n]*\bis running\b[^\n]*\n?", "", text)

    # —— 去旋转/盲文/圆点等符号
    spinner_chars = "◐◓◑◒⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏●○◌◎·•…"
    text = re.sub(f"[{re.escape(spinner_chars)}]+", "", text)

    # —— 去 思考块（原生与转义）
    text = re.sub(r"(?is)<\s*think\b[^>]*>.*?<\s*/\s*think\s*>", "", text)
    text = re.sub(r"(?is)&lt;\s*think\b[^&]*&gt;.*?&lt;\s*\/\s*think\s*&gt;", "", text)

    # —— 统一并剥离各种“难缠空白”
    text = text.replace("\u00A0", " ").replace("\u202F", " ")
    text = re.sub(r"[\u200B\u200C\u200D\uFEFF]", "", text)
    text = re.sub(r"[\u2028\u2029]", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # —— 关键：把“开头的一切空白”和“开头堆叠的 <br>/&nbsp;/全角空格”去掉
    text = re.sub(r"^[\s]+", "", text)
    text = re.sub(r"^(?:\s*(?:<br\s*\/?>|&nbsp;|\u3000))+", "", text, flags=re.I)
    text = re.sub(r"^\s*(?:\r?\n)+", "", text)

    # —— 压一压连续 <br>/空行：3+ => 2
    text = re.sub(r"(?:\s*(?:<br\s*\/?>|\r?\n)\s*){3,}", "\n\n", text, flags=re.I)

    return text

# 创建FastAPI应用
app = FastAPI(
    title="AI助手API",
    description="基于FastAPI和RagFlow的AI助手应用",
    version="1.0.0"
)

# 加载配置
config = get_config(os.environ.get('FASTAPI_ENV', 'dev'))

# 配置静态文件和模板
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")
templates = Jinja2Templates(directory="frontend/templates")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_ragflow_session(session_id: str) -> Tuple[str, Optional[str]]:
    """
    创建或获取RagFlow会话ID
    
    Args:
        session_id: 用户会话ID
        
    Returns:
        Tuple[rag_session_id, error_message]
    """
    if session_id in sessions:
        return sessions[session_id], None

    url = f"{config.RAGFLOW_HOST}:{config.RAGFLOW_PORT}/api/v1/agents/{config.RAGFLOW_AGENT_ID}/sessions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config.RAGFLOW_API_KEY}",
    }
    try:
        resp = requests.post(url, headers=headers, json={}, timeout=100)
        resp.raise_for_status()
        body = resp.json()
        rag_session_id = (body.get("data") or {}).get("id")
        if not rag_session_id:
            return "", f"RagFlow 返回缺少 data.id：{body}"
        sessions[session_id] = rag_session_id
        return rag_session_id, None
    except requests.exceptions.RequestException as e:
        return "", f"RagFlow连接失败：{e}"
    except Exception as e:
        return "", f"解析RagFlow响应失败：{e}"

@app.get("/")
async def index(request: Request):
    """首页路由"""
    return templates.TemplateResponse("index.html", {
        "request": request,
        "preset_questions": config.PRESET_QUESTIONS
    })

@app.post("/chat")
async def chat(request: Request):
    """聊天接口路由"""
    data = await request.json()
    question = (data.get("question") or "").strip()
    session_id = (data.get("session_id") or "").strip()

    if not question or not session_id:
        raise HTTPException(status_code=400, detail="参数错误")

    rag_session_id, err = get_ragflow_session(session_id)
    if not rag_session_id:
        raise HTTPException(status_code=502, detail=f"会话创建失败：{err}")

    # 调 RagFlow 流式接口
    url = f"{config.RAGFLOW_HOST}:{config.RAGFLOW_PORT}/api/v1/agents/{config.RAGFLOW_AGENT_ID}/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config.RAGFLOW_API_KEY}",
    }
    payload = {
        "question": question,
        "stream": True,
        "session_id": rag_session_id,
        "lang": "Chinese",
    }

    try:
        upstream = requests.post(
            url, headers=headers, json=payload, stream=True, timeout=600
        )
        upstream.raise_for_status()

        def generate() -> Generator[str, None, None]:
            clean_answer_buffer = ""   # 存“清洗后”的完整答案
            refs_sent = False

            # —— 空白 token 的匹配/剥离 —— #
            WS_ONLY_RE = re.compile(
                r"^(?:[\s\u00A0\u202F\u200B\u200C\u200D\uFEFF]|(?:<br\s*/?>)|&nbsp;|\u3000)+$",
                re.I
            )
            LEADING_WS_RE = re.compile(
                r"^(?:[\s\u00A0\u202F\u200B\u200C\u200D\uFEFF]|(?:<br\s*/?>)|&nbsp;|\u3000)+",
                re.I
            )
            # —— 此处添加修改后的 strip_leading_ws_tokens 函数 ——
            def strip_leading_ws_tokens(s: str) -> str:
                if not s:
                    return s
                s = s.replace("\u00A0", " ").replace("\u202F", " ")
                s = re.sub(r"[\u200B\u200C\u200D\uFEFF]", "", s)
                s = re.sub(r"[\u2028\u2029]", "\n", s)
                # 强化首行空白去除（仅首行）
                s = re.sub(r"^[\s\n\r]+", "", s)  # 去除首行所有空白（包括换行）
                s = re.sub(r"^(?:(?:<br\s*\/?>|&nbsp;|\u3000)\s*)+", "", s, flags=re.I)
                s = re.sub(r"^[\s\n\r]+", "", s)  # 二次确认
                return s

            try:
                for line in upstream.iter_lines(decode_unicode=True):
                    if not line:
                        # 心跳：保持连接，防止代理超时
                        yield ":\n\n"
                        continue

                    # RagFlow 常见：每行形如 "data: {...}"
                    if line.startswith("data:"):
                        try:
                            payload = json.loads(line[5:].strip())
                        except Exception:
                            continue

                        data_obj = payload.get("data") if isinstance(payload, dict) else None
                        if not isinstance(data_obj, dict):
                            continue

                        # === 文本增量：先用 sanitize 清洗，再处理首帧/空白增量 ===
                        raw_ans = data_obj.get("answer", "")
                        clean_ans = sanitize_answer_text(raw_ans)

                        # 首帧：进一步剥掉所有前导空白 token（<br>/&nbsp;/NBSP/零宽等）
                        if not clean_answer_buffer:
                            clean_ans = strip_leading_ws_tokens(clean_ans)

                        if clean_ans and clean_ans != clean_answer_buffer:
                            # 正常前缀追加：计算差量
                            if clean_ans.startswith(clean_answer_buffer):
                                delta = clean_ans[len(clean_answer_buffer):]
                            else:
                                # 上游偶发“回写/改写”导致对不上前缀时，整段作为 delta
                                delta = clean_ans

                            # 若差量仅为空白 token，则不推送（防止把“开头空白”写死到前端）
                            if WS_ONLY_RE.fullmatch(delta or ""):
                                clean_answer_buffer = clean_ans
                            else:
                                yield (
                                    "data: "
                                    + json.dumps(
                                        {"type": "delta", "text": delta},
                                        ensure_ascii=False,
                                    )
                                    + "\n\n"
                                )
                                clean_answer_buffer = clean_ans

                        # === 参考文档：只发一次 ===
                        if (not refs_sent) and "reference" in data_obj:
                            chunks = (data_obj.get("reference") or {}).get("chunks", [])
                            if chunks:
                                files = set()
                                parts = [
                                    "<div class='mt-2 text-xs text-gray-500 border-t border-gray-200 pt-2'>",
                                    "<p class='font-medium mb-1'>参考文档：</p><ul class='list-disc list-inside'>",
                                ]
                                for ch in chunks:
                                    doc_id = ch.get("document_id")
                                    doc_name = escape(ch.get("document_name", "未知文档"))
                                    if doc_id and (doc_id not in files):
                                        href = f"{config.RAGFLOW_HOST}:{config.RAGFLOW_PORT}/document/{doc_id}"
                                        parts.append(
                                            f"<li><a href='{href}' target='_blank' class='text-primary hover:underline'>{doc_name}</a></li>"
                                        )
                                        files.add(doc_id)
                                parts.append("</ul></div>")
                                html = "".join(parts)
                                refs_sent = True
                                yield (
                                    "data: "
                                    + json.dumps(
                                        {"type": "refs", "html": html},
                                        ensure_ascii=False,
                                    )
                                    + "\n\n"
                                )

                # 正常结束
                yield "data: {\"type\":\"done\"}\n\n"

            except Exception as e:
                # 把错误也按 SSE 帧返回给前端
                err = {"type": "error", "message": str(e)}
                yield "data: " + json.dumps(err, ensure_ascii=False) + "\n\n"
        
        headers_out = {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 若有 Nginx 反代，需关闭缓冲
        }
        return StreamingResponse(generate(), headers=headers_out)

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"请求失败: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8778,
        reload=config.DEBUG,
        workers=1 if config.DEBUG else None
    )
