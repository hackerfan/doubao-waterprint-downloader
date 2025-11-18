document.addEventListener('DOMContentLoaded', function() {
  const refreshButton = document.getElementById('refreshButton');
  const statusText = document.getElementById('statusText');
  
  refreshButton.addEventListener('click', function() {
    statusText.textContent = '正在刷新豆包页面...';
    
    // 获取当前活动标签页
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('doubao.com')) {
        // 刷新当前页面
        chrome.tabs.reload(tabs[0].id, {}, function() {
          statusText.textContent = '页面已刷新，请等待完全加载后再使用下载功能';
        });
      } else {
        statusText.textContent = '请先打开豆包网站 (www.doubao.com)';
      }
    });
  });
});