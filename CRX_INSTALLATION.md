# CRX扩展安装指南

## CRX文件信息

- **文件名**：doubao-waterprint-downloader.crx
- **扩展ID**：lamenfhgkolmddijnkjblekfgbcibpij
- **文件大小**：约 600KB

## 安装方法

### 方法一：直接拖拽安装（推荐）

1. 打开Chrome浏览器，进入扩展管理页面：`chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 将`doubao-waterprint-downloader.crx`文件拖拽到扩展页面中
4. 在弹出的确认对话框中点击"添加扩展程序"
5. 安装完成！

### 方法二：通过文件路径安装

1. 打开Chrome浏览器，进入扩展管理页面：`chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择CRX文件所在的文件夹
5. 如果Chrome提示错误，请先将CRX文件解压到一个文件夹中，然后选择该文件夹

### 方法三：使用命令行（高级用户）

```bash
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --load-extension="path/to/unpacked/folder"

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --load-extension="path/to/unpacked/folder"

# Linux
google-chrome --load-extension="path/to/unpacked/folder"
```

## 解压CRX文件（如果需要）

如果您需要解压CRX文件，可以：

1. 将`.crx`扩展名改为`.zip`
2. 使用任何解压工具解压该文件
3. 解压后的文件夹就是解压形式的扩展

## 注意事项

1. **开发者模式**：安装CRX文件需要开启开发者模式
2. **更新**：手动安装的扩展需要手动更新
3. **安全提醒**：只安装来自可信来源的CRX文件
4. **浏览器兼容性**：此CRX文件适用于所有基于Chromium的浏览器（Chrome、Edge、Opera等）

## 安装验证

安装成功后，您可以：

1. 在扩展列表中看到"豆包无水印图片提取工具"
2. 访问豆包网站(www.doubao.com)测试功能
3. 生成图片后，页面顶部会出现"下载"按钮

## 故障排除

### 安装失败

1. 确保已开启开发者模式
2. 尝试使用方法二或方法三
3. 检查Chrome版本是否为最新
4. 查看扩展页面是否有错误提示

### 扩展不工作

1. 刷新豆包页面后重试
2. 检查扩展是否有更新
3. 查看浏览器控制台是否有错误信息
4. 确认扩展有必要的权限

### 无法安装到Edge

Edge浏览器也可以使用Chrome扩展：

1. 打开Edge扩展页面：`edge://extensions/`
2. 开启"开发人员模式"
3. 按照上述方法安装

---

**如果您在安装过程中遇到问题，请访问我们的GitHub仓库获取支持：**
https://github.com/hackerfan/doubao-waterprint-downloader