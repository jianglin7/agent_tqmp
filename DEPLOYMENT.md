# AI助手应用部署指南

本指南详细介绍如何将AI助手应用部署到服务器，使其可以通过URL供他人访问使用。

## 1. 服务器准备

### 1.1 推荐服务器配置
- **操作系统**: Ubuntu 20.04 LTS 或更高版本
- **CPU**: 2核或更高
- **内存**: 2GB RAM或更高
- **存储空间**: 至少10GB可用空间
- **网络**: 稳定的互联网连接，配置好域名和DNS

### 1.2 服务器初始设置
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要的系统依赖
sudo apt install -y python3 python3-pip python3-venv nginx git
```

## 2. 应用部署

### 2.1 克隆代码库
```bash
# 克隆项目代码
git clone <你的代码仓库URL> ai_assistant
cd ai_assistant

# 如果是本地代码上传到服务器，可以使用scp命令
# scp -r /本地项目路径 user@服务器IP:/远程路径
```

### 2.2 创建虚拟环境
```bash
# 创建并激活虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖包
pip install -r requirements.txt
```

### 2.3 配置环境变量
创建`.env`文件来存储环境变量：
```bash
nano .env
```

添加以下内容：
```
# 应用配置
FASTAPI_ENV=prod
SECRET_KEY=your-secure-secret-key-here  # 使用随机生成的安全密钥

# RagFlow配置
RAGFLOW_API_KEY=your-ragflow-api-key
RAGFLOW_AGENT_ID=your-ragflow-agent-id
RAGFLOW_HOST=https://api.ragflow.com  # 根据实际情况修改
RAGFLOW_PORT=443
```

**生成安全的SECRET_KEY**：
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2.4 测试应用
```bash
# 使用生产配置测试应用
source venv/bin/activate
export $(cat .env | xargs)
uvicorn main:app --host 0.0.0.0 --port 5000
```

访问 `http://服务器IP:5000` 确认应用正常运行。

## 3. 使用Systemd管理应用

### 3.1 创建Systemd服务文件
```bash
sudo nano /etc/systemd/system/ai-assistant.service
```

添加以下内容：
```ini
[Unit]
Description=AI Assistant Application
After=network.target

[Service]
User=ubuntu  # 替换为你的用户名
Group=ubuntu
WorkingDirectory=/home/ubuntu/ai_assistant  # 替换为你的项目路径
Environment="PATH=/home/ubuntu/ai_assistant/venv/bin"
EnvironmentFile=/home/ubuntu/ai_assistant/.env  # 替换为你的.env文件路径
ExecStart=/home/ubuntu/ai_assistant/venv/bin/uvicorn main:app --host 127.0.0.1 --port 5000 --workers 4

Restart=always
RestartSec=5
KillSignal=SIGINT

[Install]
WantedBy=multi-user.target
```

### 3.2 启动服务
```bash
# 重新加载Systemd配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start ai-assistant

# 设置开机自启
sudo systemctl enable ai-assistant

# 查看服务状态
sudo systemctl status ai-assistant
```

## 4. 配置Nginx反向代理

### 4.1 创建Nginx配置文件
```bash
sudo nano /etc/nginx/sites-available/ai-assistant
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件缓存设置
    location /static/ {
        alias /home/ubuntu/ai_assistant/frontend/static/;  # 替换为你的静态文件路径
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

### 4.2 启用Nginx配置
```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/ai-assistant /etc/nginx/sites-enabled/

# 测试Nginx配置
sudo nginx -t

# 重新加载Nginx
sudo systemctl reload nginx
```

## 5. 配置SSL证书（HTTPS）

### 5.1 安装Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 获取SSL证书
```bash
sudo certbot --nginx -d your-domain.com
```

按照提示完成配置，Certbot会自动更新Nginx配置以启用HTTPS。

## 6. 应用维护

### 6.1 查看应用日志
```bash
sudo journalctl -u ai-assistant -f
```

### 6.2 更新应用
```bash
# 进入项目目录
cd /home/ubuntu/ai_assistant

# 拉取最新代码
git pull

# 激活虚拟环境
source venv/bin/activate

# 更新依赖
pip install -r requirements.txt

# 重启服务
sudo systemctl restart ai-assistant
```

### 6.3 监控服务器性能
```bash
# 安装监控工具
sudo apt install -y htop

# 运行监控
htop
```

## 7. 安全设置

### 7.1 配置防火墙
```bash
# 安装UFW防火墙
sudo apt install -y ufw

# 允许SSH、HTTP和HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# 启用防火墙
sudo ufw enable

# 查看防火墙状态
sudo ufw status
```

### 7.2 定期更新系统
```bash
# 创建自动更新脚本
sudo nano /etc/cron.weekly/update-system
```

添加以下内容：
```bash
#!/bin/bash
apt update && apt upgrade -y && apt autoremove -y
```

设置执行权限：
```bash
sudo chmod +x /etc/cron.weekly/update-system
```

## 8. 故障排除

### 8.1 应用无法启动
- 检查环境变量是否正确设置
- 检查RagFlow API密钥和代理ID是否有效
- 查看应用日志：`sudo journalctl -u ai-assistant`

### 8.2 Nginx错误
- 检查Nginx配置：`sudo nginx -t`
- 查看Nginx日志：`sudo tail -f /var/log/nginx/error.log`

### 8.3 SSL证书问题
- 检查证书状态：`sudo certbot certificates`
- 重新获取证书：`sudo certbot renew --force-renewal`

## 9. 扩展建议

### 9.1 使用Docker部署（可选）
对于更复杂的部署环境，可以考虑使用Docker容器化应用。

### 9.2 配置负载均衡
如果预期有大量用户访问，可以配置多个应用实例并使用负载均衡器分发流量。

### 9.3 监控和告警
考虑使用Prometheus和Grafana等工具设置应用监控和告警系统。

---

完成以上步骤后，你的AI助手应用将成功部署到服务器上，并可以通过你的域名（如https://your-domain.com）供他人访问使用。
