const app = getApp()

Page({
  data: {
    isLoading: true,
    isConnected: false,
    inputMessage: '',
    messages: [],
    scrollTop: 0,
    roleIndex: 0,
    roleList: [
      { id: 'nurse', name: '👩‍⚕️ 护理专家' },
      { id: 'storyteller', name: '✨ 故事讲述者' },
      { id: 'rpg-master', name: '🎲 RPG主持人' },
      { id: 'artist', name: '🎨 艺术助手' },
      { id: 'teacher', name: '📚 教育辅导' }
    ],
    currentRole: { id: 'nurse', name: '👩‍⚕️ 护理专家' },
    quickPhrases: [
      { text: '简单介绍一下你自己' },
      { text: '人生的意义是什么' },
      { text: '人生苦短，放过自己，也放过他人' }
    ],
    keyboardHeight: 0
  },

  onLoad() {
    // 设置WebSocket回调
    this.setupWebSocket()
  },

  onShow() {
    // 页面显示时，如果没有连接则尝试重新连接
    if (!app.globalData.socketTask) {
      app.connectWebSocket();
    }
  },

  onUnload() {
    // 清除回调
    app.globalData.messageCallback = null
    app.globalData.onSocketOpen = null
    app.globalData.onSocketClose = null
    app.globalData.onSocketError = null
  },

  setupWebSocket() {
    // 设置消息回调
    app.globalData.messageCallback = this.handleMessage.bind(this)
  
    // 设置连接打开回调
    app.globalData.onSocketOpen = () => {
      this.setData({ 
        isLoading: false,
        isConnected: true
      })
      // 连接建立后发送角色信息
      app.sendSocketMessage({
        type: 'change_role',
        role: this.data.currentRole.id
      })
    }
  
    // 设置连接关闭回调
    app.globalData.onSocketClose = () => {
      this.setData({ 
        isLoading: true,
        isConnected: false
      })
      this.addMessage('system', '⚠️ 连接已断开，正在重新连接...')
    }
  
    // 设置错误回调
    app.globalData.onSocketError = (error) => {
      console.error('WebSocket错误:', error)
      this.setData({ 
        isLoading: true,
        isConnected: false
      })
      this.addMessage('system', '❌ 连接出错，请检查网络后重试')
    }
  
    // 如果WebSocket已经连接，直接设置状态
    if (app.globalData.socketTask) {
      this.setData({ 
        isLoading: false,
        isConnected: true
      })
    }
  },

  scrollToBottom() {
    wx.createSelectorQuery()
      .select('#messages-container')
      .boundingClientRect(rect => {
        if (rect) {
          this.setData({
            scrollTop: rect.height
          });
        }
      })
      .exec();
  },

  handleMessage(data) {
    if (data.type === 'text_stream') {
      const messages = this.data.messages
      let lastMessage = messages[messages.length - 1]
      
      if (!lastMessage || lastMessage.sender !== 'ai') {
        lastMessage = {
          id: Date.now(),
          sender: 'ai',
          role: this.data.currentRole.id,
          content: ''
        }
        messages.push(lastMessage)
      }

      let buffer = lastMessage.buffer || ''
      buffer += data.content
      lastMessage.buffer = buffer

      const startTag = '<文字回复>'
      const endTag = '</文字回复>'
      const startIndex = buffer.indexOf(startTag)
      if (startIndex !== -1) {
        const endIndex = buffer.indexOf(endTag, startIndex)
        if (endIndex !== -1) {
          const replyText = buffer.substring(startIndex + startTag.length, endIndex)
            .replace(/^\n+|\n+$/g, '')
          lastMessage.content = replyText
        } else {
          const replyText = buffer.substring(startIndex + startTag.length)
            .replace(/^\n+/g, '')
          lastMessage.content = replyText
        }
      }

      this.setData({ messages }, () => {
        setTimeout(() => {
          this.scrollToBottom()
        }, 100)
      })
    } else if (data.type === 'welcome') {
      // 处理服务端的欢迎消息
      this.addMessage('ai', data.content)
    } else if (data.type === 'system') {
      this.addMessage('system', data.content)
    } else if (data.type === 'error') {
      this.addMessage('system', `❌ ${data.content}`)
    } else if (data.type === 'image') {
      const messages = this.data.messages
      const lastMessage = messages[messages.length - 1]
      
      if (lastMessage && lastMessage.sender === 'ai') {
        lastMessage.image = data.content
        this.setData({ messages }, () => {
          setTimeout(() => {
            this.scrollToBottom()
          }, 100)
        })
      } else {
        this.addMessage('ai', '', data.content)
      }
    }
  },

  addMessage(sender, content, image = '') {
    const message = {
      id: Date.now(),
      sender,
      role: sender === 'ai' ? this.data.currentRole.id : '',
      content,
      image
    }

    const messages = this.data.messages.concat(message)
    this.setData({
      messages,
      scrollToMessage: `msg-${message.id}`
    }, () => {
      this.scrollToBottom()
    })
  },

  handleInput(e) {
    this.setData({
      inputMessage: e.detail.value
    })
  },

  sendMessage() {
    const message = this.data.inputMessage.trim()
    if (message) {
      this.addMessage('user', message)
      app.sendSocketMessage({
        type: 'message',
        content: message
      })
      this.setData({ 
        inputMessage: '' 
      }, () => {
        this.scrollToBottom()
      })
      wx.hideKeyboard();  // 收起键盘
    }
  },

  sendQuickPhrase(e) {
    const { text } = e.currentTarget.dataset
    if (text) {
      this.addMessage('user', text)
      app.sendSocketMessage({
        type: 'message',
        content: text
      })
      this.scrollToBottom()
    }
  },

  handleRoleChange(e) {
    const index = parseInt(e.detail.value)
    const role = this.data.roleList[index]
    this.setData({
      roleIndex: index,
      currentRole: role
    })
    
    // 发送角色切换消息
    app.sendSocketMessage({
      type: 'change_role',
      role: role.id
    })
    this.addMessage('system', `已切换到《${role.name}》角色`)
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      urls: [url],
      current: url
    })
  },

  onScrollToUpper() {
    // 可以在这里实现加载更多历史消息的功能
    console.log('滚动到顶部')
  },

  onInputFocus(e) {
    const { height } = e.detail;
    this.setData({
      keyboardHeight: height
    });
    this.scrollToBottom();
  },

  onInputBlur() {
    this.setData({
      keyboardHeight: 0
    });
  }
}) 