// 这个脚本将被注入到页面中，用于拦截网络请求
(function() {
  console.log('[Doubao Tool] 注入脚本已加载');
  
  // 保存原始的fetch函数
  const originalFetch = window.fetch;
  
  // 重写fetch函数
  window.fetch = function(...args) {
    const [url, options] = args;
    console.log('[Doubao Tool] Fetch拦截到请求:', url);
    
    // 检查是否是图片生成API请求
    if (url.includes('/im/chain/single') && options && options.method === 'POST') {
      console.log('[Doubao Tool] Fetch检测到豆包图片API请求，开始处理响应');
      
      // 在请求完成后处理响应
      return originalFetch.apply(this, args).then(response => {
        console.log('[Doubao Tool] Fetch豆包API响应状态:', response.status);
        
        // 克隆响应以便处理
        const clonedResponse = response.clone();
        
        // 解析JSON响应
        clonedResponse.json().then(data => {
          console.log('[Doubao Tool] Fetch豆包API响应数据:', data);
          processApiResponse(data);
        }).catch(err => {
          console.error('[Doubao Tool] Fetch解析豆包API响应JSON时出错:', err);
        });
        
        return response;
      });
    }
    
    // 对于其他请求，使用原始fetch
    return originalFetch.apply(this, args);
  };
  
  // 拦截XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  
  window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    
    // 保存原始的open和send方法
    const originalOpen = xhr.open;
    const originalSend = xhr.send;
    
    // 重写open方法
    xhr.open = function(method, url, ...args) {
      this._url = url;
      console.log('[Doubao Tool] XHR拦截到请求:', method, url);
      return originalOpen.apply(this, [method, url, ...args]);
    };
    
    // 重写send方法
    xhr.send = function(data) {
      // 添加事件监听器
      xhr.addEventListener('load', () => {
        // 检查URL是否包含图片生成API
        if (this._url && this._url.includes('/im/chain/single')) {
          console.log('[Doubao Tool] XHR检测到豆包图片API响应');
          try {
            // 尝试解析JSON响应
            const responseData = JSON.parse(this.responseText);
            console.log('[Doubao Tool] XHR豆包API响应数据:', responseData);
            processApiResponse(responseData);
          } catch (error) {
            console.error('[Doubao Tool] XHR解析豆包API响应JSON时出错:', error);
          }
        }
      });
      
      return originalSend.apply(this, arguments);
    };
    
    return xhr;
  };
  
  // 处理API响应的函数
  function processApiResponse(data) {
    try {
      // 提取无水印图片URL
      const messages = data.downlink_body?.pull_singe_chain_downlink_body?.messages;
      console.log('[Doubao Tool] 提取的消息数量:', messages ? messages.length : 0);
      
      if (messages && messages.length > 0) {
        // 查找包含图片的消息
        for (const message of messages) {
          console.log('[Doubao Tool] 处理消息:', {
            user_type: message.user_type,
            content_type: message.content_type
          });
          
          if (message.user_type === 2 && message.content_type === 9999) {
            const content = JSON.parse(message.content);
            console.log('[Doubao Tool] 解析内容块数量:', content.length);
            
            // 查找图片块
            const imageBlock = content.find(block => 
              block.block_type === 2074 && 
              block.content.creation_block
            );
            
            if (imageBlock) {
              console.log('[Doubao Tool] 找到图片块');
              const creations = imageBlock.content.creation_block.creations;
              console.log('[Doubao Tool] 图片创建项数量:', creations ? creations.length : 0);
              
              if (creations) {
                const images = creations
                  .filter(item => item.type === 1 && item.image)
                  .map(item => {
                    const image = item.image;
                    return {
                      id: item.image.key,
                      prompt: image.gen_params.prompt,
                      rawUrl: image.image_ori_raw?.url,
                      thumbUrl: image.image_thumb?.url
                    };
                  });
                
                console.log('[Doubao Tool] 提取的图片数量:', images.length);
                console.log('[Doubao Tool] 提取的图片数据:', images);
                
                if (images.length > 0) {
                  // 触发自定义事件，将图片数据传递给content script
                  console.log('[Doubao Tool] 触发doubaoImagesFound事件');
                  window.dispatchEvent(new CustomEvent('doubaoImagesFound', { 
                    detail: { images } 
                  }));
                } else {
                  console.log('[Doubao Tool] 没有找到有效的图片');
                }
              }
            } else {
              console.log('[Doubao Tool] 没有找到图片块');
            }
          }
        }
      } else {
        console.log('[Doubao Tool] 响应中没有消息或消息为空');
      }
    } catch (error) {
      console.error('[Doubao Tool] 处理豆包API响应时出错:', error);
    }
  }
})();