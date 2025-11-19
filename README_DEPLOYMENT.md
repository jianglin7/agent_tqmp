# AI助手应用部署说明

## 快速开始

如果您想将AI助手应用部署到服务器并通过URL分享给他人使用，请按照以下步骤操作：

### 1. 准备工作

- 一台运行Ubuntu 20.04 LTS或更高版本的服务器
- 一个已注册的域名（如example.com）
- 服务器已安装Python 3.7+、pip和git

### 2. 基本部署步骤

1. **克隆代码库**到服务器：
   ```bash
   git clone <您的代码仓库URL> ai_assistant
   cd ai_assistant
   ```

2. **创建环境变量文件**：
   ```bash
   cp .env.example .env  # 如果有示例文件
   # 或直接创建.env文件
   nano .env
   ```

   在.env文件中添加必要的配置：
   ```
   FASTAPI_ENV=prod
   SECRET_KEY=your-secure-secret-key
   RAGFLOW_API_KEY=your-ragflow-api-key
   RAGFLOW_AGENT_ID=your-ragflow-agent-id
   RAGFLOW_HOST=https://api.ragflow.com
   RAGFLOW_PORT=443
   ```

3. **创建并激活虚拟环境**：
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **测试应用**：
   ```bash
   source venv/bin/activate
   export $(cat .env | xargs)
   uvicorn main:app --host 0.0.0.0 --port 5000
   ```

5. **配置Systemd服务**（推荐）：
   ```bash
   sudo nano /etc/systemd/system/ai-assistant.service
   ```

   使用`DEPLOYMENT.md`文件中的Systemd配置内容。

6. **配置Nginx反向代理**：
   ```bash
   sudo nano /etc/nginx/sites-available/ai-assistant
   ```

   使用`DEPLOYMENT.md`文件中的Nginx配置内容。

7. **配置SSL证书**（HTTPS）：
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### 3. 使用提供的部署工具

本项目提供了以下部署相关文件：

- **`DEPLOYMENT.md`**: 详细的部署指南，包含所有步骤的详细说明
- **`start_production.sh`**: 生产环境启动脚本，用于手动启动应用
- **`log_config.yml`**: 日志配置文件，用于生产环境的日志管理

### 4. 启动应用

#### 方式一：使用Systemd服务（推荐）
```bash
sudo systemctl start ai-assistant
sudo systemctl enable ai-assistant  # 设置开机自启
```

#### 方式二：使用生产启动脚本
```bash
chmod +x start_production.sh
./start_production.sh
```

### 5. 访问应用

部署完成后，您可以通过以下方式访问应用：
- 主页面: `https://your-domain.com`
- API文档: `https://your-domain.com/docs`

### 6. 维护和更新

**更新应用**：
```bash
cd /path/to/ai_assistant
git pull
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart ai-assistant
```

**查看日志**：
```bash
sudo journalctl -u ai-assistant -f
```

**监控应用状态**：
```bash
sudo systemctl status ai-assistant
```

### 7. 故障排除

如果遇到问题，请参考`DEPLOYMENT.md`文件中的"故障排除"部分，或查看应用日志获取详细信息。

---

更多详细信息，请参考完整的部署指南：[DEPLOYMENT.md](DEPLOYMENT.md)
