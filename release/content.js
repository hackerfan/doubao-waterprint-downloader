// 注入脚本到页面
console.log('[Doubao Tool] Content script 已加载');
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
(document.head || document.documentElement).appendChild(script);
console.log('[Doubao Tool] 注入脚本已添加到页面');

// 存储检测到的图片
let detectedImages = [];
console.log('[Doubao Tool] 初始化检测图片数组');

// 创建下载按钮
function createDownloadButton() {
  console.log('[Doubao Tool] 开始创建下载按钮');
  
  // 检查是否已存在按钮
  if (document.getElementById('doubao-download-btn')) {
    console.log('[Doubao Tool] 下载按钮已存在，跳过创建');
    return;
  }

  const downloadBtn = document.createElement('div');
  downloadBtn.id = 'doubao-download-btn';
  downloadBtn.innerHTML = '下载';
  downloadBtn.className = 'doubao-download-btn';
  console.log('[Doubao Tool] 下载按钮元素已创建');
  
  // 将按钮添加到页面顶部中间
  const topNav = document.querySelector('.header') || document.querySelector('nav') || document.body;
  if (topNav) {
    topNav.appendChild(downloadBtn);
    console.log('[Doubao Tool] 下载按钮已添加到导航栏');
  } else {
    document.body.appendChild(downloadBtn);
    console.log('[Doubao Tool] 下载按钮已添加到页面body');
  }
  
  // 点击按钮时显示图片选择弹窗
  downloadBtn.addEventListener('click', showImageSelector);
  console.log('[Doubao Tool] 下载按钮点击事件已绑定');
}

// 显示图片选择弹窗
function showImageSelector() {
  console.log('[Doubao Tool] 显示图片选择弹窗');
  console.log('[Doubao Tool] 当前检测到的图片数量:', detectedImages.length);
  
  if (detectedImages.length === 0) {
    console.log('[Doubao Tool] 没有检测到图片，显示提示');
    alert('暂无检测到生成的图片，请先生成图片后再试。');
    return;
  }

  console.log('[Doubao Tool] 创建图片选择弹窗');
  console.log('[Doubao Tool] 图片数据详情:', detectedImages);
  
  // 创建弹窗
  const modal = document.createElement('div');
  modal.className = 'doubao-modal';
  modal.innerHTML = `
    <div class="doubao-modal-content">
      <div class="doubao-modal-header">
        <h3>选择要下载的图片</h3>
        <span class="doubao-close-btn">&times;</span>
      </div>
      <div class="doubao-modal-body">
        ${detectedImages.map((img, index) => `
          <div class="doubao-image-item" data-index="${index}">
            <img src="${img.rawUrl || img.thumbUrl}" alt="生成的图片 ${index + 1}" />
            <div class="doubao-image-info">
              <p>提示词: ${img.prompt ? img.prompt.substring(0, 50) + '...' : '无提示词'}</p>
              <p>状态: ${img.rawUrl ? '无水印' : '仅预览'}</p>
              <button class="doubao-download-image-btn" data-index="${index}">下载</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  console.log('[Doubao Tool] 图片选择弹窗已添加到页面');

  // 添加事件监听器
  const closeBtn = modal.querySelector('.doubao-close-btn');
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
    console.log('[Doubao Tool] 图片选择弹窗已关闭');
  });

  // 点击模态框外部关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
      console.log('[Doubao Tool] 图片选择弹窗已关闭（点击外部）');
    }
  });

  // 添加下载按钮点击事件
  const downloadButtons = modal.querySelectorAll('.doubao-download-image-btn');
  console.log('[Doubao Tool] 添加下载按钮事件，按钮数量:', downloadButtons.length);
  downloadButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      console.log('[Doubao Tool] 下载按钮点击，索引:', index);
      const image = detectedImages[index];
      if (image && image.rawUrl) {
        console.log('[Doubao Tool] 开始下载图片:', image.rawUrl);
        // 使用Chrome扩展API下载
        chrome.runtime.sendMessage({
          action: 'downloadImage',
          url: image.rawUrl,
          filename: `doubao_image_${image.id.substring(image.id.lastIndexOf('/') + 1)}`
        }, response => {
          if (response && response.success) {
            console.log('[Doubao Tool] 图片下载成功');
            alert('图片已开始下载!');
          } else {
            console.error('[Doubao Tool] 下载失败:', response ? response.error : '未知错误');
            alert('下载失败: ' + (response ? response.error : '未知错误'));
          }
        });
      } else {
        console.log('[Doubao Tool] 图片URL不存在:', image);
        alert('无水印图片URL不可用，请稍后再试');
      }
    });
  });
}

// 已移除下载函数，改为通过消息传递处理下载
// function downloadImage(url, filename) {
//   console.log('[Doubao Tool] 开始下载图片:', { url, filename });
//   chrome.downloads.download({
//     url: url,
//     filename: filename,
//     saveAs: true
//   }, (downloadId) => {
//     if (chrome.runtime.lastError) {
//       console.error('[Doubao Tool] 下载失败:', chrome.runtime.lastError);
//       alert('下载失败: ' + chrome.runtime.lastError.message);
//     } else {
//       console.log('[Doubao Tool] 下载成功，下载ID:', downloadId);
//       alert('图片已开始下载!');
//     }
//   });
// }

// 监听来自注入脚本的图片检测事件
window.addEventListener('doubaoImagesFound', (event) => {
  console.log('[Doubao Tool] 接收到doubaoImagesFound事件');
  const { images } = event.detail;
  console.log('[Doubao Tool] 事件中的图片数据:', images);
  
  if (images && images.length > 0) {
    detectedImages = images;
    console.log('[Doubao Tool] 检测到豆包生成的图片:', images);
    console.log('[Doubao Tool] 当前detectedImages数组:', detectedImages);
  } else {
    console.log('[Doubao Tool] 事件中没有有效图片');
  }
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Doubao Tool] DOM内容已加载');
  // 等待页面加载完成后再创建按钮
  setTimeout(createDownloadButton, 1000);
});

// 如果页面已经加载完成，立即创建按钮
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('[Doubao Tool] 页面已加载完成，当前状态:', document.readyState);
  setTimeout(createDownloadButton, 1000);
} else {
  console.log('[Doubao Tool] 页面尚未加载完成，当前状态:', document.readyState);
}

// 添加一个定期检查按钮的函数，确保按钮存在
setInterval(() => {
  if (!document.getElementById('doubao-download-btn')) {
    console.log('[Doubao Tool] 下载按钮不存在，尝试重新创建');
    createDownloadButton();
  }
}, 5000); // 每5秒检查一次