import os
import sys
import json
import uuid
import logging
from dotenv import load_dotenv

# 添加项目根目录到系统路径
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
sys.path.append(root_dir)

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from server.config.prompts import AI_ROLE_PROMPTS, ERROR_MESSAGES
from server.util.ai_service import ai_service
from server.connection_manager import manager
from server.session import ClientSession
from server.api import api_router

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# 加载环境变量
load_dotenv()

app = FastAPI(title="AI小助手API")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    logger.info("WebSocket连接已建立")
    client_id = str(uuid.uuid4())
    await manager.connect(websocket, client_id)
    session = ClientSession(client_id)
    
    try:
        # 发送欢迎消息
        await manager.send_message(
            client_id,
            {"type": "system", "content": "欢迎使用多智能体AI精灵！"}
        )
        
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "change_role":
                new_role = data.get("role")
                if session.change_role(new_role):
                    logger.info(f"客户端 {client_id} 已切换到{new_role}角色")
                else:
                    await manager.send_message(
                        client_id,
                        {"type": "error", "content": ERROR_MESSAGES["invalid_role"]}
                    )
            elif data.get("type") == "message":
                user_input = data.get("content", "")
                if user_input.strip():  # 确保输入不是空字符串
                    async for message in session.generate_response(user_input):
                        await manager.send_message(client_id, message)
                    
    except WebSocketDisconnect:
        logger.info(f"客户端 {client_id} 断开连接")
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket错误: {str(e)}")
        await manager.send_message(
            client_id,
            {"type": "error", "content": ERROR_MESSAGES["system_error"]}
        )
        manager.disconnect(client_id)

# 注册路由
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    logger.info("启动服务器...")
    uvicorn.run("main:app", host="0.0.0.0", port=9100, reload=True)
    # uvicorn.run(app, host="0.0.0.0", port=9100) 