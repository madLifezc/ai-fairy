from fastapi import APIRouter
from server.api.aichat import router as aichat_router
from server.api.cozi import router as cozi_router
from server.api.bailian import router as bailian_router
# 创建主路由
api_router = APIRouter()

# 注册子路由
api_router.include_router(aichat_router, tags=["AI聊天"])
api_router.include_router(cozi_router, tags=["扣子API"])
api_router.include_router(bailian_router, tags=["阿里云百炼API"])

# api package initialization 