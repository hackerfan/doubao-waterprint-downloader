// 后台脚本，用于处理下载请求
console.log('[Doubao Tool] Background script loaded');

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Doubao Tool] 收到消息:', request);
  
  if (request.action === 'downloadImage') {
    console.log('[Doubao Tool] 开始下载图片:', request.url);
    
    // 使用Chrome下载API
    chrome.downloads.download({
      url: request.url,
      filename: request.filename,
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('[Doubao Tool] 下载失败:', chrome.runtime.lastError);
        sendResponse({ 
          success: false, 
          error: chrome.runtime.lastError.message 
        });
      } else {
        console.log('[Doubao Tool] 下载成功，下载ID:', downloadId);
        sendResponse({ 
          success: true 
        });
      }
    });
    
    // 返回true表示将异步发送响应
    return true;
  }
  
  // 对于其他类型的消息，返回空响应
  return sendResponse({});
});