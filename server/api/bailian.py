from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse
import logging
from typing import Dict, AsyncGenerator
from dotenv import load_dotenv
import httpx
import os
import json
import asyncio
from http import HTTPStatus
from dashscope import Application
import time
# 加载环境变量      
load_dotenv()
logger = logging.getLogger(__name__)
# 创建路由器
router = APIRouter()

@router.post("/bailian_chat")
async def get_travel_plan(request: Request) -> StreamingResponse:
    try:
        data: Dict = await request.json()
        content = data.get("content")
        
        if not content:
            return JSONResponse(
                status_code=400,
                content={
                    'code': 400,
                    'message': '请求内容不能为空',
                    'data': None
                }
            )
            
        async def generate_stream() -> AsyncGenerator[str, None]:
            # 首先发送一个开始标记
            start_msg = json.dumps({"type": "start"}) + "\n"
            logger.info(f"Sending start message: {start_msg}")
            yield start_msg
            
            try:
                logger.info(f"Calling Dashscope API with content: {content}")
                responses = Application.call(
                    api_key=os.getenv("DASHSCOPE_API_KEY"),
                    app_id=os.getenv("DASHSCOPE_LVYOU_APP_ID"),
                    prompt=content,
                    stream=True,
                    incremental_output=True
                )
                
                for response in responses:
                    logger.info(f"Received response: {response}")
                    if response.status_code != HTTPStatus.OK:
                        error_msg = f"调用API失败: {response.message}"
                        logger.error(error_msg)
                        error_response = json.dumps({"type": "error", "content": error_msg}) + "\n"
                        logger.info(f"Sending error message: {error_response}")
                        yield error_response
                        break
                    else:
                        if hasattr(response.output, 'text'):
                            chunk = response.output.text
                            if chunk:
                                # 对chunk进行清理，移除可能的特殊字符
                                chunk = chunk.strip()
                                if chunk:
                                    chunk_msg = json.dumps({"type": "chunk", "content": chunk}, ensure_ascii=False) + "\n"
                                    logger.info(f"Sending chunk: {chunk_msg}")
                                    yield chunk_msg
                                    await asyncio.sleep(0.05)  # 控制发送速率
                
                # 最后发送一个结束标记
                end_msg = json.dumps({"type": "end"}) + "\n"
                logger.info(f"Sending end message: {end_msg}")
                yield end_msg
                
            except Exception as e:
                error_message = f"生成响应时出错: {str(e)}"
                logger.error(error_message)
                error_response = json.dumps({"type": "error", "content": error_message}, ensure_ascii=False) + "\n"
                logger.info(f"Sending error message: {error_response}")
                yield error_response
        
        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # 禁用Nginx缓冲
            }
        )
                
    except Exception as e:
        logger.error(f"处理请求失败: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                'code': 500,
                'message': f'服务器错误: {str(e)}',
                'data': None
            }
        )
