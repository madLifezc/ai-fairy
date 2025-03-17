const { getConfig, apiPath } = require('../../config/config');
const request = require('../../utils/request');

Page({
  data: {
    meatCount: 2,
    vegeCount: 2,
    showResult: false,
    meatDishes: [],
    vegeDishes: [],
    loading: false,
    menuContent: '',
    searchText: '',
    imageUrl: '',
    fullContent: '',  // 存储完整的返回内容
    isGeneratingImage: false  // 添加图片生成状态
  },

  // 增减荤菜数量
  increaseMeat() {
    this.setData({
      meatCount: Math.min(5, this.data.meatCount + 1)
    });
  },

  decreaseMeat() {
    this.setData({
      meatCount: Math.max(1, this.data.meatCount - 1)
    });
  },

  // 增减素菜数量
  increaseVege() {
    this.setData({
      vegeCount: Math.min(5, this.data.vegeCount + 1)
    });
  },

  decreaseVege() {
    this.setData({
      vegeCount: Math.max(1, this.data.vegeCount - 1)
    });
  },

  // 处理搜索输入
  onSearchInput(e) {
    this.setData({
      searchText: e.detail.value
    });
  },

  // 解析完整内容中的图片提示词
  parseFullContent() {
    const content = this.data.fullContent;
    const imageMatch = content.match(/image(.*)/s);
    
    console.log("imageMatch" + imageMatch)
    if (imageMatch && imageMatch[1]) {
      // 获取图片标签之前的文本
      const textContent = content.split('image')[0];
      const imagePrompt = imageMatch[1].trim();
      
      // 更新显示内容
      this.setData({
        menuContent: textContent
      });
      
      return imagePrompt;
    }
    
    return '';
  },

  // 生成图片
  async generateImage(prompt) {
    console.log('开始生成图片，提示词:', prompt);
    this.setData({ isGeneratingImage: true });  // 设置生成状态
    try {
      return new Promise((resolve, reject) => {
        wx.request({
          url: getConfig().baseUrl + apiPath.generateImage,
          method: 'POST',
          data: { prompt },
          success: (res) => {
            console.log('生成图片响应:', res);
            if (res.data && res.data.image_url) {
              this.setData({
                imageUrl: res.data.image_url,
                isGeneratingImage: false  // 生成完成
              });
              resolve(res);
            } else {
              console.error('生成图片响应格式错误:', res);
              this.setData({ isGeneratingImage: false });  // 生成失败
              reject(new Error('生成图片响应格式错误'));
            }
          },
          fail: (error) => {
            console.error('生成图片请求失败:', error);
            this.setData({ isGeneratingImage: false });  // 生成失败
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('生成图片失败:', error);
      this.setData({ isGeneratingImage: false });  // 生成失败
      wx.showToast({
        title: '生成图片失败',
        icon: 'none'
      });
      throw error;
    }
  },

  // 生成菜单
  generateMenu() {
    const that = this;
    console.log('开始生成菜单');
    let tempContent = ''; // 使用临时变量累积内容

    that.setData({
      loading: true,
      menuContent: '',
      imageUrl: '',
      fullContent: ''  // 重置完整内容
    });

    try {
      request.stream({
        url: apiPath.aiChat,
        method: 'POST',
        data: {
          text: this.data.searchText 
            ? `请帮我生成${this.data.searchText}的具体用料和详细做法步骤，最后一段需要给一个对应成品图的生图提示词的英文描述，描述内容紧跟在包裹<image>标签后面`
            : `请帮我生成一份今日菜单，包含${this.data.meatCount}个荤菜和${this.data.vegeCount}个素菜，以及用料和详细做法`
        },
        onChunk: (chunk) => {
          try {
            const cleanText = chunk.replace(/data:/g, '');
            // console.log('cleanText' + cleanText)
            if (!cleanText) return;
            
            // 使用临时变量累积
            tempContent += cleanText;
            
            // 实时显示不含图片标签的内容
            const displayText = cleanText.replace(/<image>.*?<\/image>/g, '');
            that.setData({
              menuContent: that.data.menuContent + displayText
            });
          } catch (error) {
            console.error('处理数据块失败:', error);
          }
        },
        onError: (error) => {
          console.error('请求错误:', error);
          that.setData({ loading: false });
          wx.showToast({
            title: '生成失败，请重试',
            icon: 'none'
          });
        },
        onComplete: async () => {
          console.log('请求完成，开始处理完整内容');
          // 在完成时一次性设置完整内容
          that.setData({ 
            fullContent: tempContent,
            loading: false 
          });
          
          console.log('完整内容:', tempContent);
          
          // 在完整内容接收完后，解析图片提示词
          if (that.data.searchText) {
            try {
              const imagePrompt = that.parseFullContent();
              console.log('解析到的图片提示词:', imagePrompt);
              
              if (imagePrompt) {
                console.log('开始调用生成图片');
                await that.generateImage(imagePrompt);
                console.log('图片生成完成');
              } else {
                console.log('未找到图片提示词，完整内容:', that.data.fullContent);
              }
            } catch (error) {
              console.error('图片生成过程出错:', error);
              wx.showToast({
                title: '图片生成失败',
                icon: 'none'
              });
            }
          }
        }
      });

    } catch (error) {
      console.error('执行错误:', error);
      that.setData({
        loading: false
      });
      wx.showToast({
        title: '系统错误，请重试',
        icon: 'none'
      });
    }
  },

  // 重新生成菜单
  regenerateMenu() {
    this.generateMenu();
  },

  // 返回设置
  backToSettings() {
    this.setData({
      showResult: false,
      meatDishes: [],
      vegeDishes: []
    });
  },

  // 显示/隐藏菜品做法
  showRecipe(e) {
    const { type, index } = e.currentTarget.dataset;
    const key = `${type}Dishes[${index}].showRecipe`;
    const dishes = this.data[`${type}Dishes`];
    
    this.setData({
      [key]: !dishes[index].showRecipe
    });
  }
}); 