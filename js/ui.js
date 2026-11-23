(function(){
var CL=window.CL,e=CL.esc,I=CL.icon,A=CL.asset;
var U=CL.url={home:'index.html',catalog:'catalog.html',lenses:'catalog.html?category=lenses',care:'catalog.html?category=care',accessories:'catalog.html?category=accessories',quiz:'quiz.html',tracking:'order.html',offers:'offers.html',tryon:'try-on.html',cart:'cart.html',wishlist:'wishlist.html',search:'catalog.html?focus=q',about:'about.html',faq:'faq.html',shipping:'shipping.html',returns:'returns.html',privacy:'privacy.html',terms:'terms.html',contact:'contact.html',
 product:function(p){return 'product.html?slug='+encodeURIComponent(p.slug)}};
U.cart='cart.html';U.offers='offers.html';['quiz','tryon','wishlist'].forEach(function(k){U[k]='extra.html?p='+k});['about','faq','shipping','returns','privacy','terms','contact'].forEach(function(k){U[k]='page.html?p='+k});U.brands='brands.html';
var SOC={facebook:'<svg class="soc" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 8.5V6.9c0-.7.2-1.1 1.2-1.1H17V2.6c-.3-.1-1.3-.2-2.4-.2-2.4 0-4 1.5-4 4.1v2H8v3.4h2.6V21H14v-9.1h2.6l.4-3.4H14z"/></svg>',
 instagram:'<svg class="soc" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.6" y="3.6" width="16.8" height="16.8" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3.9" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.1" cy="6.9" r="1.15" fill="currentColor"/></svg>',
 tiktok:'<svg class="soc" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.6 2h-3.3v13.1a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.2 6.2 0 1 0 5.3 6.1V8.7a7.4 7.4 0 0 0 4.3 1.4V6.9A4.3 4.3 0 0 1 16.6 2z"/></svg>'};
var S={},PRODUCTS=[],LAST=null,SHP=null,self2=null,GAL=null;
function img(file,alt,extra){var d=CL.dims[file]||[];return '<img src="'+A(file)+'" alt="'+e(alt||'')+'"'+(d[0]?' width="'+d[0]+'" height="'+d[1]+'"':'')+(extra||'')+'>'}
var NAV=[['الرئيسية','home'],['العدسات','lenses'],['المحاليل والتعقيم','care'],['الإكسسوارات','accessories'],['اعثري على عدستك','quiz'],['تتبعي طلبك','tracking'],['العروض','offers'],['جرّبي اللون','tryon']];
CL.ui={
 img:img,
 init:function(s,p){S=s||{};PRODUCTS=p||[];
  try{if(S.wheel&&S.wheel.on&&!/(cart|order|admin|extra)\.html/.test(location.pathname)&&!window.__NOWHEEL){var sc=document.createElement('script');sc.src=CL.config.base+'js/wheel.js';sc.onload=function(){CL.wheel.start(S.wheel)};document.head.appendChild(sc)}}catch(x){}},
 trust:function(){return '<div class="trust">'+[['eye','عدسات أصلية'],['truck','شحن سريع'],['bag','دفع عند الاستلام'],['return','استرجاع']].map(function(x){return '<span>'+I(x[0])+x[1]+'</span>'}).join('')+'</div>'},
 header:function(){
  var n=CL.cart.count();
  return '<a class="sr" href="#main">تخطي إلى المحتوى</a><div class="top">'+e(S.announcement||'')+'</div><header><div class="head"><div class="tools"><button class="iconbtn" data-menu aria-label="القائمة">'+I('menu')+'</button><a class="iconbtn" href="'+U.search+'" aria-label="بحث">'+I('search')+'</a><a class="iconbtn" href="'+U.catalog+'" aria-label="فلتر">'+I('filter')+'</a></div><a href="'+U.home+'" aria-label="Catchy Lens">'+img('logo.svg','Catchy Lens',' class="logo"')+'</a><div class="tools end"><a class="iconbtn desktop-only" href="'+U.wishlist+'" aria-label="المفضلة">'+I('heart')+'</a><a class="iconbtn" data-cartlink href="'+U.cart+'" aria-label="السلة">'+I('bag')+(n?'<span class="count">'+n+'</span>':'')+'</a></div></div><nav class="nav">'+NAV.map(function(x){return '<a href="'+U[x[1]]+'">'+x[0]+'</a>'}).join('')+'</nav></header><div class="drawer" hidden><nav aria-label="القائمة"><button class="x" data-menu aria-label="إغلاق">×</button>'+NAV.concat([['من نحن','about'],['الأسئلة الشائعة','faq'],['تواصلي معانا','contact']]).map(function(x){return '<a href="'+U[x[1]]+'">'+x[0]+'</a>'}).join('')+'</nav></div>';
 },
 footer:function(){
  var D=CL.defaults||{},wl=S.whatsapp?'https://wa.me/'+e(S.whatsapp):'';
  var soc=[['فيسبوك','facebook',S.facebook||D.facebook],['إنستجرام','instagram',S.instagram||D.instagram],['تيك توك','tiktok',S.tiktok||D.tiktok]].filter(function(x){return x[2]});
  var icons=soc.map(function(x){return '<a class="si" href="'+e(x[2])+'" target="_blank" rel="noopener" aria-label="'+x[0]+'">'+SOC[x[1]]+'</a>'}).concat(wl?['<a class="si" href="'+wl+'" target="_blank" rel="noopener" aria-label="واتساب">'+I('chat')+'</a>']:[]);
  var social=icons.length?'<div class="social icons">'+icons.join('')+'</div>':'';
  var fl=[soc.filter(function(x){return x[1]==='instagram'})[0],soc.filter(function(x){return x[1]==='facebook'})[0]].filter(Boolean).map(function(x){return '<a class="fl" href="'+e(x[2])+'" target="_blank" rel="noopener" aria-label="'+x[0]+'">'+SOC[x[1]]+'</a>'}).join('');
  var floaters=(fl||wl)?'<div class="floaters">'+fl+(wl?'<a class="wa" href="'+wl+'" target="_blank" rel="noopener" aria-label="واتساب">'+I('chat')+'</a>':'')+'</div>':'';
  function col(h,l){return '<div><h3>'+h+'</h3>'+l.map(function(x){return '<a href="'+U[x[1]]+'">'+x[0]+'</a>'}).join('')+'</div>'}
  return '<footer class="footer"><div class="wrap"><div class="footgrid"><div>'+img('logo.svg','Catchy Lens')+'<p><bdi dir="ltr">Your Eyes. Your Magic.</bdi></p><small>عدسات وألوان... بطريقتك.</small></div>'+col('اكتشفي',[['كل المنتجات','catalog'],['الماركات','brands'],['اعثري على عدستك','quiz'],['المفضلة','wishlist'],['من نحن','about'],['العروض','offers'],['جرّبي اللون','tryon']])+col('نساعدك',[['تتبعي طلبك','tracking'],['الأسئلة الشائعة','faq'],['الشحن','shipping'],['الاستبدال والاسترجاع','returns'],['الخصوصية','privacy'],['الشروط','terms'],['تواصلي معانا','contact']])+'</div>'+social+'<div class="copyright">© Catchy Lens</div></div></footer>'+floaters+'<button type="button" class="as-launch" data-asst aria-label="المساعد">'+I('chat')+'<span>اسألي مساعدنا</span></button>';
 },
 card:function(p){
  var d=CL.dims[p.image]||[],disc=p.oldPrice&&p.price&&p.oldPrice>p.price?Math.round((1-p.price/p.oldPrice)*100):0,href=U.product(p);
  var out=p.state==='out',chip='',tl=p.category==='lenses'?CL.typeLabel(p):'';
  return '<article class="card"><button class="wish'+(CL.wish.has(p.id)?' selected':'')+'" data-wish="'+p.id+'" aria-label="المفضلة" aria-pressed="'+CL.wish.has(p.id)+'">'+I('heart')+'</button><button type="button" class="qvbtn" data-qv="'+p.id+'" aria-label="نظرة سريعة">'+I('eye')+'</button><a class="photo" href="'+href+'">'+img(p.image,p.name,' loading="lazy" decoding="async"')+(disc?'<span class="tag discount"><bdi dir="ltr">-'+disc+'%</bdi></span>':'')+chip+'</a><div class="card-info"><span class="brand">'+e(p.brand)+'</span>'+(tl?'<small class="ttag">'+tl+'</small>':'')+'<a href="'+href+'"><h3>'+e(p.name)+'</h3></a><div class="price">'+CL.money(p.price)+'</div>'+(p.oldPrice?'<del class="old">السعر القديم: '+CL.money(p.oldPrice)+'</del>':'')+'<span class="stock '+(p.state==='in'?'':e(p.state))+'">'+(CL.state[p.state]||'')+'</span>'+(out?'<a class="btn" href="'+href+'">شوفي التفاصيل</a>':'<button type="button" class="btn" data-add="'+p.id+'">أضيفي للسلة</button>')+(p.state==='pre'?'<small>'+(S.leadDays?'تُجهّز خلال '+e(S.leadDays)+' أيام':'تُجهّز بالطلب')+'</small>':'')+'</div></article>';
 },
 sheet:function(p,full){
  LAST=document.activeElement;
  var both=p.powerType==='both',pw=CL.powerList(p,S),po=CL.planoOk(p),o='<option value="">اختاري القوة</option>'+(po?'<option value="0.00">بدون قوة (0.00)</option>':'')+pw.map(function(x){return '<option value="'+e(x)+'">'+e(x)+'</option>'}).join('');
  var out=p.state==='out',disc=p.oldPrice&&p.price&&p.oldPrice>p.price?Math.round((1-p.price/p.oldPrice)*100):0;
  var top='';
  if(full){
   var imgs=(p.images&&p.images.length?p.images:[p.image]).slice(0,6),sib=p.pid!=null?PRODUCTS.filter(function(x){return x.pid===p.pid}):[],tl=p.category==='lenses'?CL.typeLabel(p):'';
   GAL={n:imgs.length,i:0,imgs:imgs};
   top='<div class="qv-gal"><div class="qv-main"><img id="qv-img" src="'+A(imgs[0])+'" alt="'+e(p.name)+'">'+(disc?'<span class="tag discount"><bdi dir="ltr">-'+disc+'%</bdi></span>':'')+(imgs.length>1?'<button type="button" class="qv-ar l" data-qa="1" aria-label="الصورة التالية"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button type="button" class="qv-ar r" data-qa="-1" aria-label="الصورة السابقة"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button><span class="qv-cnt" data-cnt>1 / '+imgs.length+'</span>':'')+'</div></div>'
    +'<span class="brand">'+e(p.brand)+'</span>'+(tl?'<small class="ttag">'+tl+'</small>':'')+'<h3 id="sh-t">'+e(p.fullName||p.name)+'</h3>'
    +'<div class="pricebox"><span class="price">'+CL.money(p.price)+'</span>'+(p.oldPrice?'<del class="old">'+CL.money(p.oldPrice)+'</del>':'')+'<span class="stock '+(p.state==='in'?'':e(p.state))+'">'+(CL.state[p.state]||'')+'</span></div>'
    +(sib.length>1?'<div class="qv-sw" role="group" aria-label="الألوان"><span class="qv-lbl">اللون: <b>'+e(p.name)+'</b></span><div class="qv-swl">'+sib.map(function(x){return '<button type="button" class="sw'+(x.id===p.id?' on':'')+(x.state==='out'?' out':'')+'" data-sw="'+x.id+'" aria-pressed="'+(x.id===p.id)+'" aria-label="'+e(x.name)+(x.state==='out'?' (غير متاح)':'')+'" title="'+e(x.name)+(x.state==='out'?' - غير متاح':'')+'"><img src="'+A(x.image)+'" alt="" loading="lazy"><span>'+e(x.name)+'</span></button>'}).join('')+'</div></div>':'')
    +(p.description?'<p class="note">'+e(String(p.description).slice(0,150))+(String(p.description).length>150?'…':'')+'</p>':'');
  }else top='<span class="brand">'+e(p.brand)+'</span><h3 id="sh-t">'+e(p.name)+'</h3>';
  var h='<div class="sheet" data-sheet><div class="sheet-box'+(full?' qv':'')+'" role="dialog" aria-modal="true" aria-labelledby="sh-t"><button type="button" class="x" data-close aria-label="إغلاق">×</button>'+top;
  if(!full||both)h+='<div class="seg" role="radiogroup" aria-label="نوع العدسة"><label><input type="radio" name="pt" value="plano"'+(po?' checked':' disabled')+'> <span>بدون قوة (Plano)</span></label><label><input type="radio" name="pt" value="power"'+(po?'':' checked')+'> <span>بقوة نظر</span></label></div>'
   +'<div class="powers"'+(po?' hidden':'')+'><div class="two"><label>العين اليمنى<select name="r">'+o+'</select></label><label>العين اليسرى<select name="l">'+o+'</select></label></div><label class="same"><input type="checkbox" name="same"> <span>نفس القوة للعين التانية</span></label><p class="note">تأكدي من الروشتة قبل اختيار القوة.</p></div>'
   +'<p class="note sheetprice" data-sp></p>';
  if(!(full&&out))h+='<div class="qty"><span>الكمية</span><div dir="ltr"><button type="button" data-q="-1" aria-label="أقل">−</button><output>1</output><button type="button" data-q="1" aria-label="أكتر">+</button></div></div>';
  h+=(p.state==='pre'?'<p class="note">'+(S.leadDays?'تُجهّز خلال '+e(S.leadDays)+' أيام':'تُجهّز بالطلب')+'</p>':'')
   +'<p class="err" role="alert" hidden></p>'
   +((full&&out)?'<button type="button" class="btn" disabled>غير متاح حاليًا</button>':'<button type="button" class="btn" data-confirm="'+p.id+'">أضيفي للسلة</button>'+(full?'<button type="button" class="btn alt" data-buy="'+p.id+'">اشتري الآن</button>':''))
   +(full?'<a class="textlink qv-more" href="'+U.product(p)+'">شوفي التفاصيل الكاملة</a>':'')+'</div></div>';
  var d=document.createElement('div');d.innerHTML=h;document.body.appendChild(d.firstChild);document.documentElement.classList.add('lock');
  var sh=document.querySelector('[data-sheet]'),f=sh.querySelector('input:not([disabled]),.sw.on')||sh.querySelector('[data-close]');if(f)f.focus();self2.sheetPrice(sh,p);SHP=p;
 },
 sheetPrice:function(sh,p){var el=sh.querySelector('[data-sp]');if(!el)return;var pc=sh.querySelector('input[name=pt]:checked'),pt=pc?pc.value:'plano',r=(sh.querySelector('[name=r]')||{}).value,l=(sh.querySelector('[name=l]')||{}).value,same=!!(sh.querySelector('[name=same]')||{}).checked;if(same)l=r;
  var it=pt==='power'?{plano:false,r:r,l:l}:{plano:true};var u=CL.unitPrice(p,it),pp=p.powerPrice!=null?p.powerPrice:p.price;
  el.textContent=pt==='power'&&pp!==p.price?'سعر الزوج حسب اختيارك: '+CL.money(u)+(r&&l&&CL.eyePw(r)!==CL.eyePw(l)?' (متوسط سعر البلانو والباور)':''):'السعر: '+CL.money(u)},
 qvGo:function(sh,d){if(!GAL||GAL.n<2)return;GAL.i=(GAL.i+d+GAL.n)%GAL.n;var m=sh.querySelector('#qv-img'),c=sh.querySelector('[data-cnt]');if(m)m.src=A(GAL.imgs[GAL.i]);if(c)c.textContent=(GAL.i+1)+' / '+GAL.n},
 closeSheet:function(){var s=document.querySelector('[data-sheet]');if(!s)return;s.remove();document.documentElement.classList.remove('lock');if(LAST&&LAST.focus)LAST.focus()},
 bind:function(){
  var dr=document.querySelector('.drawer'),self=this;
  function byId(id){return PRODUCTS.filter(function(x){return x.id===+id})[0]}
  document.addEventListener('click',function(ev){
   var t=ev.target,m=t.closest('[data-menu]');if(m&&dr){dr.hidden=!dr.hidden;return}
   if(dr&&!dr.hidden&&t===dr){dr.hidden=true;return}
   var w=t.closest('[data-wish]');if(w){var on=CL.wish.toggle(+w.dataset.wish);w.classList.toggle('selected',on);w.setAttribute('aria-pressed',on);CL.toast(on?'اتضافت للمفضلة':'اتشالت من المفضلة');return}
   var a=t.closest('[data-add]');if(a){var p=byId(a.dataset.add);if(!p)return;if(p.powerType==='both'){self.sheet(p)}else{CL.cart.add({id:p.id,slug:p.slug,plano:true,q:1});CL.toast('اتضافت للسلة')}return}
   var as=t.closest('[data-asst]');if(as){var go=function(){CL.assistant.open()};if(CL.assistant)go();else{var sc=document.createElement('script');sc.src=CL.config.base+'js/assistant.js?v=24';sc.onload=go;document.head.appendChild(sc)}return}
   var qv=t.closest('[data-qv]');if(qv){if(ev.ctrlKey||ev.metaKey||ev.shiftKey||ev.button)return;var qp=byId(qv.dataset.qv);if(qp){ev.preventDefault();self.sheet(qp,true)}return}
   var sh=t.closest('[data-sheet]');if(!sh)return;
   var sw=t.closest('[data-sw]');if(sw){var np=byId(sw.dataset.sw);if(np){var k=LAST;sh.remove();self.sheet(np,true);LAST=k}return}
   var qa=t.closest('[data-qa]');if(qa){self.qvGo(sh,+qa.dataset.qa);return}
   if(t.closest('[data-close]')||t===sh){self.closeSheet();return}
   var q=t.closest('[data-q]');if(q){var o=sh.querySelector('output'),n=Math.max(1,Math.min(10,(+o.textContent)+(+q.dataset.q)));o.textContent=n;return}
   var c=t.closest('[data-confirm],[data-buy]');if(c){
    var go=c.hasAttribute('data-buy'),p=byId(c.dataset.confirm||c.dataset.buy),pc=sh.querySelector('input[name=pt]:checked'),pt=pc?pc.value:'plano',r=(sh.querySelector('[name=r]')||{}).value,l=(sh.querySelector('[name=l]')||{}).value,same=!!(sh.querySelector('[name=same]')||{}).checked,er=sh.querySelector('.err'),qty=+sh.querySelector('output').textContent;
    if(pt==='power'){if(same)l=r;if(!r||!l){er.textContent='اختاري قوة العين اليمنى والعين اليسرى.';er.hidden=false;return}if(!CL.planoOk(p)&&(r==='0.00'||l==='0.00')){er.textContent='البلانو مش متاح حاليًا في اللون ده، اختاري قوة للعينين.';er.hidden=false;return}CL.cart.add(r==='0.00'&&l==='0.00'?{id:p.id,slug:p.slug,plano:true,q:qty}:{id:p.id,slug:p.slug,plano:false,r:r,l:l,q:qty})}
    else CL.cart.add({id:p.id,slug:p.slug,plano:true,q:qty});
    if(go){location.href=U.cart;return}
    self.closeSheet();CL.toast('اتضافت للسلة');
   }
  });
  var tx0=null;
  document.addEventListener('touchstart',function(ev){var m=ev.target.closest&&ev.target.closest('.qv-main');tx0=m&&ev.touches.length===1?ev.touches[0].clientX:null},{passive:true});
  document.addEventListener('touchend',function(ev){if(tx0==null)return;var dx=ev.changedTouches[0].clientX-tx0,sh=document.querySelector('[data-sheet]');tx0=null;if(sh&&Math.abs(dx)>40)self.qvGo(sh,dx<0?1:-1)},{passive:true});
  document.addEventListener('change',function(ev){
   var sh=ev.target.closest('[data-sheet]');if(!sh)return;
   if(ev.target.name==='pt'&&sh.querySelector('.powers'))sh.querySelector('.powers').hidden=ev.target.value!=='power';
   if(ev.target.name==='same'||ev.target.name==='r'){var s=sh.querySelector('[name=same]').checked,L=sh.querySelector('[name=l]');L.disabled=s;if(s)L.value=sh.querySelector('[name=r]').value}
   if(SHP)CL.ui.sheetPrice(sh,SHP);
  });
  document.addEventListener('keydown',function(ev){
   if(ev.key==='Escape'){if(dr)dr.hidden=true;self.closeSheet();return}
   if(ev.key==='Tab'){var sh=document.querySelector('[data-sheet] .sheet-box');if(!sh)return;var f=[].slice.call(sh.querySelectorAll('button,input,select,a[href]')).filter(function(x){return !x.disabled&&x.offsetParent!==null});if(!f.length)return;var first=f[0],last=f[f.length-1];if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus()}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus()}}
  });
 }
};
self2=CL.ui;CL.ui.data=function(){return {S:S,P:PRODUCTS}};
})();
