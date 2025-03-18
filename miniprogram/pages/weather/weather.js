// weather.js
const { getConfig, apiPath } = require('../../config/config');
Page({
  data: {
    city: '',
    loading: false,
    showResult: false,
    weatherData: null
  },

  generateReport() {
    if (!this.data.city) {
      wx.showToast({
        title: '请输入城市名称',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    // 调用服务端接口
    wx.request({
      url: getConfig().baseUrl + apiPath.weather,
      method: 'POST',
      data: {
        city: this.data.city
      },
      success: (res) => {
        if (res.data.code === 200) {
          // 处理响应数据
          const responseData = res.data.data;
          console.log("类型= " , typeof res.data.data === 'string');
          console.log(Object.keys(responseData)); // 打印所有键名
          const city = responseData['city'] || '未知城市';
          console.log('weather responseData === ', responseData);
          console.log('weather responseData.city === ', city);
          
          // 格式化日期
          const date = new Date();
          const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          
          this.setData({
            weatherData: {
              city: responseData.city,
              image_url: responseData.img || 'https://example.com/default.jpg',
              poem: responseData.poetry || '晴日暖阳倾滕州，微风轻舞韵如初。',
              date: `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`,
              weekday: weekdays[date.getDay()],
              weather: responseData.condition || '晴',
              temp_high: responseData.temp_high || 13,
              temp_low: responseData.temp_low || 1
            },
            showResult: true
          });
        } else {
          wx.showToast({
            title: res.data.message || '生成失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        console.error('请求失败：', error);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  modifyCity() {
    this.setData({
      showResult: false,
      city: ''
    });
  }
}); 