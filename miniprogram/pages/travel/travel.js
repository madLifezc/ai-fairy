const app = getApp();
const { getConfig, apiPath } = require('../../config/config');

Page({
  data: {
    inputValue: '',
    chatList: [],
    scrollToView: '',
    loading: false,
    currentStreamContent: '' // 用于存储当前流式接收的内容
  },

  onLoad() {
    // 页面加载时的初始化逻辑
  },

  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  async sendMessage() {
    const { inputValue, chatList } = this.data;
    if (!inputValue.trim() || this.data.loading) return;

    // 添加用户消息
    const newChatList = [...chatList, {
      type: 'user',
      content: inputValue
    }];

    // 添加一个空的助手消息，用于接收流式数据
    const assistantMessageIndex = newChatList.length;
    newChatList.push({
      type: 'assistant',
      content: ''
    });

    this.setData({
      chatList: newChatList,
      inputValue: '',
      loading: true,
      currentStreamContent: '',
      scrollToView: `msg-${assistantMessageIndex}`
    });

    let isCompleted = false; // 添加标志位跟踪请求是否完成

    try {
      const config = getConfig();
      console.log('Sending request to:', `${config.baseUrl}${apiPath.travelPlan}`);
      
      const requestTask = wx.request({
        url: `${config.baseUrl}${apiPath.travelPlan}`,
        method: 'POST',
        data: {
          content: `${inputValue}`
        },
        timeout: config.timeout,
        enableChunked: true,
        enableHttp2: true,
        responseType: 'text',
        header: {
          'content-type': 'application/json',
          'Accept': 'text/event-stream'
        },
        success: (res) => {
          if (res.statusCode !== 200) {
            console.error('Request failed:', res);
            const updatedChatList = [...this.data.chatList];
            updatedChatList[assistantMessageIndex].content = '获取旅游计划失败，请重试';
            
            this.setData({
              chatList: updatedChatList,
              scrollToView: `msg-${assistantMessageIndex}`,
              loading: false
            });
            
            wx.showToast({
              title: '获取旅游计划失败，请重试',
              icon: 'none',
              duration: 2000
            });
          }
        },
        fail: (err) => {
          console.error('Request failed with error:', err);
          const updatedChatList = [...this.data.chatList];
          updatedChatList[assistantMessageIndex].content = '获取旅游计划失败，请重试';
          
          this.setData({
            chatList: updatedChatList,
            scrollToView: `msg-${assistantMessageIndex}`,
            loading: false
          });
          
          wx.showToast({
            title: '获取旅游计划失败，请重试',
            icon: 'none',
            duration: 2000
          });
        },
        complete: () => {
          console.log('Request completed');
          // 如果流式传输已经结束，则重置loading状态
          if (isCompleted) {
            this.setData({ loading: false });
          }
        }
      });

      // 监听数据接收
      requestTask.onChunkReceived((response) => {
        try {
          if (response.data) {
            let chunk;
            if (response.data instanceof ArrayBuffer) {
              // 使用更可靠的方式处理中文字符
              const uint8Array = new Uint8Array(response.data);
              let binaryString = '';
              uint8Array.forEach(byte => {
                binaryString += String.fromCharCode(byte);
              });
              // 使用 decodeURIComponent 和 escape 来正确处理中文
              chunk = decodeURIComponent(escape(binaryString));
            } else if (typeof response.data === 'object') {
              chunk = JSON.stringify(response.data);
            } else {
              chunk = response.data.toString();
            }
            
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                let parsedChunk;
                if (typeof line === 'object') {
                  parsedChunk = line;
                } else {
                  parsedChunk = JSON.parse(line);
                }
                
                if (parsedChunk.type === 'chunk') {
                  const updatedChatList = [...this.data.chatList];
                  const currentContent = updatedChatList[assistantMessageIndex].content;
                  updatedChatList[assistantMessageIndex].content = currentContent + parsedChunk.content;
                  
                  this.setData({
                    chatList: updatedChatList,
                    scrollToView: `msg-${assistantMessageIndex}`
                  });
                } else if (parsedChunk.type === 'error') {
                  console.error('Received error chunk:', parsedChunk.content);
                  wx.showToast({
                    title: parsedChunk.content,
                    icon: 'none',
                    duration: 2000
                  });
                  this.setData({ loading: false });
                } else if (parsedChunk.type === 'end') {
                  console.log('Stream ended');
                  isCompleted = true; // 标记流式传输已完成
                  this.setData({ loading: false });
                }
              } catch (parseError) {
                console.error('Error parsing line:', line);
                console.error('Parse error:', parseError);
              }
            }
          }
        } catch (error) {
          console.error('Error in onChunkReceived:', error);
          this.setData({ loading: false });
        }
      });
    } catch (error) {
      console.error('Error in sendMessage:', error);
      wx.showToast({
        title: '获取旅游计划失败，请重试',
        icon: 'none',
        duration: 2000
      });
      this.setData({ loading: false });
    }
  }
}); 