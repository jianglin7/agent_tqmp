import os
from typing import Dict

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-for-development-only')
    DEBUG = False
    TESTING = False
    
    # RagFlow 配置
    RAGFLOW_API_KEY = os.getenv("RAGFLOW_API_KEY", "ragflow-FlNzFlNjcwNTg4MzExZjA4ZmNmMDI0Mm")
    RAGFLOW_AGENT_ID = os.getenv("RAGFLOW_AGENT_ID", "a379d218bdde11f089660242ac120007")
    RAGFLOW_HOST = os.getenv("RAGFLOW_HOST", "http://10.80.5.197")
    RAGFLOW_PORT = os.getenv("RAGFLOW_PORT", "80")
    
    # 预设问题
    PRESET_QUESTIONS = [
        "查询本学期全校范围督导平均分",
        "查询本学期各院系督导记录数分布",
        "如何导出督导评分数据",
        "查询近三年督导分数趋势对比",
    ]

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True

class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True

class ProductionConfig(Config):
    """Production configuration."""
    # 在生产环境中必须要求设置SECRET_KEY环境变量
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("No SECRET_KEY set for production environment. "
                        "Please set the SECRET_KEY environment variable.")

config_by_name: Dict[str, Config] = {
    'dev': DevelopmentConfig,
    'test': TestingConfig,
    'prod': ProductionConfig
}

def get_config(config_name: str = 'dev') -> Config:
    """Get configuration by name."""
    return config_by_name.get(config_name, DevelopmentConfig)
