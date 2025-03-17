const { getConfig } = require('./config/config');

App({
  globalData: {
    userInfo: null,
    currentRole: 'nurse',
    socketTask: null,
    messageCallback: null,
    onSocketOpen: null,
    onSocketClose: null,
    onSocketError: null
  },

  onLaunch(options) {
    // 检查页面是否正确注册
    const pages = getCurrentPages()
    console.log('当前页面栈:', pages)
    
    // 错误监听
    wx.onError((error) => {
      console.error('小程序错误:', error)
    })

    // 初始化WebSocket连接
    this.connectWebSocket()
  },

  onError(error) {
    console.error('APP错误:', error)
  },

  connectWebSocket() {
    // 如果已经存在连接，先关闭
    if (this.globalData.socketTask) {
      this.globalData.socketTask.close();
    }

    const socketTask = wx.connectSocket({
      url: getConfig().wsUrl,
      success: () => {
        console.log('WebSocket连接成功：' + getConfig().wsUrl);
      },
      fail: (error) => {
        console.error('WebSocket连接失败:', error);
        // 触发错误回调
        if (this.globalData.onSocketError) {
          this.globalData.onSocketError(error);
        }
      }
    });

    this.globalData.socketTask = socketTask;

    socketTask.onOpen(() => {
      console.log('WebSocket连接已打开');
      if (this.globalData.onSocketOpen) {
        this.globalData.onSocketOpen();
      }
    });

    socketTask.onMessage((res) => {
      if (this.globalData.messageCallback) {
        try {
          const data = JSON.parse(res.data);
          this.globalData.messageCallback(data);
        } catch (error) {
          console.error('消息解析错误:', error);
        }
      }
    });

    socketTask.onError((error) => {
      console.error('WebSocket错误:', error);
      if (this.globalData.onSocketError) {
        this.globalData.onSocketError(error);
      }
    });

    socketTask.onClose(() => {
      console.log('WebSocket连接已关闭');
      this.globalData.socketTask = null;
      if (this.globalData.onSocketClose) {
        this.globalData.onSocketClose();
      }
      // 自动重连
      setTimeout(() => {
        this.connectWebSocket();
      }, 3000);
    });
  },

  // 发送消息的统一接口
  sendSocketMessage(data) {
    if (this.globalData.socketTask) {
      this.globalData.socketTask.send({
        data: JSON.stringify(data)
      });
    } else {
      console.warn('WebSocket未连接');
      // 尝试重新连接
      this.connectWebSocket();
    }
  },

  // 关闭WebSocket连接
  closeWebSocket() {
    if (this.globalData.socketTask) {
      this.globalData.socketTask.close();
      this.globalData.socketTask = null;
    }
  }
}); 