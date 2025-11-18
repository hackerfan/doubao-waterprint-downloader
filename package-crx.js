// 简单的CRX打包脚本
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');

// 确保archiver已安装：npm install archiver

const extensionDir = path.join(__dirname, 'release');
const outputDir = __dirname;
const crxFile = path.join(outputDir, 'doubao-waterprint-downloader.crx');
const pemFile = path.join(__dirname, 'extension.pem');

// 生成一个临时的私钥（如果没有的话）
if (!fs.existsSync(pemFile)) {
  console.log('生成临时私钥...');
  const { execSync } = require('child_process');
  execSync('openssl genrsa -out extension.pem 2048', { stdio: 'inherit' });
}

// 读取私钥
const privateKey = fs.readFileSync(pemFile, 'utf8');

// 创建ZIP文件
const zipFile = path.join(outputDir, 'extension.zip');
const output = fs.createWriteStream(zipFile);
const archive = archiver('zip');

output.on('close', function() {
  console.log('ZIP文件已创建');
  
  // 计算签名
  const zipData = fs.readFileSync(zipFile);
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(zipData);
  const signature = sign.sign(privateKey, 'binary');
  
  // 读取公钥
  const pubKey = crypto.createPublicKey(privateKey).export({
    type: 'spki',
    format: 'der'
  });
  
  // 创建CRX文件
  const crx = Buffer.alloc(16);
  
  // Magic number: 24 43 52 58 ("Cr24")
  crx.write('Cr24', 0);
  
  // Version: 3
  crx.writeUInt32LE(3, 4);
  
  // Public key length
  crx.writeUInt32LE(pubKey.length, 8);
  
  // Signature length
  crx.writeUInt32LE(signature.length, 12);
  
  // 合并所有部分
  const crxBuffer = Buffer.concat([crx, pubKey, Buffer.from(signature, 'binary'), zipData]);
  
  // 写入CRX文件
  fs.writeFileSync(crxFile, crxBuffer);
  
  // 删除临时ZIP文件
  fs.unlinkSync(zipFile);
  
  console.log('CRX文件已创建:', crxFile);
  console.log('扩展ID:', getExtensionId(pubKey));
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// 添加所有文件到ZIP
const files = fs.readdirSync(extensionDir);
files.forEach(file => {
  const filePath = path.join(extensionDir, file);
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