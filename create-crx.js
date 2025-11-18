// 简化的CRX创建脚本，使用Node.js内置加密功能
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const { execSync } = require('child_process');

// 使用Node.js生成密钥对
function generateKeyPair() {
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
  
  return { publicKey, privateKey };
}

// 生成密钥对（如果不存在）
const pemFile = path.join(__dirname, 'extension.pem');
const publicKeyFile = path.join(__dirname, 'extension_public.pem');

if (!fs.existsSync(pemFile)) {
  console.log('生成密钥对...');
  const { publicKey, privateKey } = generateKeyPair();
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
const extensionDir = path.join(__dirname, 'release');
const outputDir = __dirname;
const zipFile = path.join(outputDir, 'extension.zip');
const crxFile = path.join(outputDir, 'doubao-waterprint-downloader.crx');

const output = fs.createWriteStream(zipFile);
const archive = archiver('zip');

output.on('close', function() {
  console.log('ZIP文件已创建');
  
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
  
  console.log('CRX文件已创建:', crxFile);
  console.log('扩展ID:', getExtensionId(publicKey));
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