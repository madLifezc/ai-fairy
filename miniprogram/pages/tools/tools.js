// tools.js
Page({
  data: {
    toolsList: [
      {
        id: 'food',
        name: '今日吃啥',
        icon: '🍳',
        description: '智能推荐美味菜谱'
      }
    ]
  },

  onLoad() {
    
  },

  navigateTo(e) {
    const { url } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/${url}/${url}` });
  }
}); 