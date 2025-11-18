// 加密代码和打包脚本
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');

// 创建加密后的发布目录
const encryptedDir = path.join(__dirname, 'encrypted-release');
if (!fs.existsSync(encryptedDir)) {
  fs.mkdirSync(encryptedDir, { recursive: true });
}

// 加密函数
function encryptCode(code, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(code, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    iv: iv.toString('hex'),
    encrypted: encrypted
  };
}

// 生成密钥
const encryptionKey = crypto.randomBytes(32);
const keyHex = encryptionKey.toString('hex');

console.log('开始加密JavaScript文件...');

// 要加密的文件列表
const jsFilesToEncrypt = [
  'background.js',
  'content.js',
  'inject.js',
  'popup.js'
];

// 创建解密加载器
const decryptor = `
(function() {
  // 解密器
  const encryptionKey = new TextEncoder().encode('${keyHex}');
  
  function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }
  
  async function importKey(keyData) {
    return await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-CBC' },
      false,
      ['decrypt']
    );
  }
  
  async function decrypt(encryptedData, iv, key) {
    const importedKey = await importKey(key);
    const encryptedBytes = hexToBytes(encryptedData);
    const ivBytes = hexToBytes(iv);
    
    try {
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-CBC',
          iv: ivBytes
        },
        importedKey,
        encryptedBytes
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('解密失败:', error);
      return '';
    }
  }
  
  // 加载和执行加密的脚本
  async function loadAndExecuteScript(fileName) {
    try {
      // 从扩展资源加载加密的数据
      const response = await fetch(chrome.runtime.getURL('encrypted_' + fileName + '.json'));
      const data = await response.json();
      
      // 解密代码
      const decryptedCode = await decrypt(data.encrypted, data.iv, encryptionKey);
      
      // 执行代码
      eval(decryptedCode);
      
      console.log('脚本 ' + fileName + ' 已加载并执行');
    } catch (error) {
      console.error('加载脚本 ' + fileName + ' 失败:', error);
    }
  }
  
  // 根据上下文加载不同的脚本
  if (typeof window !== 'undefined' && window.location) {
    // 内容脚本或注入脚本
    if (window.location.href.includes('doubao.com')) {
      loadAndExecuteScript('inject.js');
      loadAndExecuteScript('content.js');
    }
  } else if (typeof chrome !== 'undefined' && chrome.runtime) {
    // 后台脚本
    loadAndExecuteScript('background.js');
  } else {
    // 弹出窗口脚本
    loadAndExecuteScript('popup.js');
  }
})();
`;

// 加密所有JS文件并创建加密的JSON文件
jsFilesToEncrypt.forEach(fileName => {
  const filePath = path.join(__dirname, 'release', fileName);
  if (fs.existsSync(filePath)) {
    console.log(`正在加密: ${fileName}`);
    const code = fs.readFileSync(filePath, 'utf8');
    const encrypted = encryptCode(code, encryptionKey);
    
    // 保存加密数据为JSON文件
    fs.writeFileSync(
      path.join(encryptedDir, `encrypted_${fileName}.json`),
      JSON.stringify(encrypted)
    );
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
      js: ["decryptor.js"],
      css: ["styles.css"],
      run_at: "document_end",
      all_frames: true
    }
  ],
  background: {
    service_worker: "decryptor.js"
  },
  action: {
    default_popup: "popup.html",
    default_title: "豆包图片提取工具"
  },
  web_accessible_resources: [
    {
      resources: [
        "encrypted_inject.js.json",
        "encrypted_content.js.json",
        "encrypted_popup.js.json"
      ],
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
  path.join(encryptedDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

// 保存解密器
fs.writeFileSync(
  path.join(encryptedDir, 'decryptor.js'),
  decryptor
);

// 复制其他非JS文件
console.log('复制其他文件...');
const sourceDir = path.join(__dirname, 'release');
const files = fs.readdirSync(sourceDir);
files.forEach(file => {
  if (!file.endsWith('.js')) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(encryptedDir, file);
    fs.copyFileSync(sourcePath, targetPath);
  }
});

// 处理popup.html以加载解密器
const popupHtmlPath = path.join(__dirname, 'release', 'popup.html');
if (fs.existsSync(popupHtmlPath)) {
  let popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
  // 替换popup.js为decryptor.js
  popupHtml = popupHtml.replace('popup.js', 'decryptor.js');
  fs.writeFileSync(path.join(encryptedDir, 'popup.html'), popupHtml);
}

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
const zipFile = path.join(outputDir, 'encrypted-extension.zip');
const crxFile = path.join(outputDir, 'doubao-waterprint-downloader-encrypted.crx');

const output = fs.createWriteStream(zipFile);
const archive = archiver('zip');

output.on('close', function() {
  console.log('加密的ZIP文件已创建');
  
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
  
  console.log('加密的CRX文件已创建:', crxFile);
  console.log('扩展ID:', getExtensionId(publicKey));
  console.log('解密密钥已保存在内存中，请注意保护密钥安全！');
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// 添加所有加密后的文件到ZIP
const encryptedFiles = fs.readdirSync(encryptedDir);
encryptedFiles.forEach(file => {
  const filePath = path.join(encryptedDir, file);
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