// tools.js
Page({
  data: {
    toolsList: [
      {
        id: 'food',
        name: '今日吃啥',
        icon: '🍳',
        description: '智能推荐美味菜谱'
      },
      {
        id: 'weather',
        name: '城市天气画报',
        icon: '🌤️',
        description: '生成精美天气画报'
      },
      {
        id: 'travel',
        name: '旅游助手',
        icon: '🌎',
        description: '智能规划旅游行程'
      }
    ]
  },

  onLoad() {
    console.log('工具页面加载');
    console.log('工具列表：', this.data.toolsList);
  },

  navigateTo(e) {
    const { url } = e.currentTarget.dataset;
    console.log('跳转到页面：', url);
    wx.navigateTo({
      url: `/pages/${url}/${url}`,
      fail: (err) => {
        console.error('页面跳转失败：', err);
        wx.showToast({
          title: '页面加载失败',
          icon: 'none'
        });
      }
    });
  }
}); 