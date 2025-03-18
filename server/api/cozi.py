from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from cozepy import Coze, TokenAuth, Message, ChatStatus, MessageContentType, ChatEventType, COZE_CN_BASE_URL
import logging
from typing import Dict
import os
from dotenv import load_dotenv
import httpx
import json

# 加载环境变量
load_dotenv()

logger = logging.getLogger(__name__)

# 创建路由器
router = APIRouter()

# 初始化Coze客户端
coze = Coze(
    auth=TokenAuth(os.getenv("COZE_API_TOKEN")), 
    base_url=COZE_CN_BASE_URL
)

@router.post("/weather")
async def get_weather_report(request: Request) -> JSONResponse:
    try:
        data: Dict = await request.json()
        city = data.get("city")
        base_url = "https://api.coze.cn/v1/workflow/run"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {os.getenv('COZE_API_TOKEN')}"
        }
        payload = {
            "workflow_id": "7483019475357827126",
            "parameters": {
                "city": city
            },
            "app_id": "7482996262485114899"
        }
        
        # 设置超时时间为20秒
        timeout = httpx.Timeout(20.0, connect=20.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(base_url, json=payload, headers=headers)
            response_data = response.json()
            # 获取响应数据中的data字段
            data = response_data.get("data", {})
            if not data:
                raise Exception("未获取到天气数据")
            return JSONResponse(
                content={
                    'code': 200,
                    'message': 'success',
                    'data': json.loads(data)
                }
            )
    except httpx.TimeoutException as e:
        logger.error(f"请求超时: {str(e)}")
        return JSONResponse(
            status_code=504,
            content={
                'code': 504,
                'message': '请求超时，请稍后重试',
                'data': None
            }
        )
    except Exception as e:
        logger.error(f"获取天气画报失败: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                'code': 500,
                'message': f'服务器错误: {str(e)}',
                'data': None
            }
        )
    

# @router.post("/weather")
# async def get_weather_report(request: Request) -> JSONResponse:
#     try:
#         data: Dict = await request.json()
#         city = data.get("city")

#         for event in coze.chat.stream(
#             bot_id="7482996262485114899", 
#             user_id="7469679493091770431", 
#             additional_messages=[Message.build_user_question_text(city)]
#         ):
#             if event.event == ChatEventType.CONVERSATION_MESSAGE_DELTA:
#                 if event.message.reasoning_content:
#                     if is_first_reasoning_content:
#                         is_first_reasoning_content = not is_first_reasoning_content
#                         print("----- reasoning_content start -----\n> ", end="", flush=True)
#                     print(event.message.reasoning_content, end="", flush=True)
#                 else:
#                     if is_first_content and not is_first_reasoning_content:
#                         is_first_content = not is_first_content
#                         print("----- reasoning_content end -----")
#                     print(event.message.content, end="", flush=True)

#             if event.event == ChatEventType.CONVERSATION_CHAT_COMPLETED:
#                 print("----- chat completed -----")
#                 print("token usage:", event.chat.usage.token_count)

#     except Exception as e:
#         logger.error(f"获取天气画报失败: {str(e)}")
#         return JSONResponse(
#             status_code=500,
#             content={
#                 'code': 500,
#                 'message': f'服务器错误: {str(e)}',
#                 'data': None
#             }
#         )