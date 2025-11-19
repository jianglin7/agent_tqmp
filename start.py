#!/usr/bin/env python
"""
AI助手应用简化启动脚本
适用于开发环境，自动使用开发环境配置
"""

import sys
import os
import subprocess

def main():
    """
    简化的启动脚本，自动设置开发环境并启动应用
    """
    print("=" * 60)
    print("AI助手应用 - 简化启动脚本")
    print("=" * 60)
    print("此脚本将自动使用开发环境配置启动应用")
    print("无需手动设置环境变量")
    print("=" * 60)
    
    # 获取当前目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"当前目录: {current_dir}")
    
    # 检查是否在正确的项目目录
    required_files = [
        os.path.join(current_dir, 'config', '__init__.py'),
        os.path.join(current_dir, 'main.py'),
        os.path.join(current_dir, 'requirements.txt')
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("错误：项目文件不完整，缺少以下文件：")
        for file_path in missing_files:
            print(f"  - {file_path}")
        print("\n请确保您在正确的项目目录中运行此脚本")
        return 1
    
    # 检查Python版本
    if sys.version_info < (3, 7):
        print("错误：Python版本过低，需要Python 3.7或更高版本")
        return 1
    
    # 检查依赖是否安装
    try:
        import fastapi
        import uvicorn
        import requests
        print("✓ 所有依赖包已安装")
    except ImportError:
        print("✗ 检测到缺失的依赖包")
        print("正在尝试自动安装依赖...")
        
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", "-r", 
                os.path.join(current_dir, "requirements.txt")
            ])
            print("✓ 依赖包安装成功")
        except subprocess.CalledProcessError:
            print("✗ 依赖包安装失败")
            print("请手动安装依赖：")
            print(f"  {sys.executable} -m pip install -r requirements.txt")
            return 1
    
    # 设置开发环境变量
    os.environ['FASTAPI_ENV'] = 'dev'
    os.environ['SECRET_KEY'] = 'dev-key-for-development-only'  # 开发环境使用的默认密钥
    
    print(f"\n已设置环境变量：")
    print(f"  FASTAPI_ENV = {os.environ['FASTAPI_ENV']}")
    print(f"  SECRET_KEY = {os.environ['SECRET_KEY']}")
    
    # 切换到项目根目录
    os.chdir(current_dir)
    
    # 运行应用
    print("\n" + "=" * 60)
    print("正在启动AI助手应用...")
    print("访问地址: http://0.0.0.1:8778")
    print("API文档: http://0.0.0.1:8778/docs")
    print("按 Ctrl+C 停止应用")
    print("=" * 60)
    
    try:
        # 使用uvicorn启动FastAPI应用
        subprocess.check_call([
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--host", "0.0.0.0",
            "--port", "8778",
            "--reload"
        ])
        
    except subprocess.CalledProcessError as e:
        print(f"\n✗ 应用启动失败: {e}")
        print("\n请尝试手动启动：")
        print(f"  cd {current_dir}")
        print(f"  {sys.executable} -m uvicorn main:app --host 0.0.0.0 --port 8778 --reload")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
