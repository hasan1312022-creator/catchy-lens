(function(){
/* Catchy Lens assistant: free, no external AI service. It answers from the store's own live data
   (catalog, stock state, shipping zones, settings, order tracking). Loaded lazily on first click. */
var CL=window.CL,U=CL.url,e=CL.esc,I=CL.icon;
var D={},S={},P=[],OFF=[],msgs=[],step=null,ctx={},miss=0,box=null,BOT='مساعد Catchy',voiceOn=false,viaVoice=false,rec=null,listening=false,VOICE=null,SR=window.SpeechRecognition||window.webkitSpeechRecognition,TTS=('speechSynthesis' in window)?window.speechSynthesis:null;
var DURW={daily:['يومي','يوميه','يومية'],monthly:['شهري','شهريه','شهرية'],quarterly:['3 شهور','ربع سنوي','ربع سنويه','تلات شهور','ثلاث شهور'],semiannual:['6 شهور','ستة شهور','نص سنه','نصف سنوي'],yearly:['سنوي','سنويه','سنه كامله','سنوية']};
var DURL={daily:'يومية',monthly:'شهرية',quarterly:'٣ شهور',semiannual:'٦ شهور',yearly:'سنوية'};
var COLW={honey:['عسلي','هاني','عسل','honey'],green:['اخضر','جرين','زيتوني','green'],blue:['ازرق','بلو','blue'],gray:['رمادي','جراي','grey','gray','فضي'],brown:['بني','براون','brown','قهوه'],hazel:['هازل','hazel'],black:['اسود','بلاك','black'],violet:['بنفسجي','فيوليت','violet'],pink:['وردي','بينك','pink'],latte:['لاتيه','latte']};
var ST={new:'تم استلام طلبك',preparing:'جاري تجهيز طلبك',shipped:'اتسلّم لشركة الشحن',indelivery:'في الطريق إليكِ',delivered:'تم التسليم',refused:'تم رفض الاستلام',unavailable:'أحد المنتجات مش متاح حاليًا، هنتواصل معاكِ',partial:'تم تسليم جزء من الطلب',cancelled:'تم إلغاء الطلب'};
function norm(s){return String(s||'').replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).toLowerCase().replace(/[ً-ْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^ء-يa-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()}
function has(t,words){var pt=' '+t+' ';for(var i=0;i<words.length;i++){var ww=words[i].charAt(0)==='='?words[i].slice(1):words[i],w=norm(ww);if(w.length<=2||words[i].charAt(0)==='='?pt.indexOf(' '+w+' ')>-1:t.indexOf(w)>-1)return true}return false}
function wa(txt){var n=S.whatsapp;return n?'https://wa.me/'+e(n)+(txt?'?text='+encodeURIComponent(txt):''):''}
function lab(f){return (S.colorLabels||{})[f]||f}
function inStock(p){return p.category==='lenses'&&p.state!=='out'}
function say(h,o){msgs.push({b:1,h:h,chips:o&&o.chips,cards:o&&o.cards});draw();if(voiceOn||viaVoice)speak(h)}
/* ---- voice (free, uses the browser's own speech engine) ---- */
function pickVoice(){
 if(!TTS)return null;var v=TTS.getVoices()||[],ar=v.filter(function(x){return /^ar/i.test(x.lang)});if(!ar.length)return null;
 function score(x){var n=(x.name||'').toLowerCase(),sc=0;if(/^ar[-_]eg/i.test(x.lang))sc+=50;else if(/^ar[-_]sa/i.test(x.lang))sc+=20;if(/neural|natural|online|google|premium|enhanced|siri|hoda|salma|shakir/.test(n))sc+=30;if(/female|salma|hoda|laila|zariyah|maged/.test(n))sc+=2;if(x.localService===false)sc+=5;return sc}
 ar.sort(function(a,b){return score(b)-score(a)});return ar[0]
}
function speechText(h){
 var t=String(h).split('<div class="as-cards"')[0];var cardsFollow=String(h).indexOf('as-cards')>-1;
 t=t.replace(/<br\s*\/?>/gi,'. ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'و').replace(/&[a-z#0-9]+;/gi,' ');
 t=t.replace(/https?:\/\/\S+/g,'').replace(/ج\.م/g,' جنيه').replace(/[·•|]/g,'،').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,'').replace(/\s+/g,' ').trim();
 if(cardsFollow)t+=' شوفي الاختيارات قدامك.';
 return t
}
var AU=null,seq=0,cloudDownUntil=0;
function ttsUrl(){var c=CL.config||{};return c.tts===false?'':(c.ttsUrl||(c.supabaseUrl?c.supabaseUrl+'/functions/v1/tts':''))}
function unlock(){if(TTS&&!unlock.t){unlock.t=1;try{var w=new SpeechSynthesisUtterance(' ');w.volume=0;TTS.speak(w)}catch(x){}}if(AU||typeof Audio==='undefined')return;try{AU=new Audio();AU.src='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';var pr=AU.play();if(pr&&pr.catch)pr.catch(function(){})}catch(x){AU=null}}
function chunksOf(txt,max){var parts=txt.match(/[^.،؟?!\n]+[.،؟?!]?/g)||[txt],c='',q=[];parts.forEach(function(x){while(x.length>max){q.push(x.slice(0,max));x=x.slice(max)}if((c+x).length>max){if(c)q.push(c);c=x}else c+=x});if(c)q.push(c);return q.map(function(x){return x.trim()}).filter(Boolean)}
function cloudUrl(text){return fetch(ttsUrl(),{method:'POST',headers:{'content-type':'application/json',apikey:(CL.config||{}).anonKey||''},body:JSON.stringify({text:text})}).then(function(r){if(!r.ok){cloudDownUntil=Date.now()+600000;throw new Error('tts '+r.status)}return r.json()}).then(function(j){if(!j||!j.url)throw new Error('no url');return j.url})}
function browserSpeak(chunks){
 if(!TTS)return;VOICE=VOICE||pickVoice();if(!VOICE)return;
 chunks.forEach(function(c){var u=new SpeechSynthesisUtterance(c);u.voice=VOICE;u.lang=VOICE.lang||'ar-EG';u.rate=.93;u.pitch=1.05;TTS.speak(u)})
}
function playCloud(chunks,mySeq){
 var pend=[];
 function get(i){if(!pend[i])pend[i]=cloudUrl(chunks[i]);return pend[i]}
 function step(i){
  if(mySeq!==seq||i>=chunks.length)return;
  get(i).then(function(u){
   if(mySeq!==seq)return;if(i+1<chunks.length)get(i+1).catch(function(){});
   AU.onended=function(){step(i+1)};AU.onerror=function(){fallback(i)};AU.src=u;
   var pr=AU.play();if(pr&&pr.catch)pr.catch(function(){fallback(i)})
  }).catch(function(){fallback(i)})
 }
 function fallback(i){if(mySeq!==seq)return;seq++;if(AU){AU.onended=null;AU.onerror=null;try{AU.pause()}catch(x){}}browserSpeak(chunks.slice(i))}
 step(0)
}
function speak(h){
 var txt=speechText(h);if(!txt)return;var mySeq=++seq;if(TTS)TTS.cancel();if(AU){try{AU.pause()}catch(x){}}
 if(ttsUrl()&&AU&&Date.now()>cloudDownUntil){playCloud(chunksOf(txt,280),mySeq);return}
 browserSpeak(chunksOf(txt,150))
}
function stopAll(){seq++;if(AU){try{AU.pause()}catch(x){}}if(TTS)TTS.cancel();if(rec&&listening){try{rec.stop()}catch(x){}}}
function micToggle(){
 var inp=box.querySelector('.as-in input'),mic=box.querySelector('.as-mic');
 if(listening){try{rec.stop()}catch(x){}return}
 if(TTS)TTS.cancel();
 rec=new SR();rec.lang='ar-EG';rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=1;
 var final='';
 rec.onstart=function(){listening=true;mic.classList.add('on');inp.placeholder='بسمعك... اتكلمي'};
 rec.onresult=function(ev){var t='';for(var i=0;i<ev.results.length;i++){t+=ev.results[i][0].transcript;if(ev.results[i].isFinal)final=t}inp.value=t};
 rec.onerror=function(ev){listening=false;mic.classList.remove('on');inp.placeholder='اكتبي سؤالك...';if(ev.error==='not-allowed'||ev.error==='service-not-allowed')say('محتاجة تسمحي للمتصفح بالميكروفون عشان أسمعك. وممكن تكتبي سؤالك عادي.');else if(ev.error==='no-speech')say('ما سمعتش حاجة. جرّبي تاني أو اكتبي سؤالك.')};
 rec.onend=function(){listening=false;mic.classList.remove('on');inp.placeholder='اكتبي سؤالك...';var t=(final||inp.value||'').trim();if(t){inp.value='';viaVoice=true;send(t)}};
 try{rec.start()}catch(x){listening=false}
}
function me(t){msgs.push({b:0,h:e(t)});draw()}
function waLink(){var last=msgs.filter(function(m){return !m.b}).slice(-3).map(function(m){return m.h.replace(/&[a-z#0-9]+;/g,' ')}).join(' / ');return wa('أهلاً، كنت بكلم مساعد الموقع'+(last?' وسألت: '+last:'')+' وعايزة أتكلم مع حد.')}
function handoff(){var l=waLink();return l?'<a class="btn alt as-wa" href="'+l+'" target="_blank" rel="noopener">كلمي فريقنا على واتساب</a>':''}
var MENU=['عايزة أختار لون','الشحن والتوصيل','الاسترجاع والاستبدال','فين طلبي؟','في عروض؟','محاليل وإكسسوارات'];
function cards(list){return list.map(function(p){var img=CL.asset(p.image);return '<div class="as-card"><img src="'+e(img)+'" alt="" loading="lazy"><div><b>'+e(p.fullName||p.name)+'</b><span>'+e(lab(p.color)||p.name)+(p.duration?' · '+e(DURL[p.duration]||p.duration):'')+'</span><span class="as-pr">'+CL.money(p.price)+(p.state==='low'?' · كمية قليلة':'')+'</span><div class="as-act"><button type="button" data-qv="'+p.id+'">نظرة سريعة</button><a href="'+U.product(p)+'">التفاصيل</a></div></div></div>'}).join('')}

/* brand names written in Arabic (key = first word of the brand in latin, lowercase) */
var BRAL={siri:['سيري','سيرى'],fresh:['فريش ليدي','فريش'],catchy:['كاتشي']};
var KB=[
 [['كام ساعه','مده اللبس','اسيب العدسه','ساعات اللبس','البس العدسه كام'],'مدة اللبس اليومية تتحدد حسب تعليمات الشركة المصنّعة ودكتور العيون. الأفضل ما تزيديش عن المدة المكتوبة على العلبة، وتريّحي عينك بنظارتك لما تقدري.'],
 [['انام','نوم','نايمه','انام بيها'],'ما يتنامش بالعدسات إلا لو العدسة مخصصة لكده وبتعليمات دكتورك. الأفضل تشيليها قبل النوم.'],
 [['تنضيف','انضف','تعقيم','احافظ','اخزن','محلول احط'],'العدسة الشهرية أو السنوية بتتنضف وتتحفظ في <b>محلول العدسات الجديد</b> كل مرة، ومن غير ميّة الحنفية. اغسلي إيدك قبل ما تلمسيها، وغيّري محلول العلبة كل يوم. وعندنا محاليل وعلب في قسم المحاليل.'],
 [['تنتهي','صلاحيه','انتهاء','اكسباير','expire'],'تاريخ الصلاحية مكتوب على العلبة. بعد فتح العدسة الشهرية/السنوية بتتحسب مدتها من أول استخدام، فاحترمي المدة المكتوبة.'],
 [['حمام','سباحه','بحر','ميه','مياه'],'تجنّبي ملامسة العدسات للميّه (حمام السباحة والبحر والدش) عشان العدوى. شيليها قبل ما تنزلي الميّه.'],
 [['مكياج','ميك اب','ميكاب','ماسكارا'],'البسي العدسات الأول وبعدين المكياج، وشيليها قبل إزالة المكياج. وتجنّبي حاجات ممكن تدخل العين.'],
 [['اول مره','مبتدئه','بحطها ازاي','احط العدسه','البس العدسه ازاي','اشيل العدسه'],'اغسلي إيدك كويس، حطي العدسة على طرف صباعك وتأكدي إنها مش مقلوبة، بصّي لفوق وحطيها بهدوء. وللشيل اغسلي إيدك وقرّصيها بلطف. لو أول مرة خدي رأي دكتورك.'],
 [['فرق','يوميه ولا شهريه','ايه الفرق'],'اليومية بتتلبس يوم واحد وترميها (أنظف وأسهل). الشهرية والسنوية بتتنضف وتتحفظ وتقتصد أكتر على المدى البعيد.'],
 [['اصليه','اورجينال','تقليد','ضمان'],'منتجاتنا أصلية. لو في عيب صناعة بنبدّلها حسب سياسة الاسترجاع.'],
 [['مقاس','قطر','bc','كورف'],'العدسات التجميلية بمقاس قياسي مناسب لأغلب العيون. لو عندك حالة خاصة أو بتلبسي عدسة طبية، استشيري دكتور عيون.'],
 [['بدون نظر','plano','من غير نظر','تجميليه'],'اللي بنعرضه في الغالب عدسات تجميلية من غير قوة نظر (بتغيّر اللون بس). لو محتاجة قوة نظر، اختاري اللون وهتلاقي الدرجات المتاحة في صفحة المنتج.']
];
function kbAns(t){for(var i=0;i<KB.length;i++){if(has(t,KB[i][0]))return KB[i][1]}return null}
function priceRange(list){var p=list.map(function(x){return x.price}).filter(Boolean).sort(function(a,b){return a-b});return p.length?(p[0]===p[p.length-1]?CL.money(p[0]):'من '+CL.money(p[0])+' إلى '+CL.money(p[p.length-1])):''}
function brandsAns(){var m={};P.filter(inStock).forEach(function(x){(m[x.brand]=m[x.brand]||[]).push(x)});var ks=Object.keys(m);if(!ks.length)return null;return 'الماركات المتاحة دلوقتي:<br>'+ks.map(function(b){var cols={};m[b].forEach(function(x){cols[x.color]=1});return '• <b>'+e(b)+'</b>: '+Object.keys(cols).length+' لون، '+priceRange(m[b])}).join('<br>')}
function careAns(t){
 var want=has(t,['محلول','محاليل','تعقيم','سفر'])?'care':(has(t,['علبه','ملقاط','اكسسوار','اكسسوارات','حامل'])?'accessories':null);
 var L=P.filter(function(x){return (x.category==='care'||x.category==='accessories')&&x.state!=='out'&&(!want||x.category===want)});
 if(!L.length)return null;return L.slice(0,4)}
function stockAns(t){
 var r=find(t);if(!r.asked)return null;var all=P.filter(function(p){return p.category==='lenses'});
 var out=r.out;if(!out.length)return 'مفيش حاجة متاحة بالمواصفات دي حاليًا.';return null}
function find(t){
 var fam={},brands={},dur=null,max=null,eyes=null,list=P.filter(inStock);
 Object.keys(COLW).forEach(function(f){if(has(t,COLW[f]))fam[f]=1});
 P.forEach(function(p){var b=norm(p.brand);if(b.length>=3&&t.indexOf(b)>-1)brands[p.brand]=1;var al=BRAL[b.split(' ')[0]];if(al&&has(t,al))brands[p.brand]=1});
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
 if(has(t,['وجع','بتوجع','بتوجعني','احمرار','حمرا','دموع','=الم','تعب','حساسيه','التهاب','حرقان','رؤيه','ضبابي','دكتور','نظري ضعيف','تشخيص','مناسبه لعيني','عندي مشكله في عيني'])){
  say('لو حاسة بوجع أو احمرار أو زغللة، شيلي العدسات فورًا وروحي لدكتور عيون. أنا مش بقدر أشخّص أو أنصح طبيًا. وفي أي سؤال تاني عن الطلبات أو الألوان أنا موجودة.'+handoff());return}
 if(has(t,['فين طلبي','طلبي','اوردر','اورد','تتبع','الشحنه وصلت','وصل ولا لا','اوردري','رقم طلب'])){
  var L=CL.store.get('cl-last',null);ctx={};
  if(nums.length){nums.forEach(function(n){if(n.length>=10)ctx.phone=n;else if(n.length<=7)ctx.id=n})}
  else if(L&&L.id){ctx.id=String(L.id);if(L.phone)ctx.phone=String(L.phone)}
  if(ctx.id&&ctx.phone){trackSend();return}
  step='trk';say(ctx.id?'رقم طلبك '+e(ctx.id)+'. اكتبي رقم الموبايل اللي سجّلتي بيه.':'اكتبي رقم الطلب ورقم الموبايل اللي سجّلتي بيه.');return}
 if(has(t,['ارجاع','استرجاع','ارجع','استبدال','استبدل','بدل','عيب','مقطوعه','قطع','غلط','لون غلط','سياسه'])){
  say('الاستبدال أو الاسترجاع متاح لو في <b>عيب صناعة أو قطع</b> في العدسة، حتى لو اتفتحت. ولو اللون غلط يتغيّر <b>بشرط إن العدسة لسه مقفولة</b>. لازم تبلغينا خلال <b>'+e(S.returnWindow||'٤٨ ساعة')+'</b> من الاستلام.<br><a class="textlink" href="'+U.returns+'">السياسة كاملة</a>'+handoff());return}
 if(has(t,['البراندات','الماركات','ماركات','براندات','عندكم ايه','عندكم اي','انواع'])&&!find(t).asked){var ba=brandsAns();if(ba){say(ba+'<br><a class="textlink" href="'+U.catalog+'">شوفي كل المنتجات</a>',{chips:['عايزة أختار لون','في عروض؟','محاليل وإكسسوارات']});return}}
 if(has(t,['محلول','محاليل','تعقيم','علبه','ملقاط','اكسسوار','اكسسوارات','ماجيك','بوكس','حامل عدسات'])){var ca=careAns(t);if(ca){say('دي المحاليل والإكسسوارات المتاحة:<div class="as-cards">'+cards(ca)+'</div>',{chips:['عايزة أختار لون','في عروض؟']});return}}
 var kb=kbAns(t);if(kb){say(kb+'<br><span style="font-size:12px;color:#6a5662">دي معلومات عامة، ولأي حالة صحية استشيري دكتور عيون.</span>',{chips:MENU});return}
 if(has(t,['شحن','توصيل','مصاريف','بتوصلوا','يوصل','ياخد كام','بكام الشحن','محافظه','القاهره','الجيزه','اسكندريه','الصعيد','طنطا','المنصوره'])){say(shipAns(t));return}
 if(has(t,['دفع','كاش','فيزا','عند الاستلام','فودافون','انستاباي','كارت'])){say('الدفع <b>عند الاستلام فقط</b>، مفيش دفع أونلاين حاليًا.');return}
 if(has(t,['عرض','عروض','كوبون','خصم','تخفيض','اوفر','هديه','عجله'])){
  var oh='';try{oh=OFF.slice(0,4).map(function(o){var r=CL.rewardText(o,P);return '• <b>'+e(o.name)+'</b>'+(r?': '+e(r):'')+(o.minQty>0?' (من '+o.minQty+' عدسات)':'')}).join('<br>')}catch(x){}
  say((oh?'العروض الشغالة دلوقتي:<br>'+oh+'<br>':'مفيش عروض شغالة دلوقتي، بس تابعينا.<br>')+'وفي كمان عجلة الحظ على الموقع. العرض الواحد بيتطبق على الأوردر، والكوبون ممكن يتجمع معاه.<br><a class="textlink" href="'+U.offers+'">شوفي كل العروض</a>');return}
 if(has(t,['ساعات','مواعيد','شغالين','تواصل','رقم','واتس','موبايل','اكلم','كلم','موظف','حد'])){say('بنرد يوميًا '+e(S.hours||'من ١٠ صباحًا إلى ١٠ مساءً')+'.'+handoff());return}
 if(has(t,['جرب','تجربه','تجربة','اجرب','كاميرا','ع وشي','على وشي'])){say('تقدري تجرّبي الألوان على وشك بالكاميرا أو بصورة من صفحة <a class="textlink" href="'+U.tryon+'">جرّبي اللون</a>.');return}
 if(has(t,['مرحبا','اهلا','هاي','السلام','صباح','مساء','hello','hi'])&&t.length<24){say('أهلاً بيكي! أنا '+BOT+'. أقدر أساعدك تختاري لون، أجاوبك عن الشحن والاسترجاع، أو أتابع طلبك.',{chips:MENU});return}
 if(has(t,['شكرا','تسلم','ميرسي','thanks'])){say('العفو! لو احتاجتي أي حاجة أنا هنا.');return}
 if(has(t,['اختار','لون','الوان','عدسه','عدسات','رشح','اقترح','ترشيح','عايزه','محتاجه','عاوزه','ارخص','احسن','مناسب','مقاس','نظر','باور','قوه','درجه','يوميه','شهريه'])||find(t).asked){
  var r=find(t);
  if(has(t,['نظر','باور','قوه','درجه','مقاس'])&&!r.asked){say('لو محتاجة عدسة بقوة نظر، اختاري اللون وهتلاقي درجات القوة المتاحة لكل عين في صفحة المنتج، وبنجهّزها من المورد وممكن تاخد وقت أكتر. تحبي أرشّحلك لون؟',{chips:['رشّحيلي لون','عدسات يومية','عدسات شهرية']});return}
  if(r.out.length&&has(t,['بكام','سعر','اسعار','كام'])){var pr=priceRange(r.out);if(pr)r.note='الأسعار '+pr+'. '}
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
function send(t,v){t=String(t||'').trim();if(!t)return;if(!v&&!viaVoice)viaVoice=false;me(t);setTimeout(function(){reply(t);viaVoice=false},280)}
function open(){
 if(box){box.hidden=false;return}
 box=document.createElement('section');box.className='as';box.setAttribute('role','dialog');box.setAttribute('aria-label',BOT);
 box.innerHTML='<header><b>'+BOT+'</b><span>بنرد فورًا</span>'+((TTS||ttsUrl())?'<button type="button" data-asv class="as-spk" aria-pressed="false" title="الصوت مقفول"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg></button>':'')+'<button type="button" data-asx aria-label="إغلاق">'+I('close')+'</button></header><div class="as-msgs" aria-live="polite"></div><form class="as-in">'+(SR?'<button type="button" class="as-mic" aria-label="اتكلمي" title="اتكلمي"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>':'')+'<input type="text" placeholder="اكتبي سؤالك..." autocomplete="off" aria-label="اكتبي سؤالك"><button type="submit" aria-label="إرسال">'+I('chat')+'</button></form>';
 document.body.appendChild(box);
 box.addEventListener('click',function(ev){var t=ev.target,c=t.closest&&t.closest('[data-ac]');if(c){send(c.dataset.ac);return}if(t.closest&&t.closest('[data-asx]'))box.hidden=true});
 box.querySelector('form').addEventListener('submit',function(ev){ev.preventDefault();unlock();var i=ev.target.querySelector('input');viaVoice=false;send(i.value);i.value=''});
 box.addEventListener('click',function(ev){var t=ev.target;unlock();if(t.closest&&t.closest('.as-mic'))micToggle();var sp=t.closest&&t.closest('[data-asv]');if(sp){voiceOn=!voiceOn;try{CL.store.set('cl-voice',voiceOn)}catch(x){}sp.classList.toggle('on',voiceOn);sp.setAttribute('aria-pressed',voiceOn);sp.title=voiceOn?'الصوت شغال':'الصوت مقفول';if(!voiceOn&&TTS)TTS.cancel();else if(voiceOn)speak('تمام، هرد عليكي بالصوت')}if(t.closest&&t.closest('[data-asx]')){stopAll()}});
 say('أهلاً بيكي في Catchy Lens! أنا '+BOT+'. أقدر أرشّحلك لون من المتاح دلوقتي، أجاوبك عن الشحن والاسترجاع، أو أتابع طلبك.',{chips:MENU});
}
CL.assistant={open:function(){var d=CL.ui.data();S=d.S||{};P=d.P||[];try{CL.data.offers().then(function(o){OFF=o||[]})}catch(x){}try{voiceOn=false}catch(x){}open();if(TTS&&!VOICE){VOICE=pickVoice();if(TTS.onvoiceschanged!==undefined)TTS.onvoiceschanged=function(){VOICE=pickVoice()}}var i=box.querySelector('input');if(i)setTimeout(function(){i.focus()},50)}};
})();
