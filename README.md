# AI 故事讲述者

这是一个基于WebSocket的AI故事讲述应用，它能够根据用户的输入生成文字或图片回复。

## 功能特点

- 实时WebSocket通信
- 智能判断是否需要生成图片
- 支持连续对话
- 现代化的用户界面

## 环境要求

- Python 3.7+
- Azure OpenAI API访问权限

## 安装步骤

1. 克隆项目并安装依赖：
```bash
pip install -r requirements.txt
```

2. 配置环境变量：
- 复制`.env.example`文件为`.env`
- 在`.env`文件中填入你的Azure OpenAI API密钥和终端点URL

## 运行应用

1. 启动服务器：
```bash
python server/main.py
```

2. 在浏览器中访问：
```
http://localhost:8000
```

## 使用说明

1. 在输入框中输入你想要的故事情节或场景描述
2. 如果描述包含视觉元素（如场景、外观等），AI会生成相应的图片
3. 如果是对话或情节发展，AI会用文字回复
4. 保持对话来继续发展故事

## 注意事项

- 确保你有足够的Azure OpenAI API配额
- 图片生成可能需要一些时间，请耐心等待
- 建议使用现代浏览器以获得最佳体验 


# 