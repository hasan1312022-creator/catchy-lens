(function(){
var C=window.CL.config,URL=C.supabaseUrl,KEY=C.anonKey,BUCKET='store-images';
var root=document.getElementById('root'),S={tok:null,ref:null,uid:null,tab:'products',products:[],settings:{},coupons:[],q:'',flt:'all'};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var DUR=[['','غير محدد'],['daily','يومية'],['monthly','شهرية'],['quarterly','ربع سنوية'],['semiannual','نصف سنوية'],['yearly','سنوية']];
var SW=[['','بدون'],['gray','رمادي'],['blue','أزرق'],['brown','بني'],['green','أخضر'],['hazel','هازل'],['honey','عسلي'],['lilac','بنفسجي'],['cocoa','كاكاو']];
var CAT=[['lenses','عدسات'],['care','محاليل وعناية'],['accessories','إكسسوارات']];
function opts(list,v){return list.map(function(x){return '<option value="'+esc(x[0])+'"'+(x[0]===v?' selected':'')+'>'+esc(x[1])+'</option>'}).join('')}
function msg(t,bad){var d=document.createElement('div');d.className='msg'+(bad?' err':'');d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},bad?5000:2200)}
function save(){try{sessionStorage.setItem('cl-adm',JSON.stringify({t:S.tok,r:S.ref,u:S.uid}))}catch(e){}}
function load(){try{var o=JSON.parse(sessionStorage.getItem('cl-adm')||'null');if(o){S.tok=o.t;S.ref=o.r;S.uid=o.u}}catch(e){}}
function hdr(extra){var h={apikey:KEY,Authorization:'Bearer '+(S.tok||KEY)};for(var k in (extra||{}))h[k]=extra[k];return h}
var EMB=/[?&]embed=1/.test(location.search)&&window.parent!==window;
function ptok(){return Promise.resolve(window.parent.__clTok()).then(function(o){if(!o||!o.t)throw new Error('no-session');S.tok=o.t;S.uid=o.u})}
function refresh(){
 if(EMB)return ptok();
 if(!S.ref)return Promise.reject(new Error('no-ref'));
 return fetch(URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:S.ref})})
  .then(function(r){if(!r.ok)throw new Error('refresh');return r.json()}).then(function(j){S.tok=j.access_token;S.ref=j.refresh_token;save()});
}
function api(path,o,retry){
 o=o||{};var h=hdr(o.headers);if(o.body!==undefined&&!(o.body instanceof Blob))h['Content-Type']='application/json';
 return fetch(URL+path,{method:o.method||'GET',headers:h,body:o.body instanceof Blob?o.body:(o.body!==undefined?JSON.stringify(o.body):undefined)}).then(function(r){
  if(r.status===401&&!retry)return refresh().then(function(){return api(path,o,true)});
  return r.text().then(function(t){var j=null;try{j=t?JSON.parse(t):null}catch(e){}
   if(!r.ok)throw new Error((j&&(j.message||j.error||j.msg))||('http '+r.status));return j});
 });
}
/* ---------- login ---------- */
function loginView(err){
 root.innerHTML='<div class="login"><form class="card" id="lf"><h2>دخول لوحة التحكم</h2><label>البريد الإلكتروني<input name="e" type="email" autocomplete="username" dir="ltr" required></label><label>كلمة المرور<input name="p" type="password" autocomplete="current-password" dir="ltr" required></label>'+(err?'<p style="color:#a3263d;margin:0">'+esc(err)+'</p>':'')+'<button class="btn" type="submit">دخول</button><small style="color:#6a5662">لحساب الأدمن بتاع السيستم فقط.</small></form></div>';
 document.getElementById('lf').addEventListener('submit',function(ev){
  ev.preventDefault();var f=ev.target,b=f.querySelector('button');b.disabled=true;b.textContent='جاري الدخول...';
  fetch(URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email:f.e.value.trim(),password:f.p.value})})
   .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error('bad');return j})})
   .then(function(j){S.tok=j.access_token;S.ref=j.refresh_token;S.uid=j.user.id;save();return start()})
   .catch(function(){loginView('البريد أو كلمة المرور غير صحيحة.')});
 });
}
function start(){
 return api('/rest/v1/profiles?id=eq.'+S.uid+'&select=role,name').then(function(r){
  if(!r||!r[0]||r[0].role!=='admin'){S.tok=null;save();loginView('الحساب ده مش أدمن.');return}
  return loadAll().then(render);
 }).catch(function(){S.tok=null;save();loginView('انتهت الجلسة، ادخلي تاني.')});
}
function loadAll(){
 return Promise.all([
  api('/rest/v1/store_products?select=*,store_variants(id,stock_id,color_label,swatch,active,sort,images,acc_id,stock(qty),accessories(qty))&order=sort.asc,id.asc'),
  api('/rest/v1/store_settings?select=key,value'),
  api('/rest/v1/store_coupons?select=*&order=code.asc'),
  api('/rest/v1/store_offers?select=*&order=sort.asc,id.asc').catch(function(){return []})
 ]).then(function(r){S.offers=r[3]||[];S.products=r[0]||[];S.settings={};(r[1]||[]).forEach(function(x){S.settings[x.key]=x.value});S.coupons=(r[2]||[]).filter(function(c){return c.source!=='wheel'})});
}
/* ---------- shell ---------- */
function render(){
 root.innerHTML=(EMB?'':'<div class="bar"><b>Catchy Lens — لوحة التحكم</b><span class="sp"></span><button id="out">خروج</button></div>')+'<div class="tabs" role="tablist">'
  +[['products','المنتجات'],['settings','الإعدادات'],['home','الرئيسية'],['wheel','العجلة'],['tryon','تجربة اللون'],['pages','الصفحات'],['offers','العروض'],['coupons','الكوبونات']].map(function(t){return '<button role="tab" data-tab="'+t[0]+'" aria-selected="'+(S.tab===t[0])+'">'+t[1]+'</button>'}).join('')+'</div><main id="m"></main>';
 var ob=document.getElementById('out');if(ob)ob.onclick=function(){S.tok=null;S.ref=null;save();loginView()};
 [].forEach.call(root.querySelectorAll('[data-tab]'),function(b){b.onclick=function(){S.tab=b.dataset.tab;render()}});
 ({products:productsView,settings:settingsView,pages:function(){pagesView()},home:homeView,wheel:wheelView,tryon:tryonView,offers:offersView,coupons:couponsView})[S.tab]();
}
/* ---------- products ---------- */
function stockOf(p){return (p.store_variants||[]).reduce(function(n,v){return n+(((v.stock||v.accessories)&&(v.stock||v.accessories).qty)||0)},0)}
function filtered(){
 return S.products.filter(function(p){
  if(S.q&&(p.name+' '+p.brand).indexOf(S.q)<0)return false;
  if(S.flt==='active')return p.active;if(S.flt==='inactive')return !p.active;if(S.flt==='noprice')return !(p.price>0);return true;
 });
}
function rows(){
 return filtered().map(function(p){
  var nv=(p.store_variants||[]).length,noimg=(p.store_variants||[]).filter(function(v){return !(v.images&&v.images.length)}).length;
  return '<tr data-id="'+p.id+'"><td><b>'+esc(p.name)+'</b><br><small>'+nv+' لون — مخزون '+stockOf(p)+'</small></td><td><select data-f="category">'+opts(CAT,p.category)+'</select></td><td><input data-f="price" type="number" min="0" step="1" value="'+(p.price||'')+'" aria-label="السعر"></td><td><input data-f="old_price" type="number" min="0" step="1" value="'+(p.old_price||'')+'" aria-label="السعر قبل الخصم"></td><td>'+(nv-noimg)+' / '+nv+' لون ليه صور</td><td><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-f="active"'+(p.active?' checked':'')+'><span class="tag '+(p.active?'on':'off')+'">'+(p.active?'ظاهر':'مخفي')+'</span></label></td><td><button class="btn sm alt" data-edit="'+p.id+'">تعديل</button> <button class="btn sm" data-save="'+p.id+'">حفظ</button></td></tr>';
 }).join('')||'<tr><td colspan="7" style="text-align:center;padding:24px">مفيش منتجات بالفلتر ده.</td></tr>';
}
function productsView(){
 var m=document.getElementById('m'),n=S.products.length,act=S.products.filter(function(p){return p.active}).length;
 m.innerHTML='<h2>المنتجات</h2><p style="margin:0 0 12px;color:#6a5662">'+n+' منتج، الظاهر منهم في الموقع: '+act+'. المنتج ما يظهرش غير لما يتحط له سعر وتفعّليه.</p><div class="tools"><input id="q" type="search" placeholder="ابحثي بالاسم أو الماركة" value="'+esc(S.q)+'"><select id="flt"><option value="all">الكل</option><option value="active">الظاهر</option><option value="inactive">المخفي</option><option value="noprice">من غير سعر</option></select></div><div class="tw"><table><thead><tr><th>المنتج</th><th>القسم</th><th>السعر (ج.م)</th><th>قبل الخصم</th><th>صور الألوان</th><th>الظهور</th><th></th></tr></thead><tbody id="tb">'+rows()+'</tbody></table></div>';
 document.getElementById('flt').value=S.flt;
 document.getElementById('q').oninput=function(e){S.q=e.target.value.trim();document.getElementById('tb').innerHTML=rows()};
 document.getElementById('flt').onchange=function(e){S.flt=e.target.value;document.getElementById('tb').innerHTML=rows()};
 document.getElementById('tb').onclick=function(e){
  var s=e.target.closest('[data-save]'),d=e.target.closest('[data-edit]');
  if(d)return editor(+d.dataset.edit);
  if(s){var tr=s.closest('tr'),p=S.products.filter(function(x){return x.id===+s.dataset.save})[0];quickSave(p,tr,s)}
 };
}
function quickSave(p,tr,btn){
 var g=function(f){return tr.querySelector('[data-f='+f+']')},price=+g('price').value||0,old=g('old_price').value===''?null:+g('old_price').value,act=g('active').checked;
 if(act&&!(price>0))return msg('لازم تحطي سعر أكبر من صفر قبل ما تظهري المنتج.',true);
 if(old!=null&&old<=price)old=null;
 btn.disabled=true;
 api('/rest/v1/store_products?id=eq.'+p.id,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{price:price,old_price:old,active:act,category:g('category').value}})
  .then(function(){p.price=price;p.old_price=old;p.active=act;p.category=g('category').value;msg('اتحفظ: '+p.name);productsView()})
  .catch(function(e){msg('ما اتحفظش: '+e.message,true)}).then(function(){btn.disabled=false});
}
function editor(id){
 var p=S.products.filter(function(x){return x.id===id})[0],imgs=(p.images||[]).slice(),vs=(p.store_variants||[]).slice().sort(function(a,b){return a.sort-b.sort||a.id-b.id});
 var orig={};vs.forEach(function(v){v.images=(v.images||[]).slice();orig[v.id]=JSON.stringify([v.color_label,v.swatch,v.active,v.images])});
 var ov=document.createElement('div');ov.className='ov';
 function paint(){
  ov.innerHTML='<div class="modal" role="dialog" aria-modal="true"><h2>'+esc(p.name)+'</h2><div class="grid">'
   +'<label>الاسم الظاهر<input id="e-name" value="'+esc(p.name)+'" maxlength="160"></label><label>الماركة<input id="e-brand" value="'+esc(p.brand)+'"></label>'
   +'<label>القسم<select id="e-cat">'+opts(CAT,p.category)+'</select></label><label>المدة<select id="e-dur">'+opts(DUR,p.duration)+'</select></label>'
   +'<label>نوع القوة<select id="e-pt">'+opts([['plano','بدون قوة فقط (Plano)'],['both','Plano وبقوة نظر']],p.power_type)+'</select></label>'
   +'<label>السعر<input id="e-price" type="number" min="0" value="'+(p.price||'')+'"></label><label>السعر قبل الخصم<input id="e-old" type="number" min="0" value="'+(p.old_price||'')+'"></label><label>سعر العدسة بقوة نظر (اتركيه فاضي لو نفس السعر)<input id="e-pp" type="number" min="0" value="'+(p.power_price==null?'':p.power_price)+'"></label>'
   +'<label>الترتيب (الأصغر الأول)<input id="e-sort" type="number" value="'+(p.sort||0)+'"></label></div>'
   +'<label style="margin-top:12px">الوصف<textarea id="e-desc" rows="4" maxlength="4000">'+esc(p.description)+'</textarea></label>'
   +'<label style="margin-top:12px">وسوم (مفصولة بفاصلة) — للاختبار واقتراح العدسة<input id="e-tags" value="'+esc((p.tags||[]).join(', '))+'"></label>'
   +'<h3>صور عامة للماركة (بتظهر بس للون اللي ملوش صور خاصة)</h3><div class="imgs">'+imgs.map(function(u,i){return '<figure><img src="'+esc(u)+'" alt="" loading="lazy">'+(i===0?'<span class="main">رئيسية</span>':'')+'<button data-rm="'+i+'" aria-label="حذف">×</button></figure>'}).join('')+'</div><div class="tools" style="margin-top:10px"><label class="btn alt sm" style="display:inline-grid;place-items:center">إضافة صور<input id="e-file" type="file" accept="image/*" multiple hidden></label><span id="up" style="color:#6a5662"></span></div>'
   +'<h3>الألوان (مربوطة بالمخزون)</h3><div class="tw"><table><thead><tr><th>اسم اللون</th><th>لون الفلتر</th><th>المخزون</th><th>ظاهر</th><th>صور اللون (الأولى رئيسية)</th></tr></thead><tbody>'+vs.map(function(v){return '<tr data-v="'+v.id+'"><td><input data-vf="color_label" value="'+esc(v.color_label)+'" style="max-width:none"></td><td><select data-vf="swatch">'+opts(SW,v.swatch)+'</select></td><td>'+(((v.stock||v.accessories||{}).qty!=null)?(v.stock||v.accessories).qty:'—')+'</td><td><input type="checkbox" data-vf="active"'+(v.active?' checked':'')+'></td><td><div class="imgs vi">'+v.images.map(function(u,i){return '<figure style="width:64px"><img style="width:64px;height:64px" src="'+esc(u)+'" alt="" loading="lazy"><button data-vrm="'+v.id+':'+i+'" aria-label="حذف">\u00d7</button></figure>'}).join('')+'</div><label class="btn alt sm" style="display:inline-grid;place-items:center;margin-top:6px">إضافة صور<input type="file" accept="image/*" multiple hidden data-vfile="'+v.id+'"></label></td></tr>'}).join('')+'</tbody></table></div>'
   +'<div class="tools" style="margin-top:16px"><button class="btn" id="e-save">حفظ</button><button class="btn alt" id="e-close">إغلاق</button></div></div>';
  ov.querySelector('#e-close').onclick=function(){ov.remove();productsView()};
  ov.querySelector('#e-save').onclick=doSave;
  ov.querySelector('#e-file').onchange=upload;
  [].forEach.call(ov.querySelectorAll('[data-vfile]'),function(i){i.onchange=function(ev){vupload(+i.dataset.vfile,ev)}});
  [].forEach.call(ov.querySelectorAll('[data-vrm]'),function(b){b.onclick=function(){var a=b.dataset.vrm.split(':'),v=vs.filter(function(x){return x.id===+a[0]})[0];readIn();var u=v.images.splice(+a[1],1)[0];paint();rmFile(u)}});
  [].forEach.call(ov.querySelectorAll('[data-rm]'),function(b){b.onclick=function(){var u=imgs.splice(+b.dataset.rm,1)[0];readIn();paint();rmFile(u)}});
 }
 function readVars(){[].forEach.call(ov.querySelectorAll('[data-v]'),function(tr){var v=vs.filter(function(x){return x.id===+tr.dataset.v})[0];v.color_label=tr.querySelector('[data-vf=color_label]').value;v.swatch=tr.querySelector('[data-vf=swatch]').value;v.active=tr.querySelector('[data-vf=active]').checked})}
 function rmFile(u){if(u&&u.indexOf('/public/'+BUCKET+'/')>0)api('/storage/v1/object/'+BUCKET+'/'+decodeURIComponent(u.split('/public/'+BUCKET+'/')[1]),{method:'DELETE'}).catch(function(){})}
 function readIn(){readVars();
  var g=function(i){var e=ov.querySelector(i);return e?e.value:null};
  if(g('#e-name')!=null){p.name=g('#e-name').trim();p.brand=g('#e-brand').trim();p.category=g('#e-cat');p.duration=g('#e-dur');p.power_type=g('#e-pt');p.price=+g('#e-price')||0;p.old_price=g('#e-old')===''?null:+g('#e-old');p.power_price=g('#e-pp')===''?null:+g('#e-pp');p.sort=+g('#e-sort')||0;p.description=g('#e-desc');p.tags=g('#e-tags').split(',').map(function(x){return x.trim()}).filter(Boolean)}
 }
 function resize(file){
  return createImageBitmap(file).then(function(bm){var r=Math.min(1,1200/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.round(bm.width*r);c.height=Math.round(bm.height*r);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return new Promise(function(ok){c.toBlob(ok,'image/webp',0.82)})});
 }
function vupload(id,ev){
  var files=[].slice.call(ev.target.files);if(!files.length)return;readIn();var v=vs.filter(function(x){return x.id===id})[0],n=0;
  files.reduce(function(pr,f){return pr.then(function(){return resize(f).then(function(b){var path='v'+id+'/'+Date.now()+'-'+(++n)+'.webp';return api('/storage/v1/object/'+BUCKET+'/'+path,{method:'POST',headers:{'Content-Type':'image/webp','x-upsert':'false'},body:b}).then(function(){v.images.push(URL+'/storage/v1/object/public/'+BUCKET+'/'+path)})})})},Promise.resolve())
   .then(function(){paint()}).catch(function(e){msg('فشل رفع الصورة: '+e.message,true)});
 }
 function upload(ev){
  var files=[].slice.call(ev.target.files);if(!files.length)return;readIn();var up=ov.querySelector('#up'),n=0;
  files.reduce(function(pr,f){return pr.then(function(){up.textContent='جاري رفع '+(++n)+' من '+files.length+'...';return resize(f).then(function(b){var path='p'+p.id+'/'+Date.now()+'-'+n+'.webp';return api('/storage/v1/object/'+BUCKET+'/'+path,{method:'POST',headers:{'Content-Type':'image/webp','x-upsert':'false'},body:b}).then(function(){imgs.push(URL+'/storage/v1/object/public/'+BUCKET+'/'+path)})})})},Promise.resolve())
   .then(function(){paint()}).catch(function(e){up.textContent='';msg('فشل رفع الصورة: '+e.message,true)});
 }
 function doSave(){
  readIn();
  if(p.active&&!(p.price>0))return msg('المنتج ظاهر ومن غير سعر. حطي سعر أو أخفيه.',true);
  if(p.old_price!=null&&p.old_price<=p.price)p.old_price=null;
  var b=ov.querySelector('#e-save');b.disabled=true;
  var vrows=[].slice.call(ov.querySelectorAll('[data-v]'));
  api('/rest/v1/store_products?id=eq.'+p.id,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{name:p.name,brand:p.brand,category:p.category,duration:p.duration,power_type:p.power_type,price:p.price,power_price:p.power_price,old_price:p.old_price,sort:p.sort,description:p.description,tags:p.tags,images:imgs}})
   .then(function(){p.images=imgs;return Promise.all(vrows.map(function(tr){
     var v=vs.filter(function(x){return x.id===+tr.dataset.v})[0],cl=(v.color_label||'').trim()||v.color_label;
     var sig=JSON.stringify([v.color_label,v.swatch,v.active,v.images]);if(sig===orig[v.id])return null;
     return api('/rest/v1/store_variants?id=eq.'+v.id,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{color_label:cl,swatch:v.swatch,active:v.active,images:v.images}}).then(function(){orig[v.id]=sig});
   }))}).then(function(){msg('اتحفظ');paint()}).catch(function(e){msg('ما اتحفظش: '+e.message,true)}).then(function(){b.disabled=false});
 }
 document.body.appendChild(ov);paint();
}

/* ---------- home ---------- */
var LINKS=[['catalog','كل المنتجات'],['offers','العروض'],['brands','الماركات'],['quiz','اعثري على عدستك'],['lenses','العدسات'],['care','محاليل'],['accessories','إكسسوارات']];
var HB=[['quiz','بانر الاختبار'],['offers','بانر العروض'],['arrivals','بانر وصل حديثًا']];
function himg(file){
 return createImageBitmap(file).then(function(bm){var r=Math.min(1,2400/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.round(bm.width*r);c.height=Math.round(bm.height*r);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return new Promise(function(ok){c.toBlob(ok,'image/webp',0.85)})})
  .then(function(b){var path='home/'+Date.now()+'-'+Math.random().toString(36).slice(2,6)+'.webp';return api('/storage/v1/object/'+BUCKET+'/'+path,{method:'POST',headers:{'Content-Type':'image/webp','x-upsert':'false'},body:b}).then(function(){return URL+'/storage/v1/object/public/'+BUCKET+'/'+path})});
}
function lsel(id,v){var has=LINKS.some(function(l){return l[0]===v});return '<select data-k="'+id+'">'+LINKS.map(function(l){return '<option value="'+l[0]+'"'+(l[0]===v?' selected':'')+'>'+esc(l[1])+'</option>'}).join('')+(v&&!has?'<option value="'+esc(v)+'" selected>'+esc(v)+'</option>':'')+'</select>'}
function ipick(k,v,label){return '<div class="hi"><span>'+esc(label)+'</span>'+(v?'<img src="'+esc(v)+'" alt="" style="height:54px;border-radius:8px;display:block;margin:4px 0">':'<small style="color:#8a7280">الصورة الحالية (الافتراضية)</small>')+'<input type="file" accept="image/*" data-up="'+k+'">'+(v?' <button type="button" class="btn sm alt" data-clr="'+k+'">شيلي</button>':'')+'</div>'}
function homeView(){
 var m=document.getElementById('m'),H=JSON.parse(JSON.stringify(S.settings.home||{}));
 H.slides=H.slides||[];H.show=H.show||{};H.film=H.film||{};H.moments=H.moments||[];
 HB.forEach(function(b){H[b[0]]=H[b[0]]||{}});
 function paint(){
  var h='<h2>الصفحة الرئيسية</h2><p class="hint" style="max-width:760px;color:#6a5662">لو سبتي السلايدر فاضي هيظهر الافتراضي. مقاسات مقترحة: صورة الكمبيوتر 2400×1000، صورة الموبايل 1080×1350، البانرات 1600×600.</p><div style="display:grid;gap:16px;max-width:820px">';
  h+='<div class="card"><h3>السلايدر (حد أقصى 5)</h3>'+H.slides.map(function(x,i){return '<fieldset style="border:1px solid #e6d9e0;border-radius:12px;padding:12px;margin:10px 0;display:grid;gap:8px"><legend>شريحة '+(i+1)+'</legend><label><input type="checkbox" data-sl="'+i+'.on"'+(x.on!==false?' checked':'')+'> ظاهرة</label>'+ipick('sl.'+i+'.desktop',x.desktop,'صورة الكمبيوتر')+ipick('sl.'+i+'.mobile',x.mobile,'صورة الموبايل (اختياري)')+'<label>العنوان (سطر جديد = سطر في الموقع)<textarea rows="2" data-sl="'+i+'.title">'+esc(x.title||'')+'</textarea></label><label>النص الصغير<input data-sl="'+i+'.sub" value="'+esc(x.sub||'')+'"></label><label>نص الزرار<input data-sl="'+i+'.cta" value="'+esc(x.cta||'')+'"></label><label>الزرار يودّي لـ'+lsel('sl.'+i+'.href',x.href||'catalog')+'</label><button type="button" class="btn sm alt" data-rm="'+i+'">حذف الشريحة</button></fieldset>'}).join('')+(H.slides.length<5?'<button type="button" class="btn alt" id="addsl">+ إضافة شريحة</button>':'')+'</div>';
  HB.forEach(function(b){var x=H[b[0]];h+='<div class="card" style="display:grid;gap:8px"><h3>'+b[1]+'</h3><label><input type="checkbox" data-bn="'+b[0]+'.on"'+(x.on!==false?' checked':'')+'> ظاهر</label><label>العنوان<input data-bn="'+b[0]+'.title" value="'+esc(x.title||'')+'" placeholder="سيبيه فاضي للافتراضي"></label><label>نص الزرار<input data-bn="'+b[0]+'.cta" value="'+esc(x.cta||'')+'"></label><label>الزرار يودّي لـ'+lsel('bn.'+b[0]+'.href',x.href||'')+'</label>'+ipick('bn.'+b[0]+'.desktop',x.desktop,'صورة الكمبيوتر')+ipick('bn.'+b[0]+'.mobile',x.mobile,'صورة الموبايل (اختياري)')+'</div>'});
  h+='<div class="card" style="display:grid;gap:8px"><h3>فيديو البراند</h3><label>رابط الفيديو (يوتيوب/تيك توك/إنستجرام) — فاضي = القسم مخفي<input dir="ltr" data-fm="url" value="'+esc(H.film.url||'')+'"></label>'+ipick('fm.cover',H.film.cover,'صورة الغلاف')+'</div>';
  h+='<div class="card" style="display:grid;gap:8px"><h3>Catchy Moments (حد أقصى 6)</h3>'+H.moments.map(function(x,i){return '<div style="border:1px solid #e6d9e0;border-radius:12px;padding:10px">'+ipick('mo.'+i+'.image',x.image,'صورة '+(i+1))+'<label>الرابط<input dir="ltr" data-mo="'+i+'.url" value="'+esc(x.url||'')+'"></label><button type="button" class="btn sm alt" data-rmm="'+i+'">حذف</button></div>'}).join('')+(H.moments.length<6?'<button type="button" class="btn alt" id="addmo">+ إضافة صورة</button>':'')+'<small style="color:#6a5662">القسم بيظهر بس لو في صورة ليها رابط.</small></div>';
  h+='<div class="card"><h3>إخفاء أقسام</h3><label><input type="checkbox" data-sh="colors"'+(H.show.colors!==false?' checked':'')+'> قسم "كل لون... حكاية"</label></div>';
  h+='<div style="display:flex;gap:10px"><button class="btn" id="hsave">حفظ الرئيسية</button><button class="btn alt" id="hreset">رجّعي الافتراضي</button></div></div>';
  m.innerHTML=h;
 }
 function ref(k){/* returns [obj,key] */var a=k.split('.');if(a[0]==='sl')return [H.slides[+a[1]],a[2]];if(a[0]==='bn')return [H[a[1]],a[2]];if(a[0]==='fm')return [H.film,a[1]];if(a[0]==='mo')return [H.moments[+a[1]],a[2]];}
 m.onchange=function(ev){
  var t=ev.target,r;
  if(t.dataset.up){var f=t.files[0];if(!f)return;t.disabled=true;himg(f).then(function(u){r=ref(t.dataset.up);r[0][r[1]]=u;paint()}).catch(function(e){msg('فشل رفع الصورة: '+e.message,true);t.disabled=false});return}
  if(t.dataset.k){r=ref(t.dataset.k);r[0][r[1]]=t.value;return}
  var d=t.dataset;
  if(d.sl){var a=d.sl.split('.');H.slides[+a[0]][a[1]]=t.type==='checkbox'?t.checked:t.value}
  else if(d.bn){var b=d.bn.split('.');H[b[0]][b[1]]=t.type==='checkbox'?t.checked:t.value}
  else if(d.fm)H.film[d.fm]=t.value.trim();
  else if(d.mo){var c=d.mo.split('.');H.moments[+c[0]][c[1]]=t.value.trim()}
  else if(d.sh)H.show[d.sh]=t.checked;
 };
 m.onclick=function(ev){
  var t=ev.target.closest('button');if(!t)return;
  if(t.id==='addsl'){H.slides.push({on:true,href:'catalog'});paint()}
  else if(t.id==='addmo'){H.moments.push({});paint()}
  else if(t.dataset.rm!=null){H.slides.splice(+t.dataset.rm,1);paint()}
  else if(t.dataset.rmm!=null){H.moments.splice(+t.dataset.rmm,1);paint()}
  else if(t.dataset.clr){var r=ref(t.dataset.clr);delete r[0][r[1]];paint()}
  else if(t.id==='hsave'){
   var bad=H.slides.some(function(x){return x.on!==false&&!x.desktop});if(bad)return msg('في شريحة ظاهرة من غير صورة.',true);
   t.disabled=true;api('/rest/v1/store_settings?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:[{key:'home',value:H,public:true}]}).then(function(){S.settings.home=JSON.parse(JSON.stringify(H));msg('اتحفظت الرئيسية')}).catch(function(e){msg('ما اتحفظش: '+e.message,true)}).then(function(){t.disabled=false});
  }
  else if(t.id==='hreset'){if(!confirm('ترجيع الرئيسية للافتراضي؟'))return;api('/rest/v1/store_settings?key=eq.home',{method:'DELETE',headers:{Prefer:'return=minimal'}}).then(function(){delete S.settings.home;msg('رجعت الافتراضية');homeView()}).catch(function(e){msg(e.message,true)})}
 };
 paint();
}
/* ---------- virtual try-on colours ---------- */
var TRY_DEF=[['Siri Green','أخضر'],['Siri Blue','أزرق'],['Siri Gray','رمادي'],['Siri Brown','بني'],['Siri Crown Brown','كراون بني'],['Siri Latte','لاتيه'],['Siri Hazy Gray','هيزي رمادي'],['Siri Crown Gray','كراون رمادي'],['Siri Rainbow Blue','رينبو أزرق'],['Siri Crown Green','كراون أخضر']];
function tryDefaults(){return TRY_DEF.map(function(d,i){return {name:d[1],en:d[0],img:'img/tryon/siri-'+(i<9?'0':'')+(i+1)+'.webp'}})}
function timg(file){
 return createImageBitmap(file).then(function(bm){var r=Math.min(1,512/Math.max(bm.width,bm.height)),c=document.createElement('canvas');c.width=Math.round(bm.width*r);c.height=Math.round(bm.height*r);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return new Promise(function(ok){c.toBlob(ok,'image/webp',0.92)})})
  .then(function(b){var path='tryon/'+Date.now()+'-'+Math.random().toString(36).slice(2,6)+'.webp';return api('/storage/v1/object/'+BUCKET+'/'+path,{method:'POST',headers:{'Content-Type':'image/webp','x-upsert':'false'},body:b}).then(function(){return URL+'/storage/v1/object/public/'+BUCKET+'/'+path})});
}
function tryonView(){
 var m=document.getElementById('m'),saved=S.settings.tryon&&S.settings.tryon.items&&S.settings.tryon.items.length,T=JSON.parse(JSON.stringify(saved?S.settings.tryon.items:tryDefaults())),vs=wvariants();
 function pv(u){return /^https?:/.test(u)?u:'assets/'+u}
 function paint(){
  var h='<h2>تجربة اللون</h2><p class="hint" style="max-width:780px;color:#6a5662">الألوان اللي بتظهر للزائرة في صفحة "جرّبي اللون". كل لون ليه صورة العدسة نفسها (البؤبؤ الملوّن، صورة مربعة بخلفية شفافة أو بيضاء، يفضل 256×256 أو أكتر). اربطي كل لون بمنتج عشان يظهر زرار "أضيفي للسلة". الألوان الافتراضية (Siri) بتتربط تلقائي بالاسم، ولو الاسم مختلف اربطيها بإيدك.'+(saved?'':' <b>دي الألوان الافتراضية. أول ما تحفظي هتبقى هي المعتمدة.</b>')+'</p>';
  h+='<div class="card" style="display:grid;gap:10px">'+T.map(function(it,i){
   var sel='<select data-t="'+i+'.variant"><option value="">'+(it.en?'تلقائي (بالاسم)':'بدون ربط')+'</option>'+vs.map(function(v){return '<option value="'+v[0]+'"'+(String(it.variant)===String(v[0])?' selected':'')+'>'+esc(v[1])+'</option>'}).join('')+'</select>';
   return '<div style="display:grid;grid-template-columns:64px 1fr;gap:10px;align-items:center;border:1px solid #e6d9e0;border-radius:12px;padding:10px"><img src="'+esc(it.img?pv(it.img):'')+'" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;background:#efe7ec">'
    +'<div style="display:grid;gap:6px"><label>الاسم<input data-t="'+i+'.name" value="'+esc(it.name||'')+'" maxlength="30"></label><label>الربط بمنتج'+sel+'</label><label>صورة العدسة<input type="file" accept="image/*" data-tup="'+i+'"></label><div><button type="button" class="btn sm alt" data-trm="'+i+'">حذف اللون</button></div></div></div>';
  }).join('')+'<div><button type="button" class="btn alt" id="tradd">+ إضافة لون</button></div></div>';
  h+='<div style="display:flex;gap:10px;margin-top:12px"><button class="btn" id="trsave">حفظ</button><button class="btn alt" id="trreset">رجّعي الافتراضي</button></div>';
  m.innerHTML=h;
 }
 m.onchange=function(ev){
  var t=ev.target;
  if(t.dataset.tup!=null){var f=t.files[0];if(!f)return;t.disabled=true;timg(f).then(function(u){T[+t.dataset.tup].img=u;paint()}).catch(function(e){msg('فشل رفع الصورة: '+e.message,true);t.disabled=false});return}
  if(t.dataset.t){var a=t.dataset.t.split('.');T[+a[0]][a[1]]=a[1]==='variant'?(t.value?+t.value:null):t.value.trim()}
 };
 m.onclick=function(ev){
  var t=ev.target.closest('button');if(!t)return;
  if(t.id==='tradd'){T.push({name:'',img:''});paint()}
  else if(t.dataset.trm!=null){T.splice(+t.dataset.trm,1);paint()}
  else if(t.id==='trsave'){
   if(!T.length)return msg('ضيفي لون واحد على الأقل، أو دوسي "رجّعي الافتراضي".',true);
   var bad=T.some(function(x){return !x.img||!x.name});if(bad)return msg('كل لون محتاج اسم وصورة.',true);
   var items=T.map(function(x){var o={name:x.name,img:x.img};if(x.en)o.en=x.en;if(x.variant)o.variant=x.variant;return o});
   t.disabled=true;api('/rest/v1/store_settings?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:[{key:'tryon',value:{items:items},public:true}]}).then(function(){S.settings.tryon={items:items};msg('اتحفظت ألوان التجربة')}).catch(function(e){msg('ما اتحفظش: '+e.message,true)}).then(function(){t.disabled=false});
  }
  else if(t.id==='trreset'){if(!confirm('ترجيع ألوان التجربة للافتراضي (Siri)؟'))return;api('/rest/v1/store_settings?key=eq.tryon',{method:'DELETE',headers:{Prefer:'return=minimal'}}).then(function(){delete S.settings.tryon;msg('رجعت الافتراضية');tryonView()}).catch(function(e){msg(e.message,true)})}
 };
 paint();
}
/* ---------- wheel ---------- */
var WT=[['percent','خصم نسبة %'],['amount','خصم مبلغ (ج.م)'],['shipping','شحن مجاني'],['gift','هدية من المخزون'],['none','حظ أوفر (مفيش جايزة)']];
function wvariants(){var o=[];(S.products||[]).forEach(function(p){(p.store_variants||[]).forEach(function(v){o.push([v.id,p.name+' — '+(v.color_label||'')])})});return o}
function wheelView(){
 var m=document.getElementById('m'),W=JSON.parse(JSON.stringify(S.settings.wheel||{on:false,title:'',delay:6,prizes:[
  {label:'خصم 10%',type:'percent',value:10,days:14,weight:20},{label:'شحن مجاني',type:'shipping',days:14,weight:25},{label:'حظ أوفر',type:'none',weight:35},{label:'خصم 50 جنيه',type:'amount',value:50,days:14,weight:20}]}));
 W.prizes=W.prizes||[];
 function paint(sp){
  var tot=W.prizes.reduce(function(a,p){return a+(+p.weight||0)},0),vs=wvariants();
  var h='<h2>عجلة الجوايز</h2><p class="hint" style="max-width:780px;color:#6a5662">العجلة بتظهر للزائرة مرة واحدة كل رقم موبايل. السيرفر هو اللي بيختار الجايزة حسب "الوزن"، والكوبون بيتولّد مربوط برقمها ولاستخدام واحد. الهدايا بتخرج من المخزون، ولو الهدية خلصت بتتشال من العجلة تلقائي.</p><div class="card" style="display:grid;gap:12px;max-width:900px">'
  +'<label><input type="checkbox" id="w-on"'+(W.on?' checked':'')+'> تشغيل العجلة في الموقع</label>'
  +'<label>عنوان النافذة<input id="w-title" maxlength="60" value="'+esc(W.title||'')+'" placeholder="لفّي العجلة واكسبي جايزة"></label>'
  +'<label>تظهر بعد كام ثانية<input id="w-delay" type="number" min="2" max="60" value="'+esc(W.delay||6)+'" style="max-width:120px"></label>'
  +'<div class="tw"><table><thead><tr><th>الاسم على العجلة</th><th>النوع</th><th>القيمة</th><th>أقل إجمالي</th><th>صلاحية (يوم)</th><th>الوزن</th><th>الاحتمال</th><th></th></tr></thead><tbody>'
  +W.prizes.map(function(p,i){
    var isv=p.type==='percent'||p.type==='amount',g=p.type==='gift';
    return '<tr><td><input data-pz="'+i+'.label" value="'+esc(p.label||'')+'" maxlength="30"></td><td><select data-pz="'+i+'.type">'+opts(WT,p.type)+'</select></td>'
     +'<td>'+(isv?'<input data-pz="'+i+'.value" type="number" min="1" value="'+esc(p.value||'')+'" style="width:80px">':g?'<select data-pz="'+i+'.gift_variant_id"><option value="">اختاري الهدية</option>'+vs.map(function(v){return '<option value="'+v[0]+'"'+(+p.gift_variant_id===v[0]?' selected':'')+'>'+esc(v[1])+'</option>'}).join('')+'</select>':'—')+'</td>'
     +'<td>'+(p.type==='none'?'—':'<input data-pz="'+i+'.min_total" type="number" min="0" value="'+esc(p.min_total||0)+'" style="width:80px">')+'</td>'
     +'<td>'+(p.type==='none'?'—':'<input data-pz="'+i+'.days" type="number" min="1" value="'+esc(p.days||14)+'" style="width:70px">')+'</td>'
     +'<td><input data-pz="'+i+'.weight" type="number" min="0" value="'+esc(p.weight==null?10:p.weight)+'" style="width:70px"></td><td><b>'+(tot?Math.round((+p.weight||0)/tot*100):0)+'%</b></td>'
     +'<td><button type="button" class="btn sm alt" data-prm="'+i+'">حذف</button></td></tr>'}).join('')
  +'</tbody></table></div>'
  +(W.prizes.length<10?'<button type="button" class="btn alt" id="w-add" style="justify-self:start">+ إضافة جايزة</button>':'')
  +'<div style="display:flex;gap:10px"><button class="btn" id="w-save">حفظ العجلة</button></div></div>'
  +'<h3 style="margin-top:24px">اللي لعبوا ('+(sp?sp.length:'...')+')</h3><div id="w-spins">'+(sp?spinsTable(sp):'جاري التحميل...')+'</div>';
  m.innerHTML=h;
 }
 function spinsTable(sp){
  if(!sp.length)return '<p class="muted">لسه محدش لعب.</p>';
  return '<p><button class="btn sm alt" id="w-csv">تنزيل الأرقام (CSV)</button></p><div class="tw"><table><thead><tr><th>الرقم</th><th>الجايزة</th><th>الكوبون</th><th>اتستخدم؟</th><th>التاريخ</th></tr></thead><tbody>'
   +sp.map(function(r){return '<tr><td dir="ltr">'+esc(r.phone)+'</td><td>'+esc(r.prize_label)+'</td><td dir="ltr">'+esc(r.coupon||'—')+'</td><td>'+(r.coupon?(S.wc&&S.wc[r.coupon]?'<span class="tag on">اتستخدم</span>':'<span class="tag off">لسه</span>'):'—')+'</td><td>'+esc((r.created_at||'').slice(0,10))+'</td></tr>'}).join('')+'</tbody></table></div>';
 }
 m.onchange=function(ev){
  var t=ev.target;
  if(t.id==='w-on')W.on=t.checked;else if(t.id==='w-title')W.title=t.value.trim();else if(t.id==='w-delay')W.delay=+t.value||6;
  else if(t.dataset.pz){var a=t.dataset.pz.split('.'),p=W.prizes[+a[0]];p[a[1]]=(a[1]==='label'||a[1]==='type')?t.value:(t.value===''?'':+t.value);if(a[1]==='type'||a[1]==='weight')paint(S._sp)}
 };
 m.onclick=function(ev){
  var t=ev.target.closest('button');if(!t)return;
  if(t.id==='w-add'){W.prizes.push({label:'',type:'percent',value:10,days:14,weight:10});paint(S._sp)}
  else if(t.dataset.prm!=null){if(W.prizes.length<=2)return msg('لازم جايزتين على الأقل.',true);W.prizes.splice(+t.dataset.prm,1);paint(S._sp)}
  else if(t.id==='w-csv'){var rows=['phone,prize,coupon,date'].concat((S._sp||[]).map(function(r){return [r.phone,'"'+(r.prize_label||'')+'"',r.coupon||'',(r.created_at||'').slice(0,10)].join(',')}));var a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+rows.join('\n')],{type:'text/csv;charset=utf-8'}));a.download='wheel-spins.csv';a.click()}
  else if(t.id==='w-save'){
   var bad=W.prizes.some(function(p){return !String(p.label||'').trim()||(p.type==='gift'&&!p.gift_variant_id)||((p.type==='percent'||p.type==='amount')&&!(p.value>0))||(p.type==='percent'&&p.value>100)});
   if(bad)return msg('كمّلي الاسم والقيمة والهدية لكل جايزة (والنسبة لازم تكون 100 أو أقل).',true);
   if(!W.prizes.some(function(p){return (+p.weight||0)>0}))return msg('لازم جايزة واحدة على الأقل وزنها أكبر من صفر.',true);
   W.prizes.forEach(function(p){p.label=String(p.label).trim()});
   t.disabled=true;api('/rest/v1/store_settings?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:[{key:'wheel',value:W,public:true}]}).then(function(){S.settings.wheel=JSON.parse(JSON.stringify(W));msg('اتحفظت العجلة')}).catch(function(e){msg('ما اتحفظش: '+e.message,true)}).then(function(){t.disabled=false});
  }
 };
 paint(S._sp);
 Promise.all([api('/rest/v1/wheel_spins?select=*&order=created_at.desc&limit=500').catch(function(){return []}),api('/rest/v1/store_coupons?select=code,used&source=eq.wheel&limit=1000').catch(function(){return []})]).then(function(r){
  S._sp=r[0]||[];S.wc={};(r[1]||[]).forEach(function(c){if(c.used>0)S.wc[c.code]=1});
  if(document.getElementById('w-spins')){var h=document.querySelector('#m h3');if(h)h.textContent='اللي لعبوا ('+S._sp.length+')';document.getElementById('w-spins').innerHTML=spinsTable(S._sp)}
 });
}
/* ---------- pages ---------- */
var PG=[['about','من نحن'],['shipping','الشحن والتوصيل'],['returns','الاستبدال والاسترجاع'],['faq','الأسئلة الشائعة'],['privacy','سياسة الخصوصية'],['terms','الشروط والأحكام'],['contact','تواصلي معانا']];
function pagesView(sel){
 var m=document.getElementById('m'),k=sel||PG[0][0],D=(CL.pageDefaults||{})[k]||{title:'',body:''},sv=S.settings['page_'+k],cur=sv&&typeof sv==='object'?sv:null;
 m.innerHTML='<h2>الصفحات</h2><form class="card" id="pf" style="display:grid;gap:14px;max-width:760px"><label>الصفحة<select id="pk">'+PG.map(function(x){return '<option value="'+x[0]+'"'+(x[0]===k?' selected':'')+'>'+esc(x[1])+'</option>'}).join('')+'</select></label>'
  +'<label>العنوان<input id="pt" maxlength="120" value="'+esc(cur?cur.title:D.title)+'"></label>'
  +'<label>المحتوى<textarea id="pb" rows="20" style="width:100%;font:inherit;line-height:1.7">'+esc(cur&&cur.body!=null?cur.body:D.body)+'</textarea></label>'
  +'<p class="hint" style="margin:0;font-size:14px;color:#6a5662">الكتابة: سطر يبدأ بـ <b dir="ltr"># </b> يبقى عنوان فرعي (وفي الأسئلة الشائعة يبقى سؤال)، وسطر يبدأ بـ <b dir="ltr">- </b> يبقى نقطة، وسطر فاضي يفصل الفقرات. تقدري تستخدمي دي وهتتبدل تلقائي من الإعدادات: <span dir="ltr">{{whatsapp}} {{hours}} {{returnWindow}} {{shipCairo}} {{shipDelta}} {{shipUpper}} {{freeShipLine}}</span></p>'
  +'<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" type="submit">حفظ الصفحة</button><button class="btn alt" type="button" id="pr">رجّعي النص الافتراضي</button></div></form>';
 document.getElementById('pk').onchange=function(ev){pagesView(ev.target.value)};
 document.getElementById('pr').onclick=function(){if(!confirm('ترجيع النص الافتراضي لصفحة "'+(PG.filter(function(x){return x[0]===k})[0]||[])[1]+'"؟ هيتمسح تعديلك.'))return;
  api('/rest/v1/store_settings?key=eq.page_'+k,{method:'DELETE',headers:{Prefer:'return=minimal'}}).then(function(){delete S.settings['page_'+k];msg('رجع الافتراضي');pagesView(k)}).catch(function(e){msg('ما اتنفذش: '+e.message,true)})};
 document.getElementById('pf').onsubmit=function(ev){
  ev.preventDefault();var btn=ev.target.querySelector('button[type=submit]'),val={title:document.getElementById('pt').value.trim()||D.title,body:document.getElementById('pb').value};
  btn.disabled=true;
  api('/rest/v1/store_settings?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:[{key:'page_'+k,value:val,public:true}]}).then(function(){S.settings['page_'+k]=val;msg('اتحفظت الصفحة')}).catch(function(e){msg('ما اتحفظش: '+e.message,true)}).then(function(){btn.disabled=false});
 };
}
/* ---------- settings ---------- */
var SET=[['announcement','نص الشريط العلوي','text'],['free_ship_min','الحد الأدنى للشحن المجاني (ج.م) — 0 معناه مفيش شحن مجاني','number'],['prep_time','مدة التجهيز (تظهر للعميلة)','text'],['whatsapp','رقم واتساب (اكتبيه 01xxxxxxxxx والموقع بيظبطه)','text'],['hours','مواعيد الرد على الواتساب','text'],['return_window','مدة طلب الاستبدال/الاسترجاع بعد الاستلام','text'],['ship_cairo','مدة التوصيل: القاهرة والجيزة','text'],['ship_delta','مدة التوصيل: الوجه البحري','text'],['ship_upper','مدة التوصيل: الوجه القبلي','text'],['facebook','رابط فيسبوك','text'],['instagram','رابط إنستجرام','text'],['tiktok','رابط تيك توك','text']];
function settingsView(){
 var m=document.getElementById('m');
 m.innerHTML='<h2>الإعدادات</h2><form class="card" id="sf" style="display:grid;gap:14px;max-width:560px">'+SET.map(function(s){var v=S.settings[s[0]];return '<label>'+esc(s[1])+'<input name="'+s[0]+'" type="'+s[2]+'" '+(s[2]==='number'?'min="0" ':'')+'value="'+esc(v==null?'':v)+'"></label>'}).join('')+'<button class="btn" type="submit">حفظ الإعدادات</button></form>';
 document.getElementById('sf').onsubmit=function(ev){
  ev.preventDefault();var f=ev.target,btn=f.querySelector('button'),body=SET.map(function(s){var v=f.elements[s[0]].value.trim();if(s[0]==='whatsapp'){v=v.replace(/\D/g,'');if(v.charAt(0)==='0')v='2'+v}return {key:s[0],value:s[2]==='number'?(+v||0):v,public:true}});
  btn.disabled=true;
  api('/rest/v1/store_settings?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:body}).then(function(){body.forEach(function(x){S.settings[x.key]=x.value});msg('اتحفظت الإعدادات')}).catch(function(e){msg('ما اتحفظش: '+e.message,true)}).then(function(){btn.disabled=false});
 };
}
/* ---------- coupons ---------- */
function couponsView(){
 var m=document.getElementById('m');
 m.innerHTML='<h2>الكوبونات</h2><form class="card grid" id="cf"><label>الكود<input name="code" required dir="ltr" style="text-transform:uppercase" maxlength="30"></label><label>النوع<select name="kind"><option value="percent">نسبة %</option><option value="fixed">مبلغ ثابت</option></select></label><label>القيمة<input name="value" type="number" min="1" required></label><label>أقل إجمالي للطلب<input name="min_total" type="number" min="0" value="0"></label><label>أقصى عدد استخدامات (فاضي = مفتوح)<input name="max_uses" type="number" min="1"></label><label>ينتهي في (اختياري)<input name="expires_at" type="date"></label><div style="display:flex;align-items:end"><button class="btn" type="submit">إضافة كوبون</button></div></form>'
  +'<div class="tw"><table><thead><tr><th>الكود</th><th>الخصم</th><th>أقل إجمالي</th><th>الاستخدام</th><th>ينتهي</th><th>الحالة</th><th></th></tr></thead><tbody>'+(S.coupons.map(function(c){return '<tr><td dir="ltr"><b>'+esc(c.code)+'</b></td><td>'+(c.kind==='percent'?esc(c.value)+'%':c.kind==='shipping'?'شحن مجاني':c.kind==='gift'?'هدية':esc(c.value)+' ج.م')+'</td><td>'+esc(c.min_total)+'</td><td>'+esc(c.used)+(c.max_uses?' / '+esc(c.max_uses):'')+'</td><td>'+(c.expires_at?esc(c.expires_at.slice(0,10)):'—')+'</td><td><span class="tag '+(c.active?'on':'off')+'">'+(c.active?'شغال':'موقوف')+'</span></td><td><button class="btn sm alt" data-tg="'+esc(c.code)+'">'+(c.active?'إيقاف':'تشغيل')+'</button> <button class="btn sm alt" data-dl="'+esc(c.code)+'">حذف</button></td></tr>'}).join('')||'<tr><td colspan="7" style="text-align:center;padding:20px">مفيش كوبونات.</td></tr>')+'</tbody></table></div>';
 document.getElementById('cf').onsubmit=function(ev){
  ev.preventDefault();var f=ev.target,b={code:f.code.value.trim().toUpperCase(),kind:f.kind.value,value:+f.value.value,min_total:+f.min_total.value||0,max_uses:f.max_uses.value?+f.max_uses.value:null,expires_at:f.expires_at.value?f.expires_at.value+'T23:59:59+02:00':null,active:true};
  if(b.kind==='percent'&&b.value>100)return msg('النسبة لازم تكون 100 أو أقل.',true);
  api('/rest/v1/store_coupons',{method:'POST',headers:{Prefer:'return=representation'},body:b}).then(function(r){S.coupons.push(r[0]);S.coupons.sort(function(a,b){return a.code<b.code?-1:1});msg('اتضاف الكوبون');couponsView()}).catch(function(e){msg('ما اتضافش: '+e.message,true)});
 };
 m.onclick=function(e){
  var t=e.target.closest('[data-tg]'),d=e.target.closest('[data-dl]');
  if(t){var c=S.coupons.filter(function(x){return x.code===t.dataset.tg})[0];api('/rest/v1/store_coupons?code=eq.'+encodeURIComponent(c.code),{method:'PATCH',headers:{Prefer:'return=minimal'},body:{active:!c.active}}).then(function(){c.active=!c.active;couponsView()}).catch(function(e){msg(e.message,true)})}
  if(d&&confirm('تحذفي الكوبون '+d.dataset.dl+'؟'))api('/rest/v1/store_coupons?code=eq.'+encodeURIComponent(d.dataset.dl),{method:'DELETE',headers:{Prefer:'return=minimal'}}).then(function(){S.coupons=S.coupons.filter(function(x){return x.code!==d.dataset.dl});couponsView()}).catch(function(e){msg(e.message,true)});
 };
}

/* ---------- offers ---------- */
var RW=[['shipping','شحن مجاني'],['gift','هدية من المخزون (محلول / ماجيك بوكس / إكسسوار / عدسة محددة)'],['gift_lens','عدسة هدية (العميلة تختار اللون من ماركات تحددينها)'],['percent','خصم بنسبة %'],['amount','خصم بمبلغ ثابت (ج.م)'],['fixed_price','سعر ثابت لعدد العدسات (ج.م)']];
function pname(id){var p=S.products.filter(function(x){return x.id===id})[0];return p?p.name:'#'+id}
function rwText(o){
 var v={shipping:'شحن مجاني',percent:'خصم '+o.value+'%',amount:'خصم '+o.value+' ج.م',fixed_price:'السعر '+o.value+' ج.م'}[o.reward];
 if(o.reward==='gift'){var g=null;S.products.forEach(function(p){(p.store_variants||[]).forEach(function(x){if(x.id===o.gift_variant_id)g=p.name+' '+x.color_label})});v='هدية: '+(g||'؟')}
 if(o.reward==='gift_lens')v='عدسة هدية من: '+(o.gift_product_ids||[]).map(pname).join('، ');
 return v;
}
function cond(o){var l=[];if(o.min_qty>0)l.push('عدد العدسات '+o.min_qty);if(o.min_total>0)l.push('إجمالي '+o.min_total+' ج.م');l.push((o.product_ids||[]).length?'على: '+o.product_ids.map(pname).join('، '):'على كل المنتجات');return l.join(' — ')}
function offersView(){
 var m=document.getElementById('m');
 m.innerHTML='<h2>العروض</h2><p class="hint" style="font-size:14px;color:#6a5662">عرض واحد بس بيتطبق على الطلب: الأقل في "الأولوية" (1 أول) هو اللي بيتجرّب الأول. الكوبون بيتجمّع مع العرض. العرض اللي هديته خلصت من المخزون بيقف لوحده.</p><button class="btn" id="newo">+ عرض جديد</button>'
  +'<div class="tw"><table><thead><tr><th>الأولوية</th><th>العرض</th><th>الشرط</th><th>المكافأة</th><th>المدة</th><th>الحالة</th><th></th></tr></thead><tbody>'+(S.offers.map(function(o){
   return '<tr data-o="'+o.id+'"><td>'+o.sort+'</td><td><b>'+esc(o.name)+'</b></td><td>'+esc(cond(o))+'</td><td>'+esc(rwText(o))+'</td><td>'+(o.starts_at?o.starts_at.slice(0,10):'—')+' → '+(o.ends_at?o.ends_at.slice(0,10):'—')+'</td><td><label><input type="checkbox" data-otg="'+o.id+'"'+(o.active?' checked':'')+'> شغّال</label></td><td><button class="btn alt sm" data-oed="'+o.id+'">تعديل</button> <button class="btn alt sm" data-odl="'+o.id+'">حذف</button></td></tr>'}).join('')||'<tr><td colspan="7" style="text-align:center;padding:24px">لسه مفيش عروض. اضغطي "عرض جديد".</td></tr>')+'</tbody></table></div>';
 document.getElementById('newo').onclick=function(){offerEditor(null)};
 m.onclick=function(e){
  var t=e.target.closest('[data-otg]'),ed=e.target.closest('[data-oed]'),d=e.target.closest('[data-odl]');
  if(t){var o=S.offers.filter(function(x){return x.id===+t.dataset.otg})[0];api('/rest/v1/store_offers?id=eq.'+o.id,{method:'PATCH',headers:{Prefer:'return=minimal'},body:{active:t.checked}}).then(function(){o.active=t.checked;msg(o.active?'العرض اشتغل':'العرض اتوقف')}).catch(function(er){t.checked=!t.checked;msg('ما اتحفظش: '+er.message,true)})}
  if(ed)offerEditor(+ed.dataset.oed);
  if(d&&confirm('تحذفي العرض ده؟'))api('/rest/v1/store_offers?id=eq.'+d.dataset.odl,{method:'DELETE',headers:{Prefer:'return=minimal'}}).then(function(){S.offers=S.offers.filter(function(x){return x.id!==+d.dataset.odl});msg('اتحذف');offersView()}).catch(function(er){msg('ما اتحذفش: '+er.message,true)});
 };
}
function offerEditor(id){
 var o=id?S.offers.filter(function(x){return x.id===id})[0]:{name:'',description:'',active:false,sort:10,product_ids:[],min_qty:1,min_total:0,reward:'shipping',value:0,gift_variant_id:null,gift_product_ids:[],starts_at:null,ends_at:null};
 var ov=document.createElement('div');ov.className='ov';
 var lens=S.products.filter(function(p){return p.category==='lenses'}),allv=[];
 S.products.forEach(function(p){(p.store_variants||[]).forEach(function(v){allv.push([v.id,p.name+' — '+v.color_label+' ('+({lenses:'عدسات',care:'محاليل',accessories:'إكسسوارات'}[p.category]||'')+')'])})});
 function chk(name,list,sel){return '<div class="chk" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px;max-height:180px;overflow:auto;border:1px solid #e3d4df;border-radius:10px;padding:8px">'+list.map(function(p){return '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" name="'+name+'" value="'+p.id+'"'+((sel||[]).indexOf(p.id)>-1?' checked':'')+'> '+esc(p.name)+'</label>'}).join('')+'</div>'}
 ov.innerHTML='<div class="modal" role="dialog" aria-modal="true"><h2>'+(id?'تعديل عرض':'عرض جديد')+'</h2><form id="of" class="grid">'
  +'<label>اسم العرض (بيظهر للعميلة)<input name="name" maxlength="120" required value="'+esc(o.name)+'"></label>'
  +'<label>وصف قصير (اختياري)<input name="description" maxlength="500" value="'+esc(o.description)+'"></label>'
  +'<label>الأولوية (1 أول)<input name="sort" type="number" value="'+o.sort+'"></label>'
  +'<label>من تاريخ (اختياري)<input name="starts_at" type="date" value="'+(o.starts_at?o.starts_at.slice(0,10):'')+'"></label><label>لحد تاريخ (اختياري)<input name="ends_at" type="date" value="'+(o.ends_at?o.ends_at.slice(0,10):'')+'"></label>'
  +'<h3 style="grid-column:1/-1">الشرط</h3><label>عدد العدسات (0 لو الشرط مبلغ بس)<input name="min_qty" type="number" min="0" value="'+o.min_qty+'"></label><label>أقل إجمالي بالجنيه (0 = بدون)<input name="min_total" type="number" min="0" value="'+o.min_total+'"></label>'
  +'<div style="grid-column:1/-1"><b>المنتجات اللي جوا العرض</b> <small>(لو ما اخترتيش حاجة = كل المنتجات)</small>'+chk('pids',S.products,o.product_ids)+'</div>'
  +'<h3 style="grid-column:1/-1">المكافأة</h3><label style="grid-column:1/-1">النوع<select name="reward">'+RW.map(function(x){return '<option value="'+x[0]+'"'+(x[0]===o.reward?' selected':'')+'>'+esc(x[1])+'</option>'}).join('')+'</select></label>'
  +'<label data-w="percent amount fixed_price">القيمة<input name="value" type="number" min="0" step="1" value="'+(o.value||'')+'"></label>'
  +'<label data-w="gift" style="grid-column:1/-1">المنتج الهدية (من المخزون)<select name="gift_variant_id"><option value="">اختاري</option>'+allv.map(function(x){return '<option value="'+x[0]+'"'+(x[0]===o.gift_variant_id?' selected':'')+'>'+esc(x[1])+'</option>'}).join('')+'</select></label>'
  +'<div data-w="gift_lens" style="grid-column:1/-1"><b>الماركات المسموحة كعدسة هدية</b>'+chk('gpids',lens,o.gift_product_ids)+'</div>'
  +'<label style="display:flex;gap:8px;align-items:center;grid-column:1/-1"><input type="checkbox" name="active"'+(o.active?' checked':'')+'> شغّال</label>'
  +'<div style="grid-column:1/-1;display:flex;gap:10px"><button class="btn" type="submit">حفظ</button><button class="btn alt" type="button" id="oc">إلغاء</button></div></form></div>';
 document.body.appendChild(ov);
 var f=ov.querySelector('#of');
 function sync(){var r=f.reward.value;[].forEach.call(ov.querySelectorAll('[data-w]'),function(el){el.hidden=el.dataset.w.split(' ').indexOf(r)<0})}
 f.reward.onchange=sync;sync();
 ov.querySelector('#oc').onclick=function(){ov.remove()};
 f.onsubmit=function(ev){
  ev.preventDefault();var ids=function(n){return [].slice.call(f.querySelectorAll('[name='+n+']:checked')).map(function(x){return +x.value})};
  var b={name:f.name.value.trim(),description:f.description.value.trim(),sort:+f.sort.value||0,active:f.active.checked,starts_at:f.starts_at.value?f.starts_at.value+'T00:00:00+02:00':null,ends_at:f.ends_at.value?f.ends_at.value+'T23:59:59+02:00':null,
   min_qty:+f.min_qty.value||0,min_total:+f.min_total.value||0,product_ids:ids('pids'),reward:f.reward.value,value:+f.value.value||0,gift_variant_id:f.gift_variant_id.value?+f.gift_variant_id.value:null,gift_product_ids:ids('gpids')};
  if(b.reward==='gift'&&!b.gift_variant_id)return msg('اختاري المنتج الهدية.',true);
  if(b.reward==='gift_lens'&&!b.gift_product_ids.length)return msg('اختاري ماركة واحدة على الأقل للعدسة الهدية.',true);
  if(['percent','amount','fixed_price'].indexOf(b.reward)>-1&&!(b.value>0))return msg('اكتبي قيمة الخصم أو السعر.',true);
  if(b.reward==='percent'&&b.value>100)return msg('النسبة لازم تكون 100 أو أقل.',true);
  if(b.min_qty===0&&b.min_total===0&&b.reward!=='shipping'&&!b.product_ids.length&&!confirm('العرض ده من غير شرط وعلى كل المنتجات. متأكدة؟'))return;
  if(b.reward!=='gift')b.gift_variant_id=null;if(b.reward!=='gift_lens')b.gift_product_ids=[];if(['percent','amount','fixed_price'].indexOf(b.reward)<0)b.value=0;
  var btn=f.querySelector('[type=submit]');btn.disabled=true;
  var rq=id?api('/rest/v1/store_offers?id=eq.'+id,{method:'PATCH',headers:{Prefer:'return=representation'},body:b}):api('/rest/v1/store_offers',{method:'POST',headers:{Prefer:'return=representation'},body:b});
  rq.then(function(r){if(id)S.offers=S.offers.map(function(x){return x.id===id?r[0]:x});else S.offers.push(r[0]);S.offers.sort(function(a,b){return a.sort-b.sort||a.id-b.id});ov.remove();msg('اتحفظ العرض');offersView()}).catch(function(er){msg('ما اتحفظش: '+er.message,true)}).then(function(){btn.disabled=false});
 };
}
/* ---------- boot ---------- */
if(EMB)ptok().then(start).catch(function(){root.innerHTML='<p style="padding:20px">سجّلي دخول في سيستم الاوردرات الأول.</p>'});
else{load();if(S.tok&&S.uid)start();else loginView()}
})();
