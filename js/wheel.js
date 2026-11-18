(function(){
var CL=window.CL,e=CL.esc;
var COL=['#f4e7f0','#e8cfdf','#dbb3cd','#cf9bbd'];
function ls(k,v){try{if(v===undefined){return JSON.parse(localStorage.getItem(k)||'null')}if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v))}catch(x){return null}}
function rpc(phone){
 var c=CL.config;
 return fetch(c.supabaseUrl+'/rest/v1/rpc/store_spin',{method:'POST',headers:{'Content-Type':'application/json',apikey:c.anonKey,Authorization:'Bearer '+c.anonKey},body:JSON.stringify({p_phone:phone})})
  .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j&&j.message)||'x');return j})});
}
var MSG={bad_phone:'رقم الموبايل غير صحيح، لازم يبدأ بـ 01 ويكون 11 رقم.',too_many:'في ضغط دلوقتي، جرّبي بعد دقيقة.',wheel_off:'العجلة مش شغالة حاليًا.'};
function draw(cv,P){
 var s=300,dpr=Math.min(2,window.devicePixelRatio||1);cv.width=s*dpr;cv.height=s*dpr;var x=cv.getContext('2d');x.scale(dpr,dpr);
 var n=P.length,a=2*Math.PI/n,r=s/2-4;
 x.clearRect(0,0,s,s);
 P.forEach(function(p,i){
  var a0=-Math.PI/2+i*a,a1=a0+a;
  x.beginPath();x.moveTo(s/2,s/2);x.arc(s/2,s/2,r,a0,a1);x.closePath();x.fillStyle=COL[i%COL.length];x.fill();x.strokeStyle='#fff';x.lineWidth=2;x.stroke();
  x.save();x.translate(s/2,s/2);x.rotate(a0+a/2);x.textAlign='right';x.fillStyle='#381a30';x.font='bold 14px Brand,Arial,sans-serif';
  var t=String(p.label||'');if(t.length>16)t=t.slice(0,15)+'…';x.fillText(t,r-14,5);x.restore();
 });
 x.beginPath();x.arc(s/2,s/2,22,0,2*Math.PI);x.fillStyle='#381a30';x.fill();x.strokeStyle='#fff';x.lineWidth=3;x.stroke();
}
function fmt(d){try{return new Date(d).toLocaleDateString('ar-EG',{day:'numeric',month:'long'})}catch(x){return ''}}
CL.wheel={
 start:function(W){
  var P=(W.prizes||[]).filter(function(p){return p&&p.label});
  if(P.length<2)return;
  var done=ls('cl-wheel'),skip=ls('cl-wheel-skip');
  if(done&&done.done)return;
  if(skip&&Date.now()-skip<864e5)return;
  setTimeout(function(){if(document.querySelector('[data-wheel]'))return;CL.wheel.open(W,P)},Math.max(2,+W.delay||6)*1000);
 },
 open:function(W,P){
  var last=document.activeElement,d=document.createElement('div');d.className='sheet';d.setAttribute('data-wheel','');
  d.innerHTML='<div class="sheet-box wheelbox" role="dialog" aria-modal="true" aria-labelledby="wh-t"><button type="button" class="x" data-wx aria-label="إغلاق">×</button><h3 id="wh-t">'+e(W.title||'لفّي العجلة واكسبي جايزة')+' 🎁</h3>'
   +'<div class="wheelwrap"><div class="wpoint" aria-hidden="true"></div><canvas class="wcv" aria-label="عجلة الجوايز"></canvas></div>'
   +'<div class="wform"><label>رقم الموبايل<input type="tel" inputmode="numeric" autocomplete="tel" dir="ltr" placeholder="01xxxxxxxxx" maxlength="14"></label><p class="err" role="alert" hidden></p><button type="button" class="btn" data-spin>لفّي العجلة</button><small class="muted">لفّة واحدة لكل رقم موبايل. الجايزة بتتسجّل على رقمك.</small></div><div class="wres" hidden></div></div>';
  document.body.appendChild(d);document.documentElement.classList.add('lock');
  var cv=d.querySelector('.wcv');draw(cv,P);
  var inp=d.querySelector('input'),er=d.querySelector('.err'),btn=d.querySelector('[data-spin]'),busy=false;
  var c=ls('cl-contact');if(c&&c.phone)inp.value=c.phone;inp.focus();
  function close(skip){d.remove();document.documentElement.classList.remove('lock');document.removeEventListener('keydown',k);if(skip!==false)ls('cl-wheel-skip',Date.now());if(last&&last.focus)try{last.focus()}catch(x){}}
  function k(ev){if(ev.key==='Escape')close()}
  document.addEventListener('keydown',k);
  d.addEventListener('click',function(ev){if(ev.target===d||ev.target.closest('[data-wx]'))close()});
  function result(r){
   var f=d.querySelector('.wform'),box=d.querySelector('.wres');f.hidden=true;box.hidden=false;
   var win=r.type!=='none'&&r.coupon;
   if(win){ls('cl-coupon',{code:r.coupon,phone:inp.value.replace(/\D/g,''),label:r.label,exp:r.expires||null});}
   ls('cl-wheel',{done:true,res:{label:r.label,coupon:r.coupon||null,type:r.type}});
   box.innerHTML=(win?'<h4>'+(r.already?'انتي لعبتي قبل كده 💜':'مبروك! 🎉')+'</h4><p class="prize">'+e(r.label)+'</p><div class="code" dir="ltr">'+e(r.coupon)+'</div><p class="muted">الكود اتسجّل في سلتك وهيتطبق تلقائي على طلبك برقم الموبايل ده'+(r.expires?'، وشغّال لحد '+e(fmt(r.expires)):'')+'.</p><button type="button" class="btn" data-wx>اتسوقي دلوقتي</button>'
    :'<h4>'+(r.already?'انتي لعبتي قبل كده':'حظ أوفر المرة دي')+' 💜</h4><p class="muted">تابعينا على السوشيال ميديا عشان توصلك عروضنا الجاية.</p><button type="button" class="btn" data-wx>كمّلي تصفح</button>');
  }
  btn.addEventListener('click',function(){
   if(busy)return;er.hidden=true;
   var ph=inp.value.replace(/\D/g,'');if(ph.indexOf('20')===0&&ph.length===12)ph='0'+ph.slice(2);
   if(!/^01[0125][0-9]{8}$/.test(ph)){er.textContent=MSG.bad_phone;er.hidden=false;inp.focus();return}
   busy=true;btn.disabled=true;btn.textContent='جاري اللفّ...';
   rpc(ph).then(function(r){
    var n=P.length,seg=360/n,idx=Math.max(0,Math.min(n-1,+r.idx||0));
    if(r.already){result(r);return}
    var deg=360*6-(idx+0.5)*seg;
    cv.style.transition='transform 4.6s cubic-bezier(.12,.7,.1,1)';cv.style.transform='rotate('+deg+'deg)';
    setTimeout(function(){result(r)},4900);
   }).catch(function(x){
    busy=false;btn.disabled=false;btn.textContent='لفّي العجلة';
    var m=String(x&&x.message||'');var key=Object.keys(MSG).filter(function(q){return m.indexOf(q)>-1})[0];
    er.textContent=MSG[key]||'حصلت مشكلة، جرّبي تاني.';er.hidden=false;
   });
  });
 }
};
})();
