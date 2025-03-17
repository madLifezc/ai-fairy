// history.js
Page({
  data: {
    historyList: []
  },

  onLoad: function() {
    // 从本地存储加载历史记录
    const historyList = wx.getStorageSync('chatHistory') || []
    this.setData({ historyList })
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    this.onLoad()
  }
}) 