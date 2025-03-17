const { getConfig } = require('../config/config');

const request = {
  // 普通HTTP请求
  http: (options) => {
    const config = getConfig();
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${config.baseUrl}${options.url}`,
        method: options.method || 'GET',
        data: options.data,
        header: {
          'content-type': 'application/json',
          ...options.header
        },
        timeout: options.timeout || config.timeout,
        success: (res) => {
          if (config.enableLog) {
            console.log(`API ${options.url} Response:`, res);
          }
          resolve(res);
        },
        fail: (error) => {
          if (config.enableLog) {
            console.error(`API ${options.url} Error:`, error);
          }
          reject(error);
        }
      });
    });
  },

  // 流式请求
  stream: (options) => {
    const config = getConfig();
    let isCompleted = false;
    let lastChunkTime = Date.now();
    let completionTimer = null;
    let responseData = '';

    const requestTask = wx.request({
      url: `${config.baseUrl}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'content-type': 'application/json',
        'Accept': 'text/event-stream',
        ...options.header
      },
      timeout: options.timeout || config.timeout,
      enableChunked: true, // 启用分块传输
      success: (res) => {
        if (config.enableLog) {
          console.log(`Stream API ${options.url} Connected, Status:`, res.statusCode);
        }
        // 检查响应状态
        if (res.statusCode !== 200) {
          if (options.onError) {
            options.onError(new Error(`HTTP ${res.statusCode}`));
          }
          return;
        }
      },
      fail: (error) => {
        if (config.enableLog) {
          console.error(`Stream API ${options.url} Error:`, error);
        }
        if (options.onError) {
          options.onError(error);
        }
      },
      complete: () => {
        // 请求完成时检查是否需要触发完成回调
        if (!isCompleted && responseData) {
          isCompleted = true;
          console.log(`Stream API ${options.url} Completed with data`);
          if (options.onComplete) {
            options.onComplete();
          }
        }
      }
    });

    // 监听数据返回
    requestTask.onChunkReceived((response) => {
      try {
        lastChunkTime = Date.now();
        
        // 将 ArrayBuffer 转换为字符串
        let chunk = '';
        if (response.data instanceof ArrayBuffer) {
          // 使用 Uint8Array 和 decodeURIComponent 处理 UTF-8 编码的数据
          const uint8Array = new Uint8Array(response.data);
          let encodedString = '';
          for (let i = 0; i < uint8Array.length; i++) {
            encodedString += '%' + uint8Array[i].toString(16).padStart(2, '0');
          }
          try {
            chunk = decodeURIComponent(encodedString);
          } catch (e) {
            // 如果解码失败，尝试直接转换
            chunk = String.fromCharCode.apply(null, uint8Array);
          }
        } else {
          // 如果已经是字符串，直接使用
          chunk = response.data;
        }
        
        if (!chunk) return;
        
        responseData += chunk; // 累积接收到的数据
        
        if (options.onChunk) {
          options.onChunk(chunk);
        }

        // 清除之前的定时器
        if (completionTimer) {
          clearTimeout(completionTimer);
        }

        // 设置新的完成检查定时器
        completionTimer = setTimeout(() => {
          const timeElapsed = Date.now() - lastChunkTime;
          if (timeElapsed >= 2000 && !isCompleted) {
            isCompleted = true;
            console.log(`Stream API ${options.url} Completed (No data received for ${timeElapsed}ms)`);
            console.log('Final accumulated data length:', responseData.length);
            if (options.onComplete) {
              options.onComplete();
            }
          }
        }, 2000);

      } catch (error) {
        console.error('处理数据块错误:', error);
        if (options.onError) {
          options.onError(error);
        }
      }
    });

    return requestTask;
  },

  // WebSocket连接
  connectWebSocket: (options) => {
    return new Promise((resolve, reject) => {
      const socketTask = wx.connectSocket({
        url: options.url,
        success: () => {
          if (getConfig().enableLog) {
            console.log('WebSocket连接成功');
          }
          resolve(socketTask);
        },
        fail: (error) => {
          if (getConfig().enableLog) {
            console.error('WebSocket连接失败:', error);
          }
          reject(error);
        }
      });
    });
  }
};

module.exports = request; 