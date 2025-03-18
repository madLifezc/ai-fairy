const config = {
  // 开发环境配置
  development: {
    baseUrl: 'http://localhost:9100/api',
    wsUrl: 'ws://localhost:9100/ws',  // 添加 WebSocket URL
    timeout: 30000,
    enableLog: true
  },
  // 生产环境配置
  production: {
    baseUrl: 'http://124.222.228.25:9100/api',
    wsUrl: 'ws://124.222.228.25:9100/ws',  // 添加生产环境 WebSocket URL
    timeout: 30000,
    enableLog: false
  }
};

// 根据环境返回对应配置 可以通过小程序环境变量或者手动设置
// const env = 'development';  
const env = 'production';

const getConfig = () => {
  return config[env];
};

// API路径配置
const apiPath = {
  aiChat: '/aichat',// 对话接口
  generateImage: '/generate_image',  // 添加生成图片接口
  weather: '/weather',  // 添加天气接口
  // 在这里添加其他API路径
};

module.exports = {
  getConfig,
  apiPath
}; 