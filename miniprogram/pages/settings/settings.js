// settings.js
Page({
  data: {
    settings: {
      darkMode: false,
      notifications: true,
      sound: true,
      autoSave: true
    }
  },

  onLoad: function() {
    // 从本地存储加载设置
    const settings = wx.getStorageSync('settings')
    if (settings) {
      this.setData({ settings })
    }
  },

  toggleDarkMode: function(e) {
    this.updateSetting('darkMode', e.detail.value)
  },

  toggleNotifications: function(e) {
    this.updateSetting('notifications', e.detail.value)
  },

  toggleSound: function(e) {
    this.updateSetting('sound', e.detail.value)
  },

  toggleAutoSave: function(e) {
    this.updateSetting('autoSave', e.detail.value)
  },

  updateSetting: function(key, value) {
    const settings = this.data.settings
    settings[key] = value
    this.setData({ settings })
    wx.setStorageSync('settings', settings)
  },

  clearCache: function() {
    wx.showModal({
      title: '确认清除',
      content: '这将清除所有本地缓存数据，包括聊天记录',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: () => {
              wx.showToast({
                title: '清除成功',
                icon: 'success'
              })
              // 重置设置为默认值
              this.setData({
                settings: {
                  darkMode: false,
                  notifications: true,
                  sound: true,
                  autoSave: true
                }
              })
            }
          })
        }
      }
    })
  }
}) 