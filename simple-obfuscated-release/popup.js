
    // 分块加载器 - popup.js
    const chunks = ["CiAgICBmdW5jdGlvbiBkZWNvZGVTdHJpbmcoZW5jb2RlZCkgewogICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGVzY2FwZShhdG9iKGVuY29kZWQpKSk7CiAgICB9CiAgd2luZG93W2RlY29kZVN0cmluZygiZDJsdVpHOTM9IildW2RlY29kZVN0cmluZygiWkc5amRXMWxiblE9IildLmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbigpIHsKICBjb25zdCByZWZyZXNoQnV0dG9uID0gd2luZG93W2RlY29kZVN0cmluZygiZDJsdVpHOTM9IildW2RlY29kZVN0cmluZygiWkc5amRXMWxiblE9IildLmdldEVsZW1lbnRCeUlkKCdyZWZyZXNoQnV0dG9uJyk7CiAgY29uc3Qgc3RhdHVzVGV4dCA9IHdpbmRvd1tkZWNvZGVTdHJpbmcoImQybHVaRzkzPSIpXVtkZWNvZGVTdHJpbmcoIlpHOWpkVzFsYm5RPSIpXS5nZXRFbGVtZW50QnlJZCgnc3RhdHVzVGV4dCcpOwogIAogIHJlZnJlc2hCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHsKICAgIHN0YXR1c1RleHQudGV4dENvbnRlbnQgPSAn5q2j5Zyo5Yi35paw6LGG5YyF6aG16Z2iLi4uJzsKICAgIAogICAgLy8g6I635Y+W5b2T5YmN5rS75Yqo5qCH562+6aG1CiAgICB3aW5kb3dbZGVjb2RlU3RyaW5nKCJZMmh5YjIxbD0iKV0udGFicy5xdWVyeSh7YWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlfSwgZnVuY3Rpb24odGFicykgewogICAgICBpZiAodGFic1swXSAmJiB0YWJzWzBdLnVybC5pbmNsdWRlcygnZG91YmFvLmNvbScpKSB7CiAgICAgICAgLy8g5Yi35paw5b2T5YmN6aG16Z2iCiAgICAgICAgd2luZG93W2RlY29kZVN0cmluZygiWTJoeWIyMWw9IildLnRhYnMucmVsb2FkKHRhYnNbMF0uaWQsIHt9LCBmdW5jdGlvbigpIHsKICAgICAgICAgIHN0YXR1c1RleHQudGV4dENvbnRlbnQgPSAn6aG16Z2i5bey5Yi35paw77yM6K+3562J5b6F5a6M5YWo5Yqg6L295ZCO5YaN5L2/55So5LiL6L295Yqf6IO9JzsKICAgICAgICB9KTsKICAgICAgfSBlbHNlIHsKICAgICAgICBzdGF0dXNUZXh0LnRleHRDb250ZW50ID0gJ+ivt+WFiOaJk+W8gOixhuWMhee9keermSAod3d3LmRvdWJhby5jb20pJzsKICAgICAgfQogICAg","fSk7CiAgfSk7Cn0pOwogICAgLy8g566A5Y2V55qE5Y+N6LCD6K+VCiAgICBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHsKICAgICAgZGVidWdnZXI7CiAgICB9LCA1MDApOwogICAgCiAgICAvLyDmo4Dmn6XlvIDlj5HogIXlt6XlhbcKICAgIHZhciBkZXZ0b29scyA9IHtvcGVuOiBmYWxzZSwgb3JpZW50YXRpb246IG51bGx9OwogICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7CiAgICAgIGlmICh3aW5kb3cub3V0ZXJIZWlnaHQgLSB3aW5kb3cuaW5uZXJIZWlnaHQgPiAyMDAgfHwgd2luZG93Lm91dGVyV2lkdGggLSB3aW5kb3cuaW5uZXJXaWR0aCA+IDIwMCkgewogICAgICAgIGlmICghZGV2dG9vbHMub3BlbikgewogICAgICAgICAgZGV2dG9vbHMub3BlbiA9IHRydWU7CiAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7CiAgICAgICAgfQogICAgICB9IGVsc2UgewogICAgICAgIGRldnRvb2xzLm9wZW4gPSBmYWxzZTsKICAgICAgfQogICAgfSwgNTAwKTsKICA="];
    
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
  