
(function() {
  // 解密器
  const encryptionKey = new TextEncoder().encode('5063b43b75dba94594b3da55d2016a96a911bf6d6c98f88a5a9ad9a6302f0bc9');
  
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
