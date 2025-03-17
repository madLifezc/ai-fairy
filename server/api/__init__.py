from fastapi import APIRouter
from server.api.aichat import router as aichat_router

# 创建主路由
api_router = APIRouter()

# 注册子路由
api_router.include_router(aichat_router, tags=["AI聊天"]) 