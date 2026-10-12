import { ICON_SVGS, SIZE_DIMENSIONS, AVATARS } from "./chatbot-config";

// Self-contained vanilla JS widget served to customer websites.
export function widgetScript() {
  return `(function(){
var ICONS=${JSON.stringify(ICON_SVGS)};var SIZES=${JSON.stringify(SIZE_DIMENSIONS)};var AV=${JSON.stringify(AVATARS)};
var s=document.currentScript||document.querySelector('script[data-agent]');if(!s)return;
var agent=s.getAttribute('data-agent');var base=new URL(s.src).origin;var api=base+'/api/public/widget/'+agent;
var preview=s.hasAttribute('data-preview');var KEY='agentstudio:'+agent;
var st={};try{st=JSON.parse(sessionStorage.getItem(KEY)||'{}')}catch(e){}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
var msgs=st.messages||[];var cfg=null;var open=false;var busy=false;
var host=document.createElement('div');host.id='agentstudio-widget';document.body.appendChild(host);
var root=host.attachShadow({mode:'open'});
function esc(t){return String(t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function md(t){return esc(t).replace(/\\*\\*(.+?)\\*\\*/g,'<b>$1</b>').replace(/\\[([^\\]]+)\\]\\((https?:[^)\\s]+)\\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/(^|\\s)(https?:\\/\\/[^\\s<]+)/g,'$1<a href="$2" target="_blank" rel="noopener">$2</a>').replace(/\\n/g,'<br>')}
function avatar(){return cfg.avatar==='upload'&&cfg.avatar_url?cfg.avatar_url:(cfg.avatar==='male'?AV.male:AV.female)}
function svg(p,sz){return '<svg width="'+sz+'" height="'+sz+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'}
function needLead(){return cfg.lead_form&&cfg.lead_form.enabled&&!st.contactId}
function render(){
 var c=cfg.colors,d=SIZES[cfg.size]||SIZES.normal,side=cfg.position==='bottom-left'?'left':'right';
 var css='*{box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}.fab{position:fixed;bottom:20px;'+side+':20px;width:58px;height:58px;border-radius:50%;border:0;background:'+c.accent+';color:#fff;cursor:pointer;display:grid;place-items:center;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:2147483646;transition:transform .2s}.fab:hover{transform:scale(1.06)}'
 +'.win{position:fixed;bottom:90px;'+side+':20px;width:'+d.w+'px;height:'+d.h+'px;max-width:calc(100vw - 24px);max-height:calc(100vh - 110px);background:'+c.background+';color:'+c.text+';border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.28);display:flex;flex-direction:column;overflow:hidden;z-index:2147483647}'
 +'.hd{display:flex;align-items:center;gap:10px;padding:14px 16px;background:'+c.accent+';color:#fff}.hd img{width:38px;height:38px;border-radius:50%;object-fit:cover;background:#fff}.hd b{display:block;font-size:15px}.hd small{opacity:.85;font-size:12px}.x{margin-left:auto;background:none;border:0;color:#fff;cursor:pointer;font-size:20px}'
 +'.body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}.m{max-width:82%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;word-wrap:break-word}.m a{color:inherit}.b{background:'+c.bubble+';color:'+c.text+';align-self:flex-start;border-bottom-left-radius:4px}.u{background:'+c.accent+';color:#fff;align-self:flex-end;border-bottom-right-radius:4px}'
 +'.qr{display:flex;flex-wrap:wrap;gap:6px}.qr button{border:1px solid '+c.accent+';color:'+c.accent+';background:transparent;border-radius:999px;padding:6px 12px;font-size:13px;cursor:pointer}'
 +'.ft{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(127,127,127,.2)}.ft input,.lf input{flex:1;border:1px solid rgba(127,127,127,.35);border-radius:10px;padding:10px 12px;font-size:14px;background:transparent;color:inherit;outline:none}.ft button,.lf button{border:0;border-radius:10px;background:'+c.accent+';color:#fff;padding:0 14px;cursor:pointer;font-size:14px}'
 +'.lf{display:flex;flex-direction:column;gap:10px;padding:18px}.lf p{margin:0 0 4px;font-size:14px}.lf button{padding:11px}.err{color:#dc2626;font-size:12px}.dots span{display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;background:currentColor;opacity:.4;animation:bl 1s infinite}.dots span:nth-child(2){animation-delay:.2s}.dots span:nth-child(3){animation-delay:.4s}@keyframes bl{50%{opacity:1}}';
 var h='<style>'+css+'</style><button class="fab" aria-label="Open chat">'+(open?svg('<path d="M18 6 6 18M6 6l12 12"/>',24):svg(ICONS[cfg.icon]||ICONS.chat,26))+'</button>';
 if(open){
  h+='<div class="win" role="dialog"><div class="hd"><img src="'+esc(avatar())+'" alt=""><div><b>'+esc(cfg.bot_name)+'</b><small>'+esc(cfg.status_text)+'</small></div><button class="x" aria-label="Close">&times;</button></div>';
  if(needLead()){
   var f=cfg.lead_form.fields;h+='<form class="lf"><p>Before we start, please share your details.</p>'+(f.name?'<input name="name" placeholder="Your name" required maxlength="200">':'')+(f.email?'<input name="email" type="email" placeholder="Email" required maxlength="255">':'')+(f.phone?'<input name="phone" type="tel" placeholder="Phone" required maxlength="50">':'')+'<div class="err"></div><button type="submit">Start chat</button></form>';
  }else{
   h+='<div class="body">';h+='<div class="m b">'+md(cfg.first_message)+'</div>';
   msgs.forEach(function(m){h+='<div class="m '+(m.role==='user'?'u':'b')+'">'+(m.content?md(m.content):'<span class="dots"><span></span><span></span><span></span></span>')+'</div>'});
   if(!msgs.length&&cfg.quick_replies.length){h+='<div class="qr">'+cfg.quick_replies.filter(Boolean).map(function(q){return '<button>'+esc(q)+'</button>'}).join('')+'</div>'}
   h+='</div><form class="ft"><input placeholder="'+esc(cfg.placeholder)+'" maxlength="4000" '+(busy?'disabled':'')+'><button type="submit" '+(busy?'disabled':'')+' aria-label="Send">'+svg('<path d="m22 2-7 20-4-9-9-4z"/>',18)+'</button></form>';
  }
  h+='</div>';
 }
 root.innerHTML=h;
 root.querySelector('.fab').onclick=function(){open=!open;render()};
 if(!open)return;
 root.querySelector('.x').onclick=function(){open=false;render()};
 var lf=root.querySelector('.lf');if(lf)lf.onsubmit=submitLead;
 var b=root.querySelector('.body');if(b)b.scrollTop=b.scrollHeight;
 root.querySelectorAll('.qr button').forEach(function(x){x.onclick=function(){send(x.textContent)}});
 var ft=root.querySelector('.ft');if(ft){var inp=ft.querySelector('input');if(!busy)inp.focus();ft.onsubmit=function(e){e.preventDefault();var v=inp.value.trim();if(v)send(v)}}
}
function submitLead(e){e.preventDefault();var fd=new FormData(e.target);var body={};fd.forEach(function(v,k){body[k]=String(v)});
 if(preview){st.contactId='preview';save();render();return}
 fetch(api+'/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||'Error');st.contactId=j.contactId;save();render()})}).catch(function(err){root.querySelector('.err').textContent=err.message})}
function send(text){if(busy)return;busy=true;msgs.push({role:'user',content:text});var reply={role:'assistant',content:''};msgs.push(reply);render();
 var hist=msgs.slice(0,-1).slice(-30);var t0=Date.now();var wait=Math.max(0,Math.min(5,Number(cfg.wait_seconds)||0))*1000;
 fetch(api+'/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversationId:st.conversationId||null,contactId:st.contactId&&st.contactId!=='preview'?st.contactId:null,messages:hist})}).then(function(r){
  var cid=r.headers.get('X-Conversation-Id');if(cid){st.conversationId=cid}
  if(!r.ok)return r.json().then(function(j){throw new Error(j.error||'Error')});
  return new Promise(function(res){setTimeout(res,Math.max(0,wait-(Date.now()-t0)))}).then(function(){
   var rd=r.body.getReader(),dec=new TextDecoder();
   function pump(){return rd.read().then(function(x){if(x.done)return;reply.content+=dec.decode(x.value,{stream:true});render();return pump()})}
   return pump()});
 }).catch(function(err){reply.content=err.message||'Something went wrong.'}).then(function(){busy=false;if(!reply.content)reply.content='Sorry, I had no answer.';st.messages=msgs;save();render()})}
function start(c){cfg=c;render()}
if(preview){window.addEventListener('message',function(e){if(e.data&&e.data.type==='agentstudio:config'){if(e.data.reset){msgs=[];st={};save()}open=e.data.open!==undefined?e.data.open:open;start(e.data.config)}});}
fetch(api+'/config').then(function(r){return r.json()}).then(function(j){if(j.config&&!cfg)start(j.config)}).catch(function(){});
})();`;
}
