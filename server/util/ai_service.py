import os
import json
import logging
from openai import AsyncAzureOpenAI
import httpx
from dotenv import load_dotenv
from server.config.prompts import ERROR_MESSAGES

# 配置日志
logger = logging.getLogger(__name__)

class AzureAIService:
    def __init__(self):
        # 加载环境变量
        load_dotenv()
        
        try:
            # 创建基础配置
            base_config = {
                "timeout": httpx.Timeout(60.0),
                "follow_redirects": True
            }
            
            # 初始化异步客户端
            self.llm_client = AsyncAzureOpenAI(
                api_key=os.getenv('AZURE_OPENAI_KEY'),
                azure_endpoint=os.getenv('AZURE_OPENAI_ENDPOINT'),
                api_version="2024-05-01-preview",
                http_client=httpx.AsyncClient(**base_config)
            )
            
            self.image_client = AsyncAzureOpenAI(
                api_key=os.getenv('AZURE_OPENAI_IMAGE_KEY'),
                azure_endpoint=os.getenv('AZURE_OPENAI_IMAGE_ENDPOINT'),    
                api_version="2024-02-01",
                http_client=httpx.AsyncClient(**base_config)
            )
        except Exception as e:
            logger.error(f"初始化 Azure OpenAI 客户端失败: {str(e)}")
            raise

    async def generate_text(self, messages):
        """
        流式生成文本回复
        
        Args:
            messages: 对话历史消息列表
            
        Yields:
            生成的文本片段
        """
        logger.info("正在生成文字回复...")
        try:
            response = await self.llm_client.chat.completions.create(
                model=os.getenv('AZURE_OPENAI_MODEL'),
                messages=messages,
                max_tokens=800,
                temperature=0.7,
                stream=True
            )
            collected_content = ""
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    collected_content += content
                    yield content
                    
            if collected_content:
                logger.info(f"回复生成成功 \n {collected_content}")
                # 最后一次yield返回完整内容，用于保存到对话历史
                yield {"type": "complete", "content": collected_content}
            else:
                logger.error("生成的回复为空")
                yield ERROR_MESSAGES['text_generation']
            
        except Exception as e:
            logger.error(f"文字生成错误: {str(e)}")
            yield ERROR_MESSAGES['text_generation']

    async def generate_image(self, image_prompt):
        """
        生成图片
        
        Args:
            image_prompt: 图片生成提示词
            
        Returns:
            生成的图片URL或错误信息
        """
        logger.info(f"正在生成图片... {image_prompt}")
        try:
            result = await self.image_client.images.generate(
                model=os.getenv('AZURE_OPENAI_IMAGE_MODEL'),
                prompt=image_prompt,
                n=1,
                size="1024x1024"
            )
            image_url = json.loads(result.model_dump_json())['data'][0]['url']
            logger.info(f"图片生成成功: {image_url}")
            return image_url
        except Exception as e:
            logger.error(f"图片生成错误: {str(e)}")
            return ERROR_MESSAGES['image_generation']

# 创建全局AI服务实例
ai_service = AzureAIService()