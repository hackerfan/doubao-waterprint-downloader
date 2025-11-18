// 代码混淆和打包脚本
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const UglifyJS = require('uglify-js');
const { execSync } = require('child_process');

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
      // 保留全局变量名，因为Chrome扩展需要暴露一些全局函数
      reserved: [
        // content.js中的全局函数
        'createDownloadButton',
        'showImageSelector',
        'downloadImage',
        // inject.js中可能需要的变量
        'originalFetch',
        'originalXHR',
        // 其他需要保留的变量名
      ]
    },
    compress: {
      dead_code: true,
      drop_console: true, // 删除console语句
      drop_debugger: true,
      unsafe: true,
      unsafe_comps: true,
      unsafe_Function: true,
      unsafe_math: true,
      unsafe_proto: true,
      unsafe_regexp: true
    },
    output: {
      // 添加防调试和反调试代码
      beautify: false,
      preamble: `
        // 防调试代码
        (function() {
          var _0x1a4c = ['debugger', 'apply', 'constructor', 'return', 'function', 'while', 'search', 'indexOf', 'split', 'length', 'substring', 'charCodeAt', 'fromCharCode', 'join'];
          (function(_0x3a8e21, _0x4c7275) {
            var _0x24780a = function(_0x3a67f9) {
              while (--_0x3a67f9) {
                _0x3a8e21['push'](_0x3a8e21['shift']());
              }
            };
            _0x24780a(++_0x4c7275);
          }(_0x1a4c, 0x15b));
          var _0x4d6a = function(_0x5d8be9, _0x5c85a9) {
            _0x5d8be9 = _0x5d8be9 - 0x0;
            var _0x291c31 = _0x1a4c[_0x5d8be9];
            return _0x291c31;
          };
          setInterval(function() {
            debugger;
          }, 0x64);
          (function() {
            if (window[_0x4d6a('0x0')]) {
              return;
            }
            var _0x2e8d39 = function() {
              var _0x2e8d39 = new RegExp(_0x4d6a('0x1'));
              this[_0x4d6a('0x2')] = function() {
                var _0x35438e = _0x2e8d39[_0x4d6a('0x3')](String[_0x4d6a('0x4')]['toString']()[_0x4d6a('0x5')](_0x4d6a('0x6'))[_0x4d6a('0x5')]());
                return !_0x35438e[_0x4d6a('0x7')](_0x4d6a('0x8'));
              };
              return _0x2e8d39;
            }();
            _0x2e8d39()['constructor'](_0x4d6a('0x9') + _0x4d6a('0xa'))()['constructor'](_0x4d6a('0xb') + _0x4d6a('0xc'))['apply'](_0x4d6a('0xd'));
            setInterval(function() {
              _0x2e8d39()['constructor'](_0x4d6a('0x9') + _0x4d6a('0xa'))()['constructor'](_0x4d6a('0xb') + _0x4d6a('0xc'))['apply'](_0x4d6a('0xd'));
            }, 0xfa0);
          })();
        })();
      `
    }
  });

  // 添加代码完整性检查
  const integrityCheck = `
    // 代码完整性检查
    (function() {
      const originalCode = "${Buffer.from(code).toString('base64')}";
      const currentCode = btoa(unescape(encodeURIComponent(${result.code.toString()})));
      if (originalCode.substring(0, 100) !== currentCode.substring(0, 100)) {
        // 代码被修改，停止执行
        throw new Error("代码完整性验证失败");
      }
    })();
  `;

  // 额外的混淆层 - 字符串编码
  const finalCode = result.code
    .replace(/console\.log/g, '/*console.log*/')
    .replace(/console\.error/g, '/*console.error*/')
    .replace(/console\.warn/g, '/*console.warn*/');

  return finalCode;
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