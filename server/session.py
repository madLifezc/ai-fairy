import logging
from server.config.prompts import AI_ROLE_PROMPTS, ERROR_MESSAGES
from server.util.ai_service import ai_service

logger = logging.getLogger(__name__)

class ClientSession:
    def __init__(self, client_id: str):
        self.client_id = client_id
        self.current_role = 'nurse'
        self.system_prompt = AI_ROLE_PROMPTS[self.current_role]
        self.conversation_history = []
        
    def change_role(self, new_role: str) -> bool:
        """
        切换AI角色
        
        Args:
            new_role: 新的角色名称
            
        Returns:
            是否切换成功
        """
        if new_role in AI_ROLE_PROMPTS:
            self.current_role = new_role
            self.system_prompt = AI_ROLE_PROMPTS[new_role]
            self.conversation_history = []  # 清空对话历史
            logger.info(f"客户端 {self.client_id} 角色已切换为: {new_role}")
            return True
        return False
        
    async def generate_response(self, user_input: str):
        """
        流式生成回复
        
        Args:
            user_input: 用户输入的消息
            
        Yields:
            生成的回复消息片段
        """
        # 将用户输入添加到对话历史
        self.conversation_history.append({"role": "user", "content": user_input})
        messages = [{"role": "system", "content": self.system_prompt}] + self.conversation_history[-5:]
        logger.info(f"客户端 {self.client_id} 正在生成回复...")
        
        collected_reply = ""
        # 使用AI服务流式生成文本回复
        async for chunk in ai_service.generate_text(messages):
            if isinstance(chunk, dict) and chunk.get("type") == "complete":
                collected_reply = chunk["content"]
            elif isinstance(chunk, str):
                if chunk == ERROR_MESSAGES['text_generation']:
                    logger.warning(f"客户端 {self.client_id} 文本生成失败")
                    yield {"type": "error", "content": chunk}
                    return
                else:
                    yield {"type": "text_stream", "content": chunk}
        try:
            # 将AI助手回复添加到对话历史
            self.conversation_history.append({"role": "assistant", "content": collected_reply})
            # 截取回复中的<文字回复>和</文字回复>之间的内容
            image_prompt = collected_reply.split('<生图提示词>')[1].split('</生图提示词>')[0].strip().replace('\n', '')
            if image_prompt != "无":
                # 发送生图提示
                logger.info(f"客户端 {self.client_id} 开始生成图片，提示词: {image_prompt}")
                yield {"type": "system", "content": "🎨 奴家正在快马加鞭生成图片，还望小主您稍等片刻呐..."}
                # 生成图片
                image_url = await ai_service.generate_image(image_prompt)
                if image_url == ERROR_MESSAGES['image_generation']: # 如果图片生成失败，返回错误信息
                    logger.error(f"客户端 {self.client_id} 图片生成失败")
                    yield {"type": "error", "content": image_url}
                else:
                    logger.info(f"客户端 {self.client_id} 图片生成成功: {image_url}")
                    yield {"type": "image", "content": image_url} # 返回图片URL
                    
        except Exception as e:
            logger.error(f"处理回复时出错: {str(e)}")
            yield {"type": "error", "content": ERROR_MESSAGES['text_generation']} 