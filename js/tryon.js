/* Virtual lens try-on: photo / camera / live. Face detection by MediaPipe FaceMesh (loaded on demand); everything stays on the phone. */
(function(){
var CL=window.CL,e=CL.esc,A=CL.asset,U=CL.url;
var FM_URL='https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/';
var DEF=[['Siri Green','أخضر'],['Siri Blue','أزرق'],['Siri Gray','رمادي'],['Siri Brown','بني'],['Siri Crown Brown','كراون بني'],['Siri Latte','لاتيه'],['Siri Hazy Gray','هيزي رمادي'],['Siri Crown Gray','كراون رمادي'],['Siri Rainbow Blue','رينبو أزرق'],['Siri Crown Green','كراون أخضر']];
CL.tryonDefaults=function(){return DEF.map(function(d,i){return {name:d[1],en:d[0],img:'img/tryon/siri-'+(i<9?'0':'')+(i+1)+'.webp'}})};
function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,' ').trim()}
var fmP=null;
function loadFM(){
 if(window.FaceMesh)return Promise.resolve();
 if(!fmP)fmP=new Promise(function(ok,no){var s=document.createElement('script');s.src=FM_URL+'face_mesh.js';s.crossOrigin='anonymous';s.onload=ok;s.onerror=function(){fmP=null;no(new Error('fm'))};document.head.appendChild(s)});
 return fmP;
}
var IDX=[[33,246,161,160,159,158,157,173,133,155,154,153,145,144,163,7],[362,398,384,385,386,387,388,466,263,249,390,373,374,380,381,382]];
CL.tryon={mount:function(x,P,S){
 var items=(S&&S.tryon&&S.tryon.items&&S.tryon.items.length)?S.tryon.items:CL.tryonDefaults();
 items=items.filter(function(i){return i&&i.img});
 var WA=(S&&S.whatsapp)||'';
 function match(it){
  if(it.variant)return P.filter(function(p){return p.id===+it.variant})[0]||null;
  if(!it.en)return null;
  var names=[norm(it.name),norm(it.en),norm(String(it.en).replace(/^siri\s+/i,''))];
  return P.filter(function(p){return p.category==='lenses'&&/siri|سيري/i.test(p.brand+' '+(p.fullName||''))&&names.indexOf(norm(p.name))>-1})[0]||null;
 }
 items.forEach(function(it){it.p=match(it);it.i=new Image();it.i.crossOrigin='anonymous';it.i.onload=function(){if(ready)draw()};it.i.src=A(it.img)});
 x.innerHTML='<h1>جرّبي اللون</h1><p class="lead">شوفي اللون على عينك قبل ما تطلبي.</p>'
  +'<div class="tr-card"><div class="tr-btns"><label class="btn">افتحي الكاميرا<input id="tr-cam" type="file" accept="image/*" capture="user" hidden></label><label class="btn alt">ارفعي صورة<input id="tr-up" type="file" accept="image/*" hidden></label></div>'
  +'<button type="button" id="tr-liveb" class="btn" style="width:100%;margin-top:10px">تجربة لايف بالكاميرا</button><p class="tr-note">الصورة والفيديو بيفضلوا على موبايلك ومش بيتبعتوا لأي مكان.</p></div>'
  +'<div id="tr-stage" hidden><div class="tr-card"><div class="tr-cvw"><canvas id="tr-cv" width="800" height="1000"></canvas></div>'
  +'<div class="tr-zb"><button type="button" id="tr-zin">قرّبي على العين</button><button type="button" id="tr-zout">الوجه كامل</button></div>'
  +'<button type="button" id="tr-lstop" class="btn" hidden style="width:100%;margin-bottom:10px">التقطي الصورة وأوقفي اللايف</button>'
  +'<div class="tr-row"><span>زووم</span><input id="tr-zoom" type="range" min="100" max="500" value="100"></div><div id="tr-msg" role="status"></div>'
  +'<div class="tr-lens" id="tr-lens"></div>'
  +'<div class="tr-row"><span>حجم العدسة</span><input id="tr-size" type="range" min="50" max="150" value="100"></div><div class="tr-row"><span>قوة اللون</span><input id="tr-str" type="range" min="40" max="160" value="100"></div>'
  +'<p class="tr-note">لو العدسة مش مظبوطة على عينك، اسحبي الدايرة لمكان البؤبؤ.</p><div id="tr-buy" class="tr-buy"></div><p class="tr-note">النتيجة تقريبية، واللون بيبان أهدى على العيون الغامقة.</p></div></div>';
 var $=function(s){return x.querySelector(s)};
 var cv=$('#tr-cv'),ctx=cv.getContext('2d'),base=document.createElement('canvas'),bctx=base.getContext('2d',{willReadFrequently:true});
 var eyes=[],polys=[null,null],sel=Math.min(1,items.length-1),scale=1,drag=-1,manual=false,ready=false,zoom=1,tx=0,ty=0,pan=null,str=1,live=false,stream=null,fmLive=null,busy=false,alive=true;
 var box=$('#tr-lens');
 box.innerHTML=items.map(function(o,k){return '<button type="button" class="ch'+(k===sel?' on':'')+'" data-k="'+k+'"><img src="'+e(A(o.img))+'" alt="" loading="lazy"><span>'+e(o.name)+'</span></button>'}).join('');
 box.onclick=function(ev){var b=ev.target.closest('[data-k]');if(!b)return;sel=+b.dataset.k;[].forEach.call(box.children,function(c,j){c.classList.toggle('on',j===sel)});draw()};
 function buy(){
  var it=items[sel],p=it&&it.p,h;
  if(p)h='<div class="tr-pn"><span class="brand">'+e(p.brand)+'</span><b>'+e(p.fullName||p.name)+' — '+e(p.name)+'</b><span class="price">'+CL.money(p.price)+'</span></div><button type="button" class="btn" data-qv="'+p.id+'">أضيفي للسلة</button>';
  else h='<div class="tr-pn"><b>'+e(it?it.name:'')+'</b><span class="tr-note" style="margin:0">اللون ده لسه مش متاح للطلب من الموقع.</span></div><a class="btn alt" href="'+U.catalog+'">شوفي المنتجات</a>';
  var b=$('#tr-buy');if(b.dataset.k!==String(sel)){b.dataset.k=sel;b.innerHTML=h}
 }
 function msg(t){$('#tr-msg').textContent=t||''}
 function lensOne(o,p){
  var it=items[sel];if(!it||!it.i.complete||!it.i.naturalWidth)return;
  var r=o.r*scale*1.02,im=it.i;
  ctx.save();ctx.beginPath();
  if(p){p.forEach(function(q,i){i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])});ctx.closePath()}
  else ctx.ellipse(o.x,o.y,r*2,r*.82,0,0,7);
  ctx.clip();
  try{ctx.filter='blur(.5px)'}catch(z){}
  var a=.94*str;ctx.globalAlpha=Math.min(1,a);ctx.drawImage(im,o.x-r,o.y-r,2*r,2*r);if(a>1){ctx.globalAlpha=a-1;ctx.drawImage(im,o.x-r,o.y-r,2*r,2*r)}
  ctx.filter='none';ctx.globalAlpha=1;
  ctx.beginPath();ctx.arc(o.x,o.y,r,0,7);ctx.clip();
  var g=ctx.createLinearGradient(0,o.y-r,0,o.y+r*.3);g.addColorStop(0,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.fillRect(o.x-r,o.y-r,2*r,2*r);
  ctx.restore();
  var s=Math.ceil(r*1.1),x0=Math.max(0,Math.round(o.x-s)),y0=Math.max(0,Math.round(o.y-s)),w=Math.min(cv.width-x0,2*s),h=Math.min(cv.height-y0,2*s);
  if(w<2||h<2)return;
  try{var d=bctx.getImageData(x0,y0,w,h),q=ctx.getImageData(x0,y0,w,h);
   for(var i=0;i<d.data.length;i+=4){if((d.data[i]+d.data[i+1]+d.data[i+2])/3>205){q.data[i]=d.data[i];q.data[i+1]=d.data[i+1];q.data[i+2]=d.data[i+2]}}
   ctx.putImageData(q,x0,y0)}catch(z){}
 }
 function draw(){
  if(!ready)return;
  ctx.drawImage(base,0,0);
  eyes.forEach(function(o,i){lensOne(o,manual?null:polys[i])});
  if(manual){ctx.save();ctx.lineWidth=Math.max(2,cv.width/300);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.setLineDash([8,6]);eyes.forEach(function(o){ctx.beginPath();ctx.arc(o.x,o.y,o.r*scale*1.02,0,7);ctx.stroke()});ctx.restore()}
  buy();
 }
 function fromLm(lm,sm){
  var W=base.width,H=base.height,P2=function(i){return [lm[i].x*W,lm[i].y*H]},ne=[],np=[];
  [468,473].forEach(function(c,k){var a=P2(c),b=P2(c+1),d=P2(c+2),e2=P2(c+3),f=P2(c+4);
   var r=Math.max(Math.hypot(b[0]-d[0],b[1]-d[1]),Math.hypot(e2[0]-f[0],e2[1]-f[1]))/2;
   ne.push({x:a[0],y:a[1],r:r});np.push(IDX[k].map(P2))});
  if(sm&&eyes.length===2&&polys[0]){var t=.55;
   ne.forEach(function(o,k){var old=eyes[k];o.x=old.x+(o.x-old.x)*t;o.y=old.y+(o.y-old.y)*t;o.r=old.r+(o.r-old.r)*t;
    np[k]=np[k].map(function(q,j){return [polys[k][j][0]+(q[0]-polys[k][j][0])*t,polys[k][j][1]+(q[1]-polys[k][j][1])*t]})})}
  eyes=ne;polys=np;
 }
 function detect(){
  return loadFM().then(function(){
   var fm=new window.FaceMesh({locateFile:function(f){return FM_URL+f}});
   fm.setOptions({maxNumFaces:1,refineLandmarks:true,minDetectionConfidence:.5});
   return new Promise(function(ok,no){var t=setTimeout(function(){no('t')},12000);fm.onResults(function(r){clearTimeout(t);ok(r)});fm.send({image:base}).catch(no)});
  }).then(function(res){var lm=res.multiFaceLandmarks&&res.multiFaceLandmarks[0];if(!lm)throw 0;fromLm(lm,false)});
 }
 function guess(){var W=base.width,H=base.height,r=W*.07;eyes=[{x:W*.34,y:H*.4,r:r},{x:W*.66,y:H*.4,r:r}];polys=[null,null]}
 function show(){$('#tr-stage').hidden=false}
 function load(f){
  if(live)stopLive();if(!f)return;
  var url=URL.createObjectURL(f),im=new Image();
  im.onload=function(){
   var m=Math.min(1,2000/Math.max(im.width,im.height));
   base.width=cv.width=Math.round(im.width*m);base.height=cv.height=Math.round(im.height*m);
   bctx.drawImage(im,0,0,base.width,base.height);URL.revokeObjectURL(url);
   show();ready=true;manual=false;scale=1;$('#tr-size').value=100;str=1;$('#tr-str').value=100;
   ctx.drawImage(base,0,0);msg('جاري تحديد العين…');
   detect().then(function(){msg('تم تحديد العين. جرّبي الألوان.')}).catch(function(){manual=true;guess();msg('اسحبي الدايرتين على بؤبؤ عينك.')}).then(function(){draw();zoom=1;tx=ty=0;$('#tr-zoom').value=100;applyZoom();$('#tr-stage').scrollIntoView({behavior:'smooth'})});
  };
  im.onerror=function(){msg('الصورة دي مش مقروءة، جرّبي صورة تانية.');show()};
  im.src=url;
 }
 function applyZoom(){var w=cv.parentNode.clientWidth,h=cv.clientHeight;
  if(zoom<=1){tx=ty=0}else{tx=Math.min(0,Math.max(w-w*zoom,tx));ty=Math.min(0,Math.max(h-h*zoom,ty))}
  cv.style.transform='translate('+tx+'px,'+ty+'px) scale('+zoom+')'}
 function focusEyes(z){zoom=z;$('#tr-zoom').value=z*100;
  if(z<=1||eyes.length<2){tx=ty=0;applyZoom();return}
  var w=cv.parentNode.clientWidth,h=cv.clientHeight,mx=(eyes[0].x+eyes[1].x)/2/cv.width*w,my=(eyes[0].y+eyes[1].y)/2/cv.height*h;
  tx=w/2-mx*z;ty=h/2-my*z;applyZoom()}
 $('#tr-zin').onclick=function(){if(ready)focusEyes(3)};$('#tr-zout').onclick=function(){if(ready)focusEyes(1)};
 $('#tr-zoom').oninput=function(ev){if(!ready)return;var z=ev.target.value/100,w=cv.parentNode.clientWidth,h=cv.clientHeight,cx=(w/2-tx)/zoom,cy=(h/2-ty)/zoom;zoom=z;tx=w/2-cx*z;ty=h/2-cy*z;applyZoom()};
 $('#tr-str').oninput=function(ev){str=ev.target.value/100;draw()};
 $('#tr-size').oninput=function(ev){scale=ev.target.value/100;draw()};
 $('#tr-cam').onchange=function(ev){load(ev.target.files[0]);ev.target.value=''};
 $('#tr-up').onchange=function(ev){load(ev.target.files[0]);ev.target.value=''};
 function startLive(){
  if(live)return;
  show();msg('جاري تشغيل الكاميرا…');
  var gm=navigator.mediaDevices&&navigator.mediaDevices.getUserMedia;
  if(!gm){msg('الكاميرا مش متاحة في المتصفح ده. استخدمي زر "افتحي الكاميرا" أو ارفعي صورة.');return}
  Promise.all([navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:480},height:{ideal:640}},audio:false}),loadFM()]).then(function(r){
   stream=r[0];var v=document.createElement('video');v.playsInline=true;v.muted=true;v.srcObject=stream;
   return v.play().then(function(){
    base.width=cv.width=v.videoWidth||480;base.height=cv.height=v.videoHeight||640;
    ready=true;manual=false;live=true;eyes=[];polys=[null,null];zoom=1;tx=ty=0;$('#tr-zoom').value=100;applyZoom();
    $('#tr-lstop').hidden=false;$('#tr-liveb').hidden=true;msg('جاري تشغيل الكاميرا…');$('#tr-stage').scrollIntoView({behavior:'smooth'});
    if(!fmLive){fmLive=new window.FaceMesh({locateFile:function(f){return FM_URL+f}});
     fmLive.setOptions({maxNumFaces:1,refineLandmarks:true,minDetectionConfidence:.5,minTrackingConfidence:.5});
     fmLive.onResults(function(rs){if(!live)return;var lm=rs.multiFaceLandmarks&&rs.multiFaceLandmarks[0];
      if(lm){fromLm(lm,true);msg('');draw()}else{ctx.drawImage(base,0,0);msg('وجّهي وشك للكاميرا')}})}
    var loop=function(){if(!live||!alive)return;
     bctx.save();bctx.translate(base.width,0);bctx.scale(-1,1);bctx.drawImage(v,0,0,base.width,base.height);bctx.restore();
     if(!busy){busy=true;fmLive.send({image:base}).catch(function(){}).then(function(){busy=false})}
     requestAnimationFrame(loop)};
    loop();
   });
  }).catch(function(er){
   if(stream){stream.getTracks().forEach(function(t){t.stop()});stream=null}
   msg((window.isSecureContext?'':'افتحي الموقع من رابط https. ')+(er&&er.name==='NotAllowedError'?'اسمحي بإذن الكاميرا من إعدادات المتصفح، أو ':'الكاميرا اللايف مش متاحة دلوقتي، ')+'استخدمي زر "افتحي الكاميرا" أو ارفعي صورة.');
  });
 }
 function stopLive(){live=false;if(stream)stream.getTracks().forEach(function(t){t.stop()});stream=null;
  $('#tr-lstop').hidden=true;$('#tr-liveb').hidden=false;
  msg('تم التقاط الصورة. جرّبي الألوان أو قرّبي على العين.');if(eyes.length===2)draw()}
 $('#tr-liveb').onclick=startLive;$('#tr-lstop').onclick=stopLive;
 function pos(ev){var r=cv.getBoundingClientRect();return[(ev.clientX-r.left)*cv.width/r.width,(ev.clientY-r.top)*cv.height/r.height]}
 cv.addEventListener('pointerdown',function(ev){if(!ready||live)return;var p=pos(ev),px=p[0],py=p[1];
  var b=0,bd=1e9;eyes.forEach(function(o,i){var d=Math.hypot(o.x-px,o.y-py);if(d<bd){bd=d;b=i}});
  if(bd>cv.width*.18){if(zoom>1){pan={x:ev.clientX,y:ev.clientY,tx:tx,ty:ty};cv.setPointerCapture(ev.pointerId)}return}
  drag=b;if(!manual){manual=true;msg('اسحبي الدايرة لمكان البؤبؤ.')}
  cv.setPointerCapture(ev.pointerId);draw()});
 cv.addEventListener('pointermove',function(ev){if(pan){tx=pan.tx+ev.clientX-pan.x;ty=pan.ty+ev.clientY-pan.y;applyZoom();return}if(drag<0)return;var p=pos(ev);eyes[drag].x=p[0];eyes[drag].y=p[1];draw()});
 ['pointerup','pointercancel'].forEach(function(t){cv.addEventListener(t,function(){drag=-1;pan=null})});
 window.addEventListener('pagehide',function(){alive=false;live=false;if(stream)stream.getTracks().forEach(function(t){t.stop()})});
}};
})();
