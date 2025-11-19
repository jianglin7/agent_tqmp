# AI助手应用

基于FastAPI和RagFlow的AI助手应用，提供智能问答功能，支持进度显示和自定义头像。

## 项目简介

这个AI助手应用利用FastAPI构建后端服务，集成RagFlow提供智能问答能力，前端采用现代化设计，支持实时进度显示和自定义头像。应用采用前后端分离架构，提供流畅的用户体验。

## 主要特性

- **智能问答**：基于RagFlow的知识库问答系统，提供准确的回答
- **实时进度显示**：等待回复时显示动态进度条，提升用户体验
- **自定义头像**：使用蓝色风格的AI助手头像，支持轻松更换
- **预设问题**：提供常用问题快速查询，提高使用效率
- **响应式设计**：适配不同屏幕尺寸，支持桌面和移动设备
- **流式响应**：采用SSE技术实现流式回答，实时显示回答内容
- **自动API文档**：FastAPI自动生成交互式API文档
- **代码高亮**：支持回答中的代码块高亮显示
- **参考文档链接**：显示回答引用的参考文档链接

## 技术栈

- **后端**：FastAPI、Python 3.7+
- **前端**：HTML5、CSS3 (Tailwind CSS)、JavaScript
- **API集成**：RagFlow API
- **部署**：Uvicorn、Gunicorn

## 项目结构

```
ai_assistant_refactored/
├── config/                 # 配置文件
│   └── __init__.py         # 配置类和环境变量
├── frontend/               # 前端资源
│   ├── static/             # 静态文件
│   │   ├── css/            # CSS样式
│   │   │   └── style.css   # 主样式文件
│   │   ├── js/             # JavaScript
│   │   │   └── main.js     # 主脚本文件
│   │   └── images/         # 图片资源
│   └── templates/          # HTML模板
│       └── index.html      # 主页面
├── main.py                 # FastAPI主应用文件
├── start_fastapi.py        # 简化启动脚本
├── test_fastapi.py         # 应用测试脚本
├── requirements.txt        # 依赖包列表
└── README.md               # 项目说明
```

## 安装与运行

### 前提条件

- Python 3.7+
- pip 20.0+

### 安装步骤

1. 克隆项目：
   ```bash
   git clone <项目地址>
   cd ai_assistant_refactored
   ```

2. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

3. 配置环境变量（可选）：
   ```bash
   # 基础配置
   export FASTAPI_ENV="dev"  # 环境类型：dev/test/prod
   export SECRET_KEY="your-secure-secret-key"  # 生产环境必须设置
   
   # RagFlow配置
   export RAGFLOW_API_KEY="your-ragflow-api-key"
   export RAGFLOW_AGENT_ID="your-ragflow-agent-id"
   export RAGFLOW_HOST="your-ragflow-host"
   export RAGFLOW_PORT="your-ragflow-port"
   ```

4. 运行应用：
   ```bash
   # 使用简化启动脚本（推荐，自动配置开发环境）
   python start_fastapi.py
   
   # 或者使用uvicorn直接启动
   python -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload
   ```

5. 在浏览器中访问：
   ```
   http://127.0.0.1:5000
   ```

## API文档

FastAPI自动生成交互式API文档：

- Swagger UI: http://127.0.0.1:5000/docs
- ReDoc: http://127.0.0.1:5000/redoc

## 配置说明

配置文件位于 `config/__init__.py`，支持以下配置项：

| 配置项 | 说明 | 默认值 | 环境变量 |
|--------|------|--------|----------|
| SECRET_KEY | 应用密钥 | 'dev-key-for-development-only' | SECRET_KEY |
| DEBUG | 调试模式开关 | False | - |
| TESTING | 测试模式开关 | False | - |
| RAGFLOW_API_KEY | RagFlow API密钥 | 'ragflow-FlNzFlNjcwNTg4MzExZjA4ZmNmMDI0Mm' | RAGFLOW_API_KEY |
| RAGFLOW_AGENT_ID | RagFlow代理ID | '54c54c6cb25b11f08bf70242ac160006' | RAGFLOW_AGENT_ID |
| RAGFLOW_HOST | RagFlow主机地址 | 'http://10.80.5.25' | RAGFLOW_HOST |
| RAGFLOW_PORT | RagFlow端口 | '80' | RAGFLOW_PORT |
| PRESET_QUESTIONS | 预设问题列表 | 4个默认问题 | - |

## 功能使用说明

### 基本操作

1. **提问**：在输入框中输入您的问题，然后点击"发送"按钮或按回车键
2. **预设问题**：点击顶部的预设问题按钮，可以快速查询常用问题
3. **查看回复**：AI助手的回复会显示在聊天区域，包含参考文档链接
4. **进度显示**：在等待回复时，会显示一个动态的进度指示器

### 高级功能

1. **代码高亮**：回答中的代码块会自动高亮显示
2. **参考文档**：回答底部会显示相关的参考文档链接
3. **会话管理**：应用会自动管理会话，保持对话上下文

## 自定义与扩展

### 更换AI助手头像

1. 将新头像图片放入 `frontend/static/images/` 目录
2. 修改 `frontend/templates/index.html` 和 `frontend/static/js/main.js` 中的图片URL

### 自定义主题

应用支持通过CSS变量自定义主题颜色：

```css
:root {
  --primary-color: #3b82f6; /* 主色调 */
  --secondary-color: #60a5fa; /* 次要色调 */
  --neutral-color: #f3f4f6; /* 中性色调 */
}
```

修改 `frontend/static/css/style.css` 文件中的这些变量值即可更改主题。

### 添加预设问题

修改 `config/__init__.py` 文件中的 `PRESET_QUESTIONS` 列表：

```python
PRESET_QUESTIONS = [
    "查询本学期全校范围督导平均分",
    "查询本学期各院系督导记录数分布",
    "如何导出督导评分数据",
    "查询近三年督导分数趋势对比",
    # 添加更多预设问题...
]
```

## 部署指南

### 开发环境

```bash
python start_fastapi.py
```

### 生产环境

建议使用Gunicorn作为生产服务器：

```bash
# 安装Gunicorn
pip install gunicorn

# 启动生产服务器
gunicorn -w 4 -b 0.0.0.0:5000 "main:app"
```

#### 使用Nginx作为反向代理

```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 测试

使用提供的测试脚本验证应用功能：

```bash
python test_fastapi.py
```

## 常见问题

### 1. 应用启动失败

- 检查Python版本是否符合要求（3.7+）
- 检查依赖包是否正确安装
- 检查配置文件是否正确设置

### 2. 无法连接RagFlow

- 检查RagFlow API密钥是否正确
- 检查RagFlow代理ID是否正确
- 检查RagFlow服务是否可用

### 3. 进度条不显示

- 检查JavaScript文件是否正确加载
- 检查CSS样式是否正确设置

## 未来计划

- 添加用户认证功能
- 支持多轮对话
- 添加更多自定义主题选项
- 实现对话历史保存功能
- 支持更多类型的问题查询
- 添加文件上传功能

## 许可证

MIT
