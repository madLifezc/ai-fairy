from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse
from server.util.ai_service import ai_service
from typing import Dict
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/aichat")
async def chat(request: Request) -> StreamingResponse:
    """
    流式返回AI回复
    
    Args:
        request: 包含用户输入的请求对象
    
    Returns:
        StreamingResponse: 流式响应对象
    """
    try:
        data: Dict = await request.json()
        user_input = data.get("text", "")
        
        # 构建消息历史
        messages = [
            {"role": "user", "content": user_input}
        ]

        async def generate():
            async for chunk in ai_service.generate_text(messages):
                if isinstance(chunk, dict):  # 完整内容，跳过
                    continue
                yield f"data: {chunk}"

        return StreamingResponse(
            content=generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
        
    except Exception as e:
        return StreamingResponse(
            content=iter([f"发生错误: {str(e)}".encode()]),
            media_type="text/plain"
        )

@router.post("/generate_image")
async def generate_image(request: Request) -> JSONResponse:
    """
    生成图片接口
    
    Args:
        request: 包含图片提示词的请求对象
        
    Returns:
        JSONResponse: 包含图片URL的响应对象
    """
    try:
        data: Dict = await request.json()
        prompt = data.get("prompt", "")
        
        if not prompt:
            return JSONResponse(
                status_code=400,
                content={"error": "提示词不能为空"}
            )
            
        # 调用AI服务生成图片
        image_url = await ai_service.generate_image(prompt)
        
        return JSONResponse(
            content={"image_url": image_url}
        )
        
    except Exception as e:
        logger.error(f"生成图片失败: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"生成图片失败: {str(e)}"}
        )