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
  const memosDomain = "https://memos.1nuo.me";
  const memosUrl = `${memosDomain}/api/v1/memos?pageSize=20&v=${new Date().getTime()}`;

  fetch(memosUrl)
    .then(res => res.json())
    .then(data => {
      let memos = data.memos || data || [];
      let html = "";
      
      if (memos.length === 0) {
        document.getElementById('memos-list').innerHTML = '<p style="text-align: center;">基站目前很安静，还没有发送任何信号。</p>';
        return;
      }

      memos.forEach(memo => {
         let date = new Date(memo.createTime || memo.createdTs * 1000).toLocaleString();
         let content = memo.content.replace(/(#[^\s#]+)/g, '<span style="color: #49b1f5;">$1</span>');
         
         // 1. 处理正文 Markdown 图片
         content = content.replace(/!\[.*?\]\((.*?)\)/g, (match, url) => {
           let fullUrl = url.startsWith('/') ? memosDomain + url : url;
           return `<img src="${fullUrl}" style="width: 100%; max-width: 400px; border-radius: 8px; margin: 10px 0; display: block;" />`;
         });

         // 2. 核心修复：只采用“域名 + /file/ + 资源名 + / + 文件名”的最稳逻辑
         let imgHtml = "";
         let resList = memo.resources || memo.resourceList || [];
         resList.forEach(res => {
           if (res.type && res.type.includes('image')) {
             let imgSrc = res.externalLink;
             
             if (!imgSrc) {
               // 💡 重点：这里根据你刚才发我的成功链接，强行拼出完整路径
               const rName = res.name || "";
               const fName = res.filename || res.fileName || "";
               if (rName && fName) {
                 imgSrc = `${memosDomain}/file/${rName}/${fName}`;
               } else if (rName) {
                 imgSrc = `${memosDomain}/file/${rName}`;
               }
             }
             
             if (imgSrc) {
               // 优先缩略图，备选原图
               const thumbSrc = imgSrc + (imgSrc.includes('?') ? '&' : '?') + 'thumbnail=true';
               imgHtml += `
                 <a href="${imgSrc}" target="_blank" style="display: block; margin-top: 10px;">
                   <img src="${thumbSrc}" 
                        onerror="this.src='${imgSrc}';this.onerror=null;" 
                        style="width: 100%; max-width: 400px; border-radius: 8px; border: 1px solid var(--border-color); display: block;" />
                 </a>`;
             }
           }
         });
         
         html += `
           <div style="background: var(--card-bg); padding: 20px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); margin-bottom: 20px; border: 1px solid var(--border-color);">
             <div style="font-size: 0.85em; color: #888; margin-bottom: 12px;">
               <i class="fas fa-satellite-dish"></i> ${date}
             </div>
             <div style="font-size: 1rem; line-height: 1.6; color: var(--text-color);">
               ${content}
               ${imgHtml}
             </div>
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

