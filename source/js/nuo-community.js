(function () {
  'use strict';
  if(window.__nuoCommunityBooted) return; window.__nuoCommunityBooted=true;
  const cloud=window.NuoCloud;if(!cloud)return;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const link=(text,url,cls)=>{const n=el('a',text,cls);if(typeof url==='string'&&url.startsWith('/')&&!url.startsWith('//'))n.href=url;return n;};
  const kinds={article:'文章',note:'笔记',page:'页面',discussion:'讨论',ai:'AI 对话'};
  const states={pending:'待审核',hidden:'已隐藏',queued:'正在接话',running:'正在接话',error:'暂时未回复',limited:'今日额度已用完',review:'回复待审核'};
  const date=value=>new Date(value*1000).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const normalize=path=>new URL(path,location.origin).pathname.replace(/\/index\.html$/,'/').replace(/\/$/,'')||'/';
  function avatar(name,url){const node=el('span',(name||'读').slice(0,1),'nc-avatar');if(url){const img=el('img');img.src=url;img.alt='';img.referrerPolicy='no-referrer';img.onerror=()=>img.replaceWith(document.createTextNode((name||'读').slice(0,1)));node.replaceChildren(img);}return node;}
  function button(text,fn,cls){const n=el('button',text,cls);n.type='button';n.onclick=fn;return n;}
  function badgeList(items){const list=el('div',undefined,'nc-badges');items.forEach(item=>{const badge=el('span',item.name,'nc-badge');badge.title=item.description;list.append(badge);});return list;}
  let cleanup,epoch=0,actorId=null;
  const hosts=new Map(),reads=new Map();
  function hostError(host,error){const n=host.querySelector('[data-comments-status]');if(n)n.textContent=error.message||'暂时连接不上，请重试';}
  async function markRead(thread,floor){
    if(!Number.isSafeInteger(floor)||floor<=0)return;
    thread=normalize(thread);const user=cloud.state().user;if(!user)return;
    const key=user.id+'\t'+thread,record=reads.get(key)||{wanted:0,sent:0,following:false,busy:false};
    record.wanted=Math.max(record.wanted,floor);reads.set(key,record);
    if(!record.following||record.busy||record.wanted<=record.sent)return;
    const through=record.wanted;record.busy=true;
    try{await cloud.request('/v1/community/follows/read',{method:'POST',body:{thread,throughFloor:through}});if(cloud.state().user?.id===user.id)record.sent=through;}
    catch{/* A later visible read retries without losing unread replies. */}
    finally{record.busy=false;}
    if(record.sent>=through&&record.wanted>record.sent&&cloud.state().user?.id===user.id)markRead(thread,record.wanted);
  }
  async function refreshFollow(host,record){
    const ticket=++record.ticket,user=cloud.state().user;record.button.hidden=false;
    record.button.textContent='关注';record.button.setAttribute('aria-pressed','false');
    if(!user)return;
    try{
      const state=await cloud.request('/v1/community/follow?thread='+encodeURIComponent(record.thread));
      if(!host.isConnected||ticket!==record.ticket||cloud.state().user?.id!==user.id)return;
      record.following=state.following;record.button.hidden=!state.available&&!state.following;
      record.button.textContent=state.following?'已关注':'关注';record.button.setAttribute('aria-pressed',String(state.following));
      const key=user.id+'\t'+record.thread,read=reads.get(key)||{wanted:0,sent:0,busy:false};read.following=state.following;read.sent=Math.max(read.sent,state.seenFloor||0);reads.set(key,read);if(read.wanted)markRead(record.thread,read.wanted);
    }catch(error){if(ticket===record.ticket&&host.isConnected)hostError(host,error);}
  }
  function mountFollow(host){
    if(!host||hosts.has(host))return;
    const thread=normalize(host.dataset.thread||location.pathname);
    if(!host.dataset.thread&&!document.querySelector('article.post-content')&&!location.pathname.startsWith('/notes/'))return;
    const heading=host.querySelector('.nuo-comments-heading');if(!heading)return;
    const record={thread,ticket:0,following:false};record.button=button('关注',async()=>{
      if(!cloud.state().user){try{await cloud.login();}catch(error){hostError(host,error);}return;}
      const owner=cloud.state().user.id;record.button.disabled=true;
      try{const result=await cloud.request('/v1/community/follow',{method:record.following?'DELETE':'POST',body:{thread}});if(owner!==cloud.state().user?.id||!host.isConnected)return;record.following=result.following;await refreshFollow(host,record);}
      catch(error){if(owner===cloud.state().user?.id)hostError(host,error);}
      finally{record.button.disabled=false;}
    },'nc-follow');record.button.dataset.communityFollow='';record.button.setAttribute('aria-pressed','false');record.button.title='关注后，在“我的交流”查看新回复';heading.append(record.button);hosts.set(host,record);
    cloud.ready().then(()=>{if(host.isConnected)refreshFollow(host,record);});
  }
  window.NuoCommunity={mountFollow,markRead};
  cloud.subscribe(state=>{
    const next=state.user?.id||null;if(next===actorId)return;actorId=next;reads.clear();
    for(const [host,record] of hosts){if(!host.isConnected){hosts.delete(host);continue;}record.following=false;refreshFollow(host,record);}
  });
  function boot(){
    if(cleanup)cleanup();cleanup=null;const generation=++epoch;
    for(const host of hosts.keys())if(!host.isConnected)hosts.delete(host);
    document.querySelectorAll('[data-nuo-comments]').forEach(mountFollow);
    const page=document.querySelector('[data-community-activity],[data-community-people]');if(!page)return;
    const content=page.querySelector('[data-community-content]'),status=page.querySelector('[data-community-status]');
    let ticket=0,unsubscribe,more=page.querySelector('[data-community-more]'),next=null,renderedUser=Symbol('initial'),activeKind='',reload;
    const alive=()=>generation===epoch&&page.isConnected;
    const message=error=>{if(alive())status.textContent=error.message||'暂时连接不上，请重试';};
    const setStatus=text=>{if(alive())status.textContent=text;};
    function loginPrompt(){content.replaceChildren();const box=el('div',undefined,'nc-empty');box.append(el('h2','登录后，接着聊'),el('p','用同一个账号查看交流记录、关注更新和个人主页。'),button('登录 / 注册',()=>cloud.login().catch(message),'nc-primary'));content.append(box);setStatus('');if(more)more.hidden=true;}
    function empty(text,description){const box=el('div',undefined,'nc-empty');box.append(el('h2',text),el('p',description),link('去讨论区看看','/discuss/'));content.append(box);}
    function row(item,following){
      const node=el('article',undefined,'nc-row');node.dataset.communityRow='';if(item.thread)node.dataset.thread=item.thread;
      const title=el('h2');title.append(item.url?link(item.title,item.url):el('span',item.title));node.append(title);
      const meta=el('div',undefined,'nc-meta');meta.append(el('span',kinds[item.kind]||'交流'));
      if(item.createdAt)meta.append(el('time',date(item.createdAt)));if(states[item.state])meta.append(el('span',states[item.state]));if(item.floor)meta.append(el('span',item.floor+' 楼'));
      if(following&&item.unread)meta.append(el('span',item.unread+' 条新回复','nc-unread'));node.append(meta);
      if(item.body)node.append(el('p',item.body));
      if(following){const actions=el('div',undefined,'nc-row-actions');if(item.url)actions.append(link(item.unread?'查看新回复':'回到原文',item.url));
        if(item.unread)actions.append(button('标为已读',async()=>{try{await cloud.request('/v1/community/follows/read',{method:'POST',body:{thread:item.thread,throughFloor:item.latestFloor}});if(alive())await reload();}catch(error){message(error);}}));
        actions.append(button('取消关注',async()=>{try{await cloud.request('/v1/community/follow',{method:'DELETE',body:{thread:item.thread}});if(alive())await reload();}catch(error){message(error);}}));node.append(actions);
      }
      return node;
    }
    async function activity(append=false){
      if(!cloud.state().user){loginPrompt();return;}const requestTicket=++ticket;setStatus('正在加载…');if(!append)content.replaceChildren();if(more)more.hidden=true;
      page.querySelectorAll('[data-activity-kind]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.activityKind===activeKind)));
      try{const data=await cloud.request(activeKind==='following'?'/v1/community/follows?offset='+(append?next:0):'/v1/community/activity?kind='+activeKind+'&offset='+(append?next:0));if(!alive()||ticket!==requestTicket)return;
        data.items.forEach(item=>content.append(row(item,activeKind==='following')));next=data.next;more.hidden=next===null;
        if(!content.childNodes.length&&next===null)empty(activeKind==='following'?'关注感兴趣的内容':'这里会留下你的交流',activeKind==='following'?'在文章或讨论的评论区点“关注”，新回复会收在这里。':'发一篇帖子、留一句评论，或找大肥鱼聊聊。');setStatus('');
      }catch(error){message(error);}
    }
    function profileTop(profile,counts){const top=el('header',undefined,'nc-profile-top'),copy=el('div',undefined,'nc-profile-copy');top.append(avatar(profile.name,profile.avatar));copy.append(el('h1',profile.name));if(profile.bio)copy.append(el('p',profile.bio));const stat=el('div',undefined,'nc-meta');stat.append(el('span',counts.posts+' 篇讨论'),el('span',counts.comments+' 条公开评论'));copy.append(stat);top.append(copy);return top;}
    async function publicProfile(id,kind='posts',append=false){
      const requestTicket=++ticket;setStatus('正在加载个人主页…');
      try{const data=await cloud.request('/v1/community/profiles/'+id+'?kind='+kind+'&offset='+(append?next:0));if(!alive()||ticket!==requestTicket)return;
        let list=content.querySelector('[data-profile-list]');
        if(!append){content.replaceChildren(profileTop(data.profile,data.counts));if(data.badges.length)content.append(badgeList(data.badges));const nav=el('nav',undefined,'nc-tabs');nav.setAttribute('aria-label','主页内容');
          for(const [key,label] of [['posts','公开帖子'],['comments','公开评论'],['books','推荐收藏']]){const b=button(label,()=>publicProfile(id,key));b.setAttribute('aria-pressed',String(key===kind));b.dataset.profileKind=key;nav.append(b);}content.append(nav);list=el('div');list.dataset.profileList='';content.append(list);
        }
        data.items.forEach(item=>list.append(row(kind==='books'?{...item,body:'',createdAt:null}:item,false)));next=data.next;
        if(!list.childNodes.length&&next===null){const text=kind==='books'?'还没有公开的推荐收藏':kind==='comments'?'还没有公开评论':'还没有公开帖子';list.append(el('p',text,'nc-help'));}
        let publicMore=content.querySelector('[data-profile-more]');if(!publicMore){publicMore=button('加载更多',()=>publicProfile(id,kind,true),'nc-more');publicMore.dataset.profileMore='';content.append(publicMore);}publicMore.onclick=()=>publicProfile(id,kind,true);publicMore.hidden=next===null;setStatus('');
      }catch(error){if(alive()&&ticket===requestTicket){content.replaceChildren();message(error);content.append(link('回到博客','/'));}}
    }
    async function editor(){
      if(!cloud.state().user){loginPrompt();return;}const requestTicket=++ticket,user=cloud.state().user;setStatus('正在加载主页设置…');content.replaceChildren();
      try{const data=await cloud.request('/v1/community/profile');if(!alive()||ticket!==requestTicket||user.id!==cloud.state().user?.id)return;
        let profile=data.profile,avatarURL=profile?.avatar||user.avatar;
        const heading=el('header',undefined,'nc-heading'),text=el('div');text.append(el('h1','我的个人主页'),el('p','写点介绍，挑几篇喜欢的内容，让大家认识你。'));const nav=el('nav');nav.append(link('我的交流','/activity/'),link('账号设置','/account/'));heading.append(text,nav);content.append(heading);
        const form=el('form',undefined,'nc-editor');form.dataset.profileEditor='';const fields=el('div'),books=el('section'),preview=el('div',undefined,'nc-profile-top'),previewCopy=el('div',undefined,'nc-profile-copy'),previewName=el('h2',profile?.name||user.name),previewBio=el('p',profile?.bio||'你的简介会显示在这里。');previewCopy.append(previewName,previewBio);preview.append(avatar(profile?.name||user.name,avatarURL),previewCopy);fields.append(preview);
        const field=(label,input)=>{const box=el('label',undefined,'nc-field');box.append(el('span',label),input);fields.append(box);};
        const name=el('input');name.type='text';name.name='name';name.maxLength=40;name.required=true;name.value=profile?.name||user.name;field('展示昵称',name);
        const bio=el('textarea');bio.name='bio';bio.maxLength=280;bio.rows=4;bio.placeholder='最近在做什么，或者喜欢聊什么？';bio.value=profile?.bio||'';field('个人简介',bio);
        name.oninput=()=>{previewName.textContent=name.value||user.name;};bio.oninput=()=>{previewBio.textContent=bio.value||'你的简介会显示在这里。';};
        const check=(label,key,value)=>{const box=el('label',undefined,'nc-check'),input=el('input');input.type='checkbox';input.name=key;input.checked=value;box.append(input,el('span',label));fields.append(box);return input;};
        const enabled=check('公开我的个人主页','enabled',profile?.enabled||false),shareBadges=check('展示我的成就（交流、已读记录和2048成绩）','shareBadges',profile?.shareBadges??true);
        fields.append(button('使用当前账号头像',()=>{avatarURL=cloud.state().user?.avatar||'';preview.querySelector('.nc-avatar').replaceWith(avatar(name.value,avatarURL));}));
        if(data.badges.length)fields.append(badgeList(data.badges));
        const actions=el('div',undefined,'nc-editor-actions'),save=el('button','保存主页','nc-primary');save.type='submit';actions.append(save);const publicLink=link('查看我的公开主页',profile?'/people/?id='+profile.id:'/people/');publicLink.hidden=!profile?.enabled;publicLink.dataset.profilePublicLink='';actions.append(publicLink);fields.append(actions);
        books.append(el('h2','推荐收藏'),el('p','勾选想展示在主页上的收藏，最多40篇。','nc-help'));const search=el('input');search.type='text';search.placeholder='查找收藏';search.setAttribute('aria-label','查找收藏');books.append(search);
        const options=el('div',undefined,'nc-book-options'),selected=new Set(data.selected),checks=[];
        data.bookmarks.forEach(item=>{const label=el('label',undefined,'nc-check'),input=el('input');input.type='checkbox';input.value=item.path;input.checked=selected.has(item.path);input.name='book';label.append(input,el('span',item.title));options.append(label);checks.push({input,label,title:item.title});});
        search.oninput=()=>{const value=search.value.trim().toLowerCase();checks.forEach(item=>{item.label.hidden=!item.title.toLowerCase().includes(value);});};
        if(!checks.length)options.append(el('p','先在文章或页面里收藏一些内容，再来挑选。','nc-help'));books.append(options,link('打开我的书架','/favorites/'));form.append(fields,books);content.append(form);
        form.onsubmit=async event=>{event.preventDefault();const chosen=checks.filter(item=>item.input.checked).map(item=>item.input.value);if(chosen.length>40){message(new Error('最多展示40篇收藏，请再挑选一下'));return;}
          save.disabled=true;setStatus('正在保存…');try{const result=await cloud.request('/v1/community/profile',{method:'POST',body:{name:name.value.trim(),bio:bio.value,avatar:avatarURL,enabled:enabled.checked,shareBadges:shareBadges.checked,selected:chosen,version:profile?.version||0}});if(!alive()||user.id!==cloud.state().user?.id)return;profile=result.profile;publicLink.href='/people/?id='+profile.id;publicLink.hidden=!profile.enabled;setStatus(profile.enabled?'主页已保存并公开。':'主页已保存，当前仅自己可见。');}
          catch(error){message(error);}finally{if(alive())save.disabled=false;}
        };setStatus('');
      }catch(error){message(error);if(alive())content.append(button('重新加载',editor));}
    }
    const publicId=page.hasAttribute('data-community-people')?new URLSearchParams(location.search).get('id'):null;
    if(page.hasAttribute('data-community-activity')){
      activeKind=new URLSearchParams(location.search).get('tab')||'posts';if(!['posts','comments','participated','ai','following'].includes(activeKind))activeKind='posts';reload=()=>activity();
      page.querySelectorAll('[data-activity-kind]').forEach(n=>{n.onclick=()=>{activeKind=n.dataset.activityKind;const url=new URL(location.href);url.searchParams.set('tab',activeKind);history.replaceState(null,'',url);activity();};});more.onclick=()=>activity(true);
      const nav=page.querySelector('.nc-heading nav');nav.append(button('刷新',()=>activity()));
    }else if(publicId){if(!/^[a-f0-9-]{36}$/.test(publicId)){message(new Error('个人主页地址无效'));return;}reload=()=>publicProfile(publicId);reload();}
    else reload=editor;
    cloud.ready().then(()=>{if(!alive())return;unsubscribe=cloud.subscribe(state=>{const id=state.user?.id||null;if(id===renderedUser)return;renderedUser=id;if(!publicId)reload();});});
    const poll=setInterval(()=>{if(alive()&&activeKind==='following'&&!document.hidden&&cloud.state().user)activity();},30000);
    const resume=()=>{if(alive()&&activeKind==='following'&&!document.hidden&&cloud.state().user)activity();};document.addEventListener('visibilitychange',resume);
    cleanup=()=>{ticket++;unsubscribe?.();clearInterval(poll);document.removeEventListener('visibilitychange',resume);};
  }
  document.addEventListener('pjax:send',()=>{epoch++;cleanup?.();cleanup=null;});
  document.addEventListener('pjax:complete',boot);
  document.addEventListener('nuo:comments-mount',()=>document.querySelectorAll('[data-nuo-comments]').forEach(mountFollow));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
