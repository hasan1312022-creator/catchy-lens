(function(){
/* Catchy Lens assistant: free, no external AI service. It answers from the store's own live data
   (catalog, stock state, shipping zones, settings, order tracking). Loaded lazily on first click. */
var CL=window.CL,U=CL.url,e=CL.esc,I=CL.icon;
var D={},S={},P=[],msgs=[],step=null,ctx={},miss=0,box=null,BOT='مساعد Catchy';
var DURW={daily:['يومي','يوميه','يومية'],monthly:['شهري','شهريه','شهرية'],quarterly:['3 شهور','ربع سنوي','ربع سنويه','تلات شهور','ثلاث شهور'],semiannual:['6 شهور','ستة شهور','نص سنه','نصف سنوي'],yearly:['سنوي','سنويه','سنه كامله','سنوية']};
var DURL={daily:'يومية',monthly:'شهرية',quarterly:'٣ شهور',semiannual:'٦ شهور',yearly:'سنوية'};
var COLW={honey:['عسلي','هاني','عسل','honey'],green:['اخضر','جرين','زيتوني','green'],blue:['ازرق','بلو','blue'],gray:['رمادي','جراي','grey','gray','فضي'],brown:['بني','براون','brown','قهوه'],hazel:['هازل','hazel'],black:['اسود','بلاك','black'],violet:['بنفسجي','فيوليت','violet'],pink:['وردي','بينك','pink'],latte:['لاتيه','latte']};
var ST={new:'تم استلام طلبك',preparing:'جاري تجهيز طلبك',shipped:'اتسلّم لشركة الشحن',indelivery:'في الطريق إليكِ',delivered:'تم التسليم',refused:'تم رفض الاستلام',unavailable:'أحد المنتجات مش متاح حاليًا، هنتواصل معاكِ',partial:'تم تسليم جزء من الطلب',cancelled:'تم إلغاء الطلب'};
function norm(s){return String(s||'').replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).toLowerCase().replace(/[ً-ْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^ء-يa-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
function has(t,words){for(var i=0;i<words.length;i++){if(t.indexOf(norm(words[i]))>-1)return true}return false}
function wa(txt){var n=S.whatsapp;return n?'https://wa.me/'+e(n)+(txt?'?text='+encodeURIComponent(txt):''):''}
function lab(f){return (S.colorLabels||{})[f]||f}
function inStock(p){return p.category==='lenses'&&p.state!=='out'}
function say(h,o){msgs.push({b:1,h:h,chips:o&&o.chips,cards:o&&o.cards});draw()}
function me(t){msgs.push({b:0,h:e(t)});draw()}
function waLink(){var last=msgs.filter(function(m){return !m.b}).slice(-3).map(function(m){return m.h.replace(/&[a-z#0-9]+;/g,' ')}).join(' / ');return wa('أهلاً، كنت بكلم مساعد الموقع'+(last?' وسألت: '+last:'')+' وعايزة أتكلم مع حد.')}
function handoff(){var l=waLink();return l?'<a class="btn alt as-wa" href="'+l+'" target="_blank" rel="noopener">كلمي فريقنا على واتساب</a>':''}
var MENU=['عايزة أختار لون','الشحن والتوصيل','الاسترجاع والاستبدال','فين طلبي؟','في عروض؟'];
function cards(list){return list.map(function(p){var img=CL.asset(p.image);return '<div class="as-card"><img src="'+e(img)+'" alt="" loading="lazy"><div><b>'+e(p.fullName||p.name)+'</b><span>'+e(lab(p.color)||p.name)+(p.duration?' · '+e(DURL[p.duration]||p.duration):'')+'</span><span class="as-pr">'+CL.money(p.price)+(p.state==='low'?' · كمية قليلة':'')+'</span><div class="as-act"><button type="button" data-qv="'+p.id+'">نظرة سريعة</button><a href="'+U.product(p)+'">التفاصيل</a></div></div></div>'}).join('')}
function find(t){
 var fam={},brands={},dur=null,max=null,eyes=null,list=P.filter(inStock);
 Object.keys(COLW).forEach(function(f){if(has(t,COLW[f]))fam[f]=1});
 P.forEach(function(p){var b=norm(p.brand);if(b.length>=3&&t.indexOf(b)>-1)brands[p.brand]=1});
 Object.keys(DURW).forEach(function(k){if(has(t,DURW[k]))dur=k});
 var m=t.match(/(?:اقل من|تحت|لحد|maximum|max)\s*(\d{2,5})/);if(m)max=+m[1];
 if(/عيوني|عيني|عينيا/.test(t)){if(has(t,['بني','براون','اسود','سودا','غامق','غامقه']))eyes='dark';else if(has(t,['ازرق','اخضر','فاتح','فاتحه','رمادي','عسلي']))eyes='light'}
 if(eyes)fam={};
 var pickF=Object.keys(fam),note='';
 if(eyes&&!pickF.length){pickF=eyes==='dark'?['honey','hazel','gray','green']:['blue','gray','green','hazel'];note=eyes==='dark'?'دي الألوان اللي بتبان بوضوح أكتر على العيون الغامقة: ':'دي ألوان بتدّي لمسة مميزة على العيون الفاتحة: '}
 if(pickF.length)list=list.filter(function(p){return pickF.indexOf(p.color)>-1||has(norm(p.name),pickF.map(function(f){return (COLW[f]||[f])[0]}))});
 if(Object.keys(brands).length)list=list.filter(function(p){return brands[p.brand]});
 if(dur)list=list.filter(function(p){return p.duration===dur});
 if(max)list=list.filter(function(p){return p.price&&p.price<=max});
 var asked=pickF.length||Object.keys(brands).length||dur||max;
 list.sort(function(a,b){return (a.price||0)-(b.price||0)});
 var seen={},out=[];list.forEach(function(p){var k=p.pid+'|'+p.color;if(!seen[k]&&out.length<4){seen[k]=1;out.push(p)}});
 return {out:out,asked:asked,note:note,fam:pickF}
}
function shipAns(t){
 var Z=S.zones||[],z=Z.filter(function(x){var n=norm(x.name);return n.length>2&&t.indexOf(n)>-1})[0],h='';
 if(z){h='الشحن لـ <b>'+e(z.name)+'</b>: '+CL.money(z.fee)+'. '}
 h+='التوصيل: القاهرة والجيزة '+e(S.shipCairo||'يومين')+'، الوجه البحري '+e(S.shipDelta||'٣ إلى ٤ أيام')+'، الوجه القبلي '+e(S.shipUpper||'٤ إلى ٥ أيام')+'. ';
 if(S.freeShipMin)h+='الشحن <b>مجاني</b> للطلبات فوق '+CL.money(S.freeShipMin)+'. ';
 h+='الدفع عند الاستلام.';
 if(!z)h+='<br>اكتبي اسم محافظتك وأقولك مصاريف الشحن بالظبط.';
 return h
}
function trackSend(){
 if(CL.config.mode!=='live'){say('التتبع مش متاح في وضع المعاينة.');return}
 say('ثواني أدوّر على طلبك...');
 CL.data.track(+ctx.id,ctx.phone).then(function(r){
  step=null;var o=r&&r.ok?r.order:null;
  if(!o){say('مالقيتش طلب بالرقم والموبايل دول. اتأكدي منهم وجرّبي تاني، أو كلمي فريقنا.'+handoff());return}
  say('طلب رقم <b>'+e(ctx.id)+'</b>: <b>'+e(ST[o.status]||o.status)+'</b>.'+(o.waybill?'<br>رقم البوليصة: <bdi dir="ltr">'+e(o.waybill)+'</bdi>':'')+'<br>الإجمالي: '+CL.money(o.total)+'<br><a class="textlink" href="'+U.tracking+'?id='+e(ctx.id)+'">تفاصيل أكتر</a>');
 }).catch(function(){step=null;say('حصلت مشكلة في الاتصال، جرّبي كمان شوية.')});
}
function reply(raw){
 var t=norm(raw),nums=(raw.replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).match(/\d+/g)||[]);
 if(step==='trk'){
  nums.forEach(function(n){if(n.length>=10)ctx.phone=n;else if(n.length<=7&&!ctx.id)ctx.id=n});
  if(!ctx.id){say('اكتبي رقم الطلب (الأرقام بس).');return}
  if(!ctx.phone){say('وكمان رقم الموبايل اللي سجّلتي بيه الطلب.');return}
  trackSend();return}
 if(has(t,['وجع','بتوجع','بتوجعني','احمرار','حمرا','دموع','الم','تعب','حساسيه','التهاب','حرقان','رؤيه','ضبابي','دكتور','نظري ضعيف','تشخيص','مناسبه لعيني','عندي مشكله في عيني'])){
  say('لو حاسة بوجع أو احمرار أو زغللة، شيلي العدسات فورًا وروحي لدكتور عيون. أنا مش بقدر أشخّص أو أنصح طبيًا. وفي أي سؤال تاني عن الطلبات أو الألوان أنا موجودة.'+handoff());return}
 if(has(t,['فين طلبي','طلبي','اوردر','اورد','تتبع','الشحنه وصلت','وصل ولا لا','اوردري','رقم طلب'])){
  var L=CL.store.get('cl-last',null);ctx={};
  if(nums.length){nums.forEach(function(n){if(n.length>=10)ctx.phone=n;else if(n.length<=7)ctx.id=n})}
  else if(L&&L.id){ctx.id=String(L.id);if(L.phone)ctx.phone=String(L.phone)}
  if(ctx.id&&ctx.phone){trackSend();return}
  step='trk';say(ctx.id?'رقم طلبك '+e(ctx.id)+'. اكتبي رقم الموبايل اللي سجّلتي بيه.':'اكتبي رقم الطلب ورقم الموبايل اللي سجّلتي بيه.');return}
 if(has(t,['ارجاع','استرجاع','ارجع','استبدال','استبدل','بدل','عيب','مقطوعه','قطع','غلط','لون غلط','سياسه'])){
  say('الاستبدال أو الاسترجاع متاح لو في <b>عيب صناعة أو قطع</b> في العدسة، حتى لو اتفتحت. ولو اللون غلط يتغيّر <b>بشرط إن العدسة لسه مقفولة</b>. لازم تبلغينا خلال <b>'+e(S.returnWindow||'٤٨ ساعة')+'</b> من الاستلام.<br><a class="textlink" href="'+U.returns+'">السياسة كاملة</a>'+handoff());return}
 if(has(t,['شحن','توصيل','مصاريف','بتوصلوا','يوصل','ياخد كام','بكام الشحن','محافظه','القاهره','الجيزه','اسكندريه','الصعيد','طنطا','المنصوره'])){say(shipAns(t));return}
 if(has(t,['دفع','كاش','فيزا','عند الاستلام','فودافون','انستاباي','كارت'])){say('الدفع <b>عند الاستلام فقط</b>، مفيش دفع أونلاين حاليًا.');return}
 if(has(t,['عرض','عروض','كوبون','خصم','تخفيض','اوفر','هديه','عجله'])){say('العروض والكوبونات الحالية في صفحة العروض، وفي كمان عجلة الحظ على الموقع. العرض الواحد بيتطبق على الأوردر، والكوبون ممكن يتجمع معاه.<br><a class="textlink" href="'+U.offers+'">شوفي العروض</a>');return}
 if(has(t,['ساعات','مواعيد','شغالين','تواصل','رقم','واتس','موبايل','اكلم','كلم','موظف','حد'])){say('بنرد يوميًا '+e(S.hours||'من ١٠ صباحًا إلى ١٠ مساءً')+'.'+handoff());return}
 if(has(t,['جرب','تجربه','تجربة','اجرب','كاميرا','ع وشي','على وشي'])){say('تقدري تجرّبي الألوان على وشك بالكاميرا أو بصورة من صفحة <a class="textlink" href="'+U.tryon+'">جرّبي اللون</a>.');return}
 if(has(t,['مرحبا','اهلا','هاي','السلام','صباح','مساء','hello','hi'])&&t.length<24){say('أهلاً بيكي! أنا '+BOT+'. أقدر أساعدك تختاري لون، أجاوبك عن الشحن والاسترجاع، أو أتابع طلبك.',{chips:MENU});return}
 if(has(t,['شكرا','تسلم','ميرسي','thanks'])){say('العفو! لو احتاجتي أي حاجة أنا هنا.');return}
 if(has(t,['اختار','لون','الوان','عدسه','عدسات','رشح','اقترح','ترشيح','عايزه','محتاجه','عاوزه','ارخص','احسن','مناسب','مقاس','نظر','باور','قوه','درجه','يوميه','شهريه'])||find(t).asked){
  var r=find(t);
  if(has(t,['نظر','باور','قوه','درجه','مقاس'])&&!r.asked){say('لو محتاجة عدسة بقوة نظر، اختاري اللون وهتلاقي درجات القوة المتاحة لكل عين في صفحة المنتج، وبنجهّزها من المورد وممكن تاخد وقت أكتر. تحبي أرشّحلك لون؟',{chips:['رشّحيلي لون','عدسات يومية','عدسات شهرية']});return}
  if(r.out.length){say((r.note||'ده اللي لقيته متاح دلوقتي: ')+'<div class="as-cards">'+cards(r.out)+'</div>',{chips:['لون تاني','عدسات يومية','عدسات شهرية','تحت 300 جنيه']});return}
  if(r.asked){say('مفيش حاجة متاحة بالمواصفات دي حاليًا. جرّبي لون أو مدة تانية، أو شوفي كل المنتجات.<br><a class="textlink" href="'+U.catalog+'">كل العدسات</a>',{chips:['لون تاني']});return}
  say('قوليلي أكتر: لون عينك إيه، وتحبي لون معين، وعدسات يومية ولا شهرية، وميزانيتك تقريبًا كام؟ وأنا أرشّحلك من المتاح.',{chips:['عيوني بني','عيوني فاتحة','عدسات شهرية','تحت 300 جنيه']});return}
 miss++;
 say(miss>=2?'يظهر إني مش فاهمة قصدك بالظبط. ممكن تكلمي فريقنا مباشرة وهيساعدوكي.'+handoff():'مش متأكدة إني فهمت. جرّبي واحد من دول:',{chips:MENU});
}
function draw(){
 if(!box)return;var m=box.querySelector('.as-msgs');
 m.innerHTML=msgs.map(function(x,i){return '<div class="as-m '+(x.b?'b':'u')+'">'+x.h+(x.b&&i===msgs.length-1&&x.chips?'<div class="as-chips">'+x.chips.map(function(c){return '<button type="button" data-ac="'+e(c)+'">'+e(c)+'</button>'}).join('')+'</div>':'')+'</div>'}).join('');
 m.scrollTop=m.scrollHeight
}
function send(t){t=String(t||'').trim();if(!t)return;me(t);setTimeout(function(){reply(t)},280)}
function open(){
 if(box){box.hidden=false;return}
 box=document.createElement('section');box.className='as';box.setAttribute('role','dialog');box.setAttribute('aria-label',BOT);
 box.innerHTML='<header><b>'+BOT+'</b><span>بنرد فورًا</span><button type="button" data-asx aria-label="إغلاق">'+I('close')+'</button></header><div class="as-msgs" aria-live="polite"></div><form class="as-in"><input type="text" placeholder="اكتبي سؤالك..." autocomplete="off" aria-label="اكتبي سؤالك"><button type="submit" aria-label="إرسال">'+I('chat')+'</button></form>';
 document.body.appendChild(box);
 box.addEventListener('click',function(ev){var t=ev.target,c=t.closest&&t.closest('[data-ac]');if(c){send(c.dataset.ac);return}if(t.closest&&t.closest('[data-asx]'))box.hidden=true});
 box.querySelector('form').addEventListener('submit',function(ev){ev.preventDefault();var i=ev.target.elements[0];send(i.value);i.value=''});
 say('أهلاً بيكي في Catchy Lens! أنا '+BOT+'. أقدر أرشّحلك لون من المتاح دلوقتي، أجاوبك عن الشحن والاسترجاع، أو أتابع طلبك.',{chips:MENU});
}
CL.assistant={open:function(){var d=CL.ui.data();S=d.S||{};P=d.P||[];open();var i=box.querySelector('input');if(i)setTimeout(function(){i.focus()},50)}};
})();
