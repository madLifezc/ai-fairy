import logging
from typing import Dict
from fastapi import WebSocket
from server.session import ClientSession

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # 存储所有活跃的WebSocket连接
        self.active_connections: Dict[str, WebSocket] = {}
        # 存储所有客户端会话
        self.client_sessions: Dict[str, ClientSession] = {}
        
    async def connect(self, websocket: WebSocket, client_id: str):
        """
        处理新的WebSocket连接
        
        Args:
            websocket: WebSocket连接实例
            client_id: 客户端唯一标识
        """
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.client_sessions[client_id] = ClientSession(client_id)
        logger.info(f"客户端 {client_id} 已连接")
        
    def disconnect(self, client_id: str):
        """
        处理WebSocket断开连接
        
        Args:
            client_id: 客户端唯一标识
        """
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.client_sessions:
            del self.client_sessions[client_id]
        logger.info(f"客户端 {client_id} 已断开连接")
        
    def get_session(self, client_id: str) -> ClientSession:
        """
        获取客户端会话
        
        Args:
            client_id: 客户端唯一标识
            
        Returns:
            客户端会话实例
        """
        return self.client_sessions.get(client_id)
    
    async def send_message(self, client_id: str, message: dict):
        """
        向指定客户端发送消息
        
        Args:
            client_id: 客户端唯一标识
            message: 要发送的消息
        """
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            await websocket.send_json(message)
            
    def get_active_clients(self):
        """
        获取所有活跃的客户端ID列表
        
        Returns:
            活跃客户端ID列表
        """
        return list(self.active_connections.keys())

# 创建全局连接管理器实例
manager = ConnectionManager() 