// 高级代码保护方案
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');

// 方案1: 分离敏感逻辑到后台服务器
function createServerBasedVersion() {
  console.log('创建服务器版本...');
  
  // 创建一个新的content.js，移除核心逻辑
  const protectedContentJS = `
    // 受保护的内容脚本 - 仅包含UI和基本通信逻辑
    let detectedImages = [];
    
    // 创建下载按钮
    function createDownloadButton() {
      if (document.getElementById('doubao-download-btn')) return;
      
      const downloadBtn = document.createElement('div');
      downloadBtn.id = 'doubao-download-btn';
      downloadBtn.innerHTML = '下载';
      downloadBtn.className = 'doubao-download-btn';
      
      const topNav = document.querySelector('.header') || document.querySelector('nav') || document.body;
      if (topNav) {
        topNav.appendChild(downloadBtn);
      }
      
      downloadBtn.addEventListener('click', showImageSelector);
    }
    
    // 显示图片选择弹窗 - 从服务器获取数据
    function showImageSelector() {
      // 向扩展发送请求，从服务器获取图片数据
      chrome.runtime.sendMessage({action: "getImages"}, function(response) {
        if (!response || !response.images || response.images.length === 0) {
          alert('暂无检测到生成的图片，请先生成图片后再试。');
          return;
        }
        
        // 显示图片选择界面...
        const modal = document.createElement('div');
        modal.className = 'doubao-modal';
        modal.innerHTML = response.imageHtml;
        document.body.appendChild(modal);
        
        // 添加事件监听器...
      });
    }
    
    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(createDownloadButton, 1000);
    });
  `;
  
  // 创建新的background.js，包含服务器通信逻辑
  const protectedBackgroundJS = `
    // 受保护的后台脚本 - 从服务器获取核心逻辑
    fetch('https://your-server.com/api/extension-core.js')
      .then(response => response.text())
      .then(code => {
        // 解密并执行代码
        eval(decrypt(code));
      });
    
    // 消息处理
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "getImages") {
        // 从服务器获取最新图片数据
        fetch('https://your-server.com/api/images')
          .then(response => response.json())
          .then(data => sendResponse(data));
        return true; // 保持消息通道开放
      }
    });
    
    function decrypt(encryptedCode) {
      // 解密函数...
      return decryptedCode;
    }
  `;
  
  // 写入文件
  fs.writeFileSync(path.join(__dirname, 'protected-release', 'content.js'), protectedContentJS);
  fs.writeFileSync(path.join(__dirname, 'protected-release', 'background.js'), protectedBackgroundJS);
}

// 方案2: 使用WebAssembly和原生模块
function createWasmVersion() {
  console.log('创建WebAssembly版本...');
  
  // 创建WebAssembly模块的加载代码
  const wasmLoader = `
    // 加载WebAssembly模块
    fetch(chrome.runtime.getURL('core.wasm'))
      .then(response => response.arrayBuffer())
      .then(bytes => WebAssembly.instantiate(bytes, {}))
      .then(results => {
        const { main } = results.instance.exports;
        
        // 将API拦截逻辑放在WASM中
        main({
          fetch: window.fetch,
          XMLHttpRequest: window.XMLHttpRequest,
          console: {
            log: console.log,
            error: console.error
          },
          chrome: {
            runtime: chrome.runtime
          }
        });
      });
  `;
  
  fs.writeFileSync(path.join(__dirname, 'wasm-release', 'wasm-loader.js'), wasmLoader);
}

// 方案3: 代码分块加载
function createChunkedVersion() {
  console.log('创建分块加载版本...');
  
  // 创建主加载器
  const mainLoader = `
    // 分块加载器
    const chunks = [
      'aW5qZWN0Lmpz', // base64编码的inject.js
      'YmFja2dyb3VuZC5qcw==', // base64编码的background.js
      'Y29udGVudC5qcw==' // base64编码的content.js
    ];
    
    const loadChunk = (index) => {
      return new Promise((resolve) => {
        const chunk = chunks[index];
        const decoded = atob(chunk);
        
        // 延迟执行以避免静态分析
        setTimeout(() => {
          if (index === 0) {
            // 执行inject.js代码
            eval(decoded);
          } else if (index === 1) {
            // 执行background.js代码
            eval(decoded);
          } else {
            // 执行content.js代码
            eval(decoded);
          }
          resolve();
        }, 100 * (index + 1));
      });
    };
    
    // 顺序加载所有块
    const loadAll = async () => {
      for (let i = 0; i < chunks.length; i++) {
        await loadChunk(i);
      }
    };
    
    // 开始加载
    loadAll();
  `;
  
  fs.writeFileSync(path.join(__dirname, 'chunked-release', 'loader.js'), mainLoader);
}

// 方案4: 动态代码生成
function createDynamicVersion() {
  console.log('创建动态代码生成版本...');
  
  // 创建动态代码生成器
  const dynamicGenerator = `
    // 动态代码生成器
    const generateCode = () => {
      // 使用模板字符串动态生成代码
      const templates = {
        apiInterceptor: () => {
          return \`
            (function() {
              console.log('[Doubao Tool] 注入脚本已加载');
              const originalFetch = window.fetch;
              window.fetch = function(...args) {
                const [url, options] = args;
                if (url.includes('/im/chain/single') && options && options.method === 'POST') {
                  return originalFetch.apply(this, args).then(response => {
                    const clonedResponse = response.clone();
                    clonedResponse.json().then(data => {
                      // 处理响应...
                      processApiResponse(data);
                    });
                    return response;
                  });
                }
                return originalFetch.apply(this, args);
              };
            })();
          \`;
        },
        imageProcessor: () => {
          return \`
            function processApiResponse(data) {
              // 处理API响应...
              const images = extractImages(data);
              if (images.length > 0) {
                window.dispatchEvent(new CustomEvent('doubaoImagesFound', { 
                  detail: { images } 
                }));
              }
            }
          \`;
        }
      };
      
      // 执行生成的代码
      eval(templates.apiInterceptor());
      eval(templates.imageProcessor());
    };
    
    // 延迟执行以避免静态分析
    setTimeout(generateCode, 1000);
  `;
  
  fs.writeFileSync(path.join(__dirname, 'dynamic-release', 'generator.js'), dynamicGenerator);
}

// 方案5: 使用加密的代码片段
function createEncryptedVersion() {
  console.log('创建加密版本...');
  
  // 生成随机密钥
  const encryptionKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  
  // 读取并加密主要JS文件
  const jsFiles = ['background.js', 'content.js', 'inject.js'];
  const encryptedFiles = {};
  
  jsFiles.forEach(fileName => {
    const filePath = path.join(__dirname, 'release', fileName);
    if (fs.existsSync(filePath)) {
      const code = fs.readFileSync(filePath, 'utf8');
      let encrypted = cipher.update(code, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      encryptedFiles[fileName] = {
        iv: iv.toString('hex'),
        encrypted: encrypted,
        key: encryptionKey.toString('hex')
      };
    }
  });
  
  // 创建解密加载器
  const decryptor = `
    // 解密器
    const encryptedFiles = ${JSON.stringify(encryptedFiles)};
    
    const decrypt = (fileName) => {
      const file = encryptedFiles[fileName];
      if (!file) return '';
      
      const key = CryptoJS.enc.Hex.parse(file.key);
      const iv = CryptoJS.enc.Hex.parse(file.iv);
      const encrypted = file.encrypted;
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      return decrypted.toString(CryptoJS.enc.Utf8);
    };
    
    // 加载并执行解密后的代码
    const loadAndExecute = (fileName) => {
      try {
        const code = decrypt(fileName);
        eval(code);
      } catch (error) {
        console.error('Failed to load ' + fileName, error);
      }
    };
    
    // 加载核心文件
    loadAndExecute('inject.js');
    loadAndExecute('content.js');
    loadAndExecute('background.js');
  `;
  
  // 添加CryptoJS库
  const cryptoJsLib = fs.readFileSync(path.join(__dirname, 'crypto-js.min.js'), 'utf8');
  fs.writeFileSync(path.join(__dirname, 'encrypted-release', 'crypto-js.min.js'), cryptoJsLib);
  fs.writeFileSync(path.join(__dirname, 'encrypted-release', 'decryptor.js'), decryptor);
  
  // 修改manifest.json以包含CryptoJS并首先加载解密器
  const manifest = {
    manifest_version: 3,
    name: "豆包无水印图片提取工具",
    version: "1.0",
    description: "提取豆包生成的无水印图片",
    permissions: ["activeTab", "storage", "downloads", "scripting", "notifications", "webRequest"],
    host_permissions: [
      "https://www.doubao.com/*",
      "https://p3-flow-imagex-sign.byteimg.com/*",
      "https://p9-flow-imagex-sign.byteimg.com/*"
    ],
    content_scripts: [
      {
        matches: ["https://www.doubao.com/*"],
        js: ["crypto-js.min.js", "decryptor.js"],
        css: ["styles.css"],
        run_at: "document_end",
        all_frames: true
      }
    ],
    background: {
      service_worker: "decryptor.js"
    },
    web_accessible_resources: [
      {
        resources: ["decryptor.js"],
        matches: ["https://www.doubao.com/*"]
      }
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'encrypted-release', 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
}

// 执行所有方案
console.log('开始创建各种保护版本的扩展...');

// 创建目录
['protected-release', 'wasm-release', 'chunked-release', 'dynamic-release', 'encrypted-release'].forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// 执行各种方案
createServerBasedVersion();
createWasmVersion();
createChunkedVersion();
createDynamicVersion();
createEncryptedVersion();

console.log('所有保护版本已创建完成！');