// 代码混淆和打包脚本
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const UglifyJS = require('uglify-js');

// 配置需要混淆的JS文件
const jsFilesToObfuscate = [
  'background.js',
  'content.js',
  'inject.js',
  'popup.js'
];

// 创建混淆后的发布目录
const obfuscatedDir = path.join(__dirname, 'obfuscated-release');
if (!fs.existsSync(obfuscatedDir)) {
  fs.mkdirSync(obfuscatedDir, { recursive: true });
}

// 混淆函数
function obfuscateCode(code, filePath) {
  // 使用UglifyJS进行基本混淆和压缩
  const result = UglifyJS.minify(code, {
    mangle: {
      reserved: [
        'createDownloadButton',
        'showImageSelector',
        'downloadImage',
        'originalFetch',
        'originalXHR',
        'chrome',
        'document',
        'window',
        'console',
        'CustomEvent'
      ]
    },
    compress: {
      dead_code: true,
      drop_console: false, // 保留console用于调试
      drop_debugger: true,
      unsafe: true,
      unsafe_comps: true,
      unsafe_Function: true,
      unsafe_math: true,
      unsafe_proto: true,
      unsafe_regexp: true
    },
    output: {
      beautify: false,
      quote_style: 1,
      wrap_iife: true,
      comments: false
    }
  });

  return result.code;
}

// 混淆所有JS文件
console.log('开始混淆JavaScript文件...');
jsFilesToObfuscate.forEach(fileName => {
  const filePath = path.join(__dirname, 'release', fileName);
  if (fs.existsSync(filePath)) {
    console.log(`正在混淆: ${fileName}`);
    const originalCode = fs.readFileSync(filePath, 'utf8');
    const obfuscatedCode = obfuscateCode(originalCode, fileName);
    fs.writeFileSync(path.join(obfuscatedDir, fileName), obfuscatedCode);
  }
});

// 复制其他非JS文件
console.log('复制其他文件...');
const sourceDir = path.join(__dirname, 'release');
const files = fs.readdirSync(sourceDir);
files.forEach(file => {
  if (!jsFilesToObfuscate.includes(file)) {
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
const zipFile = path.join(outputDir, 'obfuscated-extension.zip');
const crxFile = path.join(outputDir, 'doubao-waterprint-downloader-obfuscated.crx');

const output = fs.createWriteStream(zipFile);
const archive = archiver('zip');

output.on('close', function() {
  console.log('混淆的ZIP文件已创建');
  
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
  
  console.log('混淆的CRX文件已创建:', crxFile);
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