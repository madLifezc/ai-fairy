// feedback.js
Page({
  data: {
    selectedType: '',
    content: '',
    contentLength: 0,
    contact: '',
    canSubmit: false
  },

  selectType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ 
      selectedType: type 
    })
    this.checkCanSubmit()
  },

  handleInput(e) {
    const content = e.detail.value
    this.setData({
      content,
      contentLength: content.length
    })
    this.checkCanSubmit()
  },

  handleContactInput(e) {
    this.setData({
      contact: e.detail.value
    })
  },

  checkCanSubmit() {
    const { selectedType, content } = this.data
    const canSubmit = selectedType && content.length > 0
    this.setData({ canSubmit })
  },

  submitFeedback() {
    if (!this.data.canSubmit) return

    const { selectedType, content, contact } = this.data
    
    // 这里可以添加提交到服务器的逻辑
    console.log('提交反馈:', {
      type: selectedType,
      content,
      contact
    })

    wx.showToast({
      title: '提交成功',
      icon: 'success',
      success: () => {
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  }
}) 