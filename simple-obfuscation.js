// 简单但有效的代码混淆方案
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');

// 创建混淆后的发布目录
const obfuscatedDir = path.join(__dirname, 'simple-obfuscated-release');
if (!fs.existsSync(obfuscatedDir)) {
  fs.mkdirSync(obfuscatedDir, { recursive: true });
}

// 字符串编码/解码函数
function encodeString(str) {
  // 简单的字符编码
  return btoa(unescape(encodeURIComponent(str)));
}

function decodeString(encoded) {
  return decodeURIComponent(escape(atob(encoded)));
}

// 简单的代码混淆
function obfuscateCode(code) {
  // 替换常见的字符串
  code = code.replace(/console\.log/g, 'window[decodeString("Y29uc29sZS5sb2c=")]');
  code = code.replace(/console\.error/g, 'window[decodeString("Y29uc29sZS5lcnJvcg==")]');
  code = code.replace(/document/g, 'window[decodeString("ZG9jdW1lbnQ=")]');
  code = code.replace(/window/g, 'window[decodeString("d2luZG93=")]');
  code = code.replace(/chrome/g, 'window[decodeString("Y2hyb21l=")]');
  
  // 简单的函数名混淆
  const functions = [
    { original: 'createDownloadButton', replacement: 'window[decodeString("Y3JlYXRlRG93bmxvYWRCdXR0b24=")]' },
    { original: 'showImageSelector', replacement: 'window[decodeString("c2hvd0ltYWdlU2VsZWN0b3I=")]' },
    { original: 'downloadImage', replacement: 'window[decodeString("ZG93bmxvYWRJbWFnZQ==")]' },
    { original: 'processApiResponse', replacement: 'window[decodeString("cHJvY2Vzc0FwaVJlc3BvbnNl=")]' }
  ];
  
  functions.forEach(func => {
    const regex = new RegExp(`\\b${func.original}\\b`, 'g');
    code = code.replace(regex, func.replacement);
  });
  
  // 添加反调试代码
  const antiDebug = `
    // 简单的反调试
    setInterval(function() {
      debugger;
    }, 500);
    
    // 检查开发者工具
    var devtools = {open: false, orientation: null};
    setInterval(function() {
      if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
        if (!devtools.open) {
          devtools.open = true;
          window.location.reload();
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  `;
  
  // 添加解码函数定义
  const decoder = `
    function decodeString(encoded) {
      return decodeURIComponent(escape(atob(encoded)));
    }
  `;
  
  return decoder + code + antiDebug;
}

// 分块混淆函数
function chunkAndEncode(code) {
  // 将代码分成多个块，并使用不同的编码
  const chunks = [];
  const chunkSize = 1000; // 每块1000个字符
  
  for (let i = 0; i < code.length; i += chunkSize) {
    const chunk = code.substring(i, i + chunkSize);
    const encoded = encodeString(chunk);
    chunks.push(encoded);
  }
  
  return chunks;
}

// 创建分块加载器
function createChunkedLoader(chunks, fileName) {
  return `
    // 分块加载器 - ${fileName}
    const chunks = ${JSON.stringify(chunks)};
    
    function decodeString(encoded) {
      return decodeURIComponent(escape(atob(encoded)));
    }
    
    function loadChunk(index) {
      return new Promise((resolve) => {
        // 延迟加载以避免静态分析
        setTimeout(() => {
          const chunk = chunks[index];
          const decoded = decodeString(chunk);
          
          // 使用函数构造器避免eval被检测
          const func = new Function(decoded);
          func();
          
          resolve();
        }, 100 * (index + 1));
      });
    }
    
    // 顺序加载所有块
    const loadAll = async () => {
      for (let i = 0; i < chunks.length; i++) {
        await loadChunk(i);
      }
    };
    
    // 开始加载
    loadAll();
  `;
}

// 要处理的文件
const jsFilesToObfuscate = [
  'background.js',
  'content.js',
  'inject.js',
  'popup.js'
];

// 处理每个文件
console.log('开始混淆JavaScript文件...');
jsFilesToObfuscate.forEach(fileName => {
  const filePath = path.join(__dirname, 'release', fileName);
  if (fs.existsSync(filePath)) {
    console.log(`正在混淆: ${fileName}`);
    
    // 读取原始代码
    const originalCode = fs.readFileSync(filePath, 'utf8');
    
    // 混淆代码
    const obfuscatedCode = obfuscateCode(originalCode);
    
    // 分块并编码
    const chunks = chunkAndEncode(obfuscatedCode);
    
    // 创建加载器
    const loaderCode = createChunkedLoader(chunks, fileName);
    
    // 写入混淆后的代码
    fs.writeFileSync(path.join(obfuscatedDir, fileName), loaderCode);
  }
});

// 创建新的manifest.json
const manifest = {
  manifest_version: 3,
  name: "豆包无水印图片提取工具",
  version: "1.0",
  description: "提取豆包生成的无水印图片",
  permissions: [
    "activeTab",
    "storage",
    "downloads",
    "scripting",
    "notifications",
    "webRequest"
  ],
  host_permissions: [
    "https://www.doubao.com/*",
    "https://p3-flow-imagex-sign.byteimg.com/*",
    "https://p9-flow-imagex-sign.byteimg.com/*"
  ],
  content_scripts: [
    {
      matches: ["https://www.doubao.com/*"],
      js: ["content.js"],
      css: ["styles.css"],
      run_at: "document_end",
      all_frames: true
    }
  ],
  background: {
    service_worker: "background.js"
  },
  action: {
    default_popup: "popup.html",
    default_title: "豆包图片提取工具"
  },
  web_accessible_resources: [
    {
      resources: ["inject.js"],
      matches: ["https://www.doubao.com/*"]
    }
  ],
  icons: {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
};

fs.writeFileSync(
  path.join(obfuscatedDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

// 复制其他非JS文件
console.log('复制其他文件...');
const sourceDir = path.join(__dirname, 'release');
const files = fs.readdirSync(sourceDir);
files.forEach(file => {
  if (!file.endsWith('.js')) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(obfuscatedDir, file);
    fs.copyFileSync(sourcePath, targetPath);
  }
});

// 生成密钥对（如果不存在）
const pemFile = path.join(__dirname, 'extension.pem');
const publicKeyFile = path.join(__dirname, 'extension_public.pem');

if (!fs.existsSync(pemFile)) {
  console.log('生成密钥对...');
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  fs.writeFileSync(pemFile, privateKey);
  fs.writeFileSync(publicKeyFile, publicKey);
}

// 读取密钥
const privateKey = fs.readFileSync(pemFile, 'utf8');
const publicKeyPem = fs.readFileSync(publicKeyFile, 'utf8');
const publicKey = crypto.createPublicKey(publicKeyPem).export({
  type: 'spki',
  format: 'der'
});

// 创建ZIP文件
const outputDir = __dirname;
const zipFile = path.join(outputDir, 'simple-obfuscated-extension.zip');
const crxFile = path.join(outputDir, 'doubao-waterprint-downloader-simple-obfuscated.crx');

const output = fs.createWriteStream(zipFile);
const archive = archiver('zip');

output.on('close', function() {
  console.log('简单混淆的ZIP文件已创建');
  
  // 计算签名
  const zipData = fs.readFileSync(zipFile);
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(zipData);
  const signature = sign.sign(privateKey, 'binary');
  
  // 创建CRX文件
  const crx = Buffer.alloc(16);
  
  // Magic number: 24 43 52 58 ("Cr24")
  crx.write('Cr24', 0);
  
  // Version: 3
  crx.writeUInt32LE(3, 4);
  
  // Public key length
  crx.writeUInt32LE(publicKey.length, 8);
  
  // Signature length
  crx.writeUInt32LE(signature.length, 12);
  
  // 合并所有部分
  const crxBuffer = Buffer.concat([crx, publicKey, Buffer.from(signature, 'binary'), zipData]);
  
  // 写入CRX文件
  fs.writeFileSync(crxFile, crxBuffer);
  
  // 删除临时ZIP文件
  fs.unlinkSync(zipFile);
  
  console.log('简单混淆的CRX文件已创建:', crxFile);
  console.log('扩展ID:', getExtensionId(publicKey));
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// 添加所有混淆后的文件到ZIP
const obfuscatedFiles = fs.readdirSync(obfuscatedDir);
obfuscatedFiles.forEach(file => {
  const filePath = path.join(obfuscatedDir, file);
  archive.file(filePath, { name: file });
});

archive.finalize();

// 获取扩展ID的函数
function getExtensionId(publicKey) {
  const hash = crypto.createHash('sha256');
  hash.update(publicKey);
  const digest = hash.digest();
  
  let id = '';
  for (let i = 0; i < 16; i++) {
    const byte = digest[i];
    id += 'abcdefghijklmnopqrstuvwxyz'.charAt(byte & 0x0f);
    id += 'abcdefghijklmnopqrstuvwxyz'.charAt((byte >> 4) & 0x0f);
  }
  
  return id;
}