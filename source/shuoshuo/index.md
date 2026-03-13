---
title: 碎碎念
date: 2026-02-27 14:28:14
comments: false
top_img: https://img.1nuo.me/img/academicbanner.webp
---

<div id="memos-list" style="margin-top: 20px;">
  <p style="text-align: center; color: #888;">正在从 1nuo.me 卫星基站拉取最新电波...</p>
</div>

<script>
  // 你的 Memos API 地址与主域名
  const memosDomain = "https://memos.1nuo.me";
  const memosUrl = `${memosDomain}/api/v1/memos?pageSize=20`;

  fetch(memosUrl)
    .then(res => res.json())
    .then(data => {
      // 兼容 Memos 不同版本的数据结构
      let memos = data.memos || data || [];
      let html = "";
      
      if (memos.length === 0) {
        document.getElementById('memos-list').innerHTML = '<p style="text-align: center;">基站目前很安静，还没有发送任何信号。</p>';
        return;
      }

      memos.forEach(memo => {
         // 解析时间
         let date = new Date(memo.createTime || memo.createdTs * 1000).toLocaleString();
         
         // 简单的正则，把 #标签 变成蓝色
         let content = memo.content.replace(/(#[^\s#]+)/g, '<span style="color: #49b1f5;">$1</span>');
         
         // 💡 新增 1：处理 Markdown 原生图片语法，并补全相对路径
         content = content.replace(/!\[.*?\]\((.*?)\)/g, (match, url) => {
           if (url.startsWith('/')) url = memosDomain + url;
           return `<img src="${url}" style="width: 100%; max-width: 500px; border-radius: 8px; margin-top: 10px; display: block;" />`;
         });

         // 💡 新增 2：处理从 Memos 附件上传的图片 (resources 字段)
         let imgHtml = "";
         let resList = memo.resources || memo.resourceList || [];
         resList.forEach(res => {
           // 确保附件是图片类型
           if (res.type && res.type.includes('image')) {
             let imgSrc = res.externalLink;
             if (!imgSrc) {
               // 兼容 Memos 最新版 API (res.name) 和旧版 API (res.id)
               if (res.name) {
                 imgSrc = `${memosDomain}/file/${res.name}`;
               } else {
                 imgSrc = `${memosDomain}/o/r/${res.id}`;
               }
             }
             imgHtml += `<img src="${imgSrc}" style="width: 100%; max-width: 500px; border-radius: 8px; margin-top: 10px; display: block;" />`;
           }
         });
         
         // 极简卡片 UI，支持 Butterfly 暗黑模式
         html += `
           <div style="background: var(--card-bg); padding: 20px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); margin-bottom: 20px; border: 1px solid var(--border-color);">
             <div style="font-size: 0.85em; color: #888; margin-bottom: 12px;">
               <i class="fas fa-satellite-dish"></i> ${date}
             </div>
             <div style="font-size: 1rem; line-height: 1.6; color: var(--text-color);">
               ${content}
               ${imgHtml} </div>
           </div>
         `;
      });
      document.getElementById('memos-list').innerHTML = html;
    })
    .catch(err => {
      console.error("Memos 加载失败:", err);
      document.getElementById('memos-list').innerHTML = '<p style="color: red; text-align: center;">拉取电波失败，请检查网络或 CORS 设置。</p>';
    });
</script>
