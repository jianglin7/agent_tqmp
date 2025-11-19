import re

def sanitize_answer_text(answer_text: str) -> str:
    """
    确保首行无任何空白（顶格输出），保留其他位置空格，去除多余符号
    """
    if not answer_text:
        return ""

    text = answer_text

    # —— 原有符号清理逻辑保持不变 ——
    text = re.sub(r"(?mi)^[^\n]*\bis running\b[^\n]*\n?", "", text)
    spinner_chars = "◐◓◑◒⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏●○◌◎·•…"
    text = re.sub(f"[{re.escape(spinner_chars)}]+", "", text)
    text = re.sub(r"(?is)<\s*think\b[^>]*>.*?<\s*/\s*think\s*>", "", text)
    text = re.sub(r"(?is)&lt;\s*think\b[^&]*&gt;.*?&lt;\s*\/\s*think\s*&gt;", "", text)
    text = text.replace("\u00A0", " ").replace("\u202F", " ")
    text = re.sub(r"[\u200B\u200C\u200D\uFEFF]", "", text)
    text = re.sub(r"[\u2028\u2029]", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # —— 强化首行空白去除（核心修改）——
    # 1. 先去除首行所有空白（包括空格、制表符、换行等）
    text = re.sub(r"^[\s\n\r]+", "", text)  # 明确包含换行符\r\n，确保首行无空行
    # 2. 再去除首行可能残留的<br>/全角空格等特殊空白
    text = re.sub(r"^(?:(?:<br\s*\/?>|&nbsp;|\u3000)\s*)+", "", text, flags=re.I)
    # 3. 最终确认首行无任何空白
    text = re.sub(r"^[\s\n\r]+", "", text)

    # 压缩过多<br>/空行（不影响首行）
    text = re.sub(r"(?:\s*(?:<br\s*\/?>|\r?\n)\s*){3,}", "\n\n", text, flags=re.I)

    return text