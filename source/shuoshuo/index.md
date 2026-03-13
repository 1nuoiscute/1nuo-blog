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
  // 增加时间戳后缀防止缓存导致裂图
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
         
         // 1. 处理 Markdown 中的图片
         content = content.replace(/!\[.*?\]\((.*?)\)/g, (match, url) => {
           let fullUrl = url.startsWith('/') ? memosDomain + url : url;
           return `<img src="${fullUrl}" style="width: 100%; max-width: 400px; border-radius: 8px; margin: 10px 0; display: block;" />`;
         });

         // 2. 处理 Memos 附件图片 (关键修复点)
         let imgHtml = "";
         let resList = memo.resources || memo.resourceList || [];
         resList.forEach(res => {
           if (res.type && res.type.includes('image')) {
             let imgSrc = res.externalLink;
             if (!imgSrc) {
               // 核心修复：Memos v1 API 的文件路径通常是 /file/{name}
               // 如果 res.name 已经包含了 "resources/"，拼出来就是你给的那个地址
               imgSrc = `${memosDomain}/file/${res.name}`;
             }
             // 💡 增加 ?thumbnail=true 提高加载成功率
             const thumbSrc = imgSrc.includes('?') ? `${imgSrc}&thumbnail=true` : `${imgSrc}?thumbnail=true`;
             
             imgHtml += `
               <a href="${imgSrc}" target="_blank" style="display: block; margin-top: 10px;">
                 <img src="${thumbSrc}" 
                      onerror="this.src='${imgSrc}';this.onerror=null;" 
                      style="width: 100%; max-width: 400px; border-radius: 8px; border: 1px solid var(--border-color); display: block;" />
               </a>`;
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
