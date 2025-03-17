// profile.js
Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    menuItems: [
      {
        id: 'history',
        title: '聊天记录',
        description: '查看历史对话记录',
        icon: '/images/profile/history.png'
      },
      {
        id: 'settings',
        title: '通用设置',
        description: '偏好设置',
        icon: '/images/profile/settings.png'
      },
      {
        id: 'feedback',
        title: '意见反馈',
        description: '帮助我们改进',
        icon: '/images/profile/feedback.png'
      },
      {
        id: 'about',
        title: '关于我们',
        description: '了解更多信息',
        icon: '/images/profile/about.png'
      }
    ]
  },

  onLoad() {
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo,
        hasUserInfo: true
      })
    }
  },

  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo
        wx.setStorageSync('userInfo', userInfo)
        this.setData({
          userInfo,
          hasUserInfo: true
        })
      }
    })
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        // 这里可以上传头像到服务器
        this.setData({
          'userInfo.avatarUrl': tempFilePath
        })
      }
    })
  },

  handleMenuClick(e) {
    const id = e.currentTarget.dataset.id
    switch (id) {
      case 'history':
        wx.navigateTo({
          url: '/pages/history/history'
        })
        break
      case 'settings':
        wx.navigateTo({
          url: '/pages/settings/settings'
        })
        break
      case 'feedback':
        wx.navigateTo({
          url: '/pages/feedback/feedback'
        })
        break
      case 'about':
        wx.navigateTo({
          url: '/pages/about/about'
        })
        break
    }
  },

  navigateTo(e) {
    const { url } = e.currentTarget.dataset
    wx.navigateTo({ url })
  }
}) 