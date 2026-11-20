(function(){
var CL=window.CL,U=CL.url,I=CL.icon,e=CL.esc;
var k=new URLSearchParams(CL.qs()).get('p')||'wishlist';
var DUR=[['daily','يومية'],['monthly','شهرية'],['quarterly','٣ شهور'],['semiannual','٦ شهور'],['yearly','سنوية']];
Promise.all([CL.data.catalog(),CL.data.settings()]).then(function(r){
 var P=r[0]||[];CL.ui.init(r[1],P);
 var T={wishlist:'المفضلة',quiz:'اعثري على عدستك',tryon:'جرّبي اللون'};document.title=(T[k]||'')+' | Catchy Lens';
 var a=document.getElementById('app');a.removeAttribute('aria-busy');
 a.innerHTML=CL.ui.header()+'<main id="main" class="wrap"><div id="x"></div></main>'+CL.ui.footer();
 CL.ui.bind();
 var x=document.getElementById('x');
 ({wishlist:wish,quiz:quiz,tryon:tryon}[k]||wish)(x,P,r[1]);
});
function grid(l){return '<div class="products">'+l.map(CL.ui.card).join('')+'</div>'}
function empty(h,p){return '<div class="section-empty">'+I('lens')+'<h3>'+h+'</h3><p>'+p+'</p><a class="btn" href="'+U.catalog+'">شوفي المنتجات</a></div>'}
/* wishlist */
function wish(x,P){
 var ids=CL.wish.list(),l=P.filter(function(p){return ids.indexOf(p.id)>-1});
 x.innerHTML='<h1>المفضلة</h1>'+(l.length?'<p class="lead">'+l.length+' منتج حفظتيهم.</p>'+grid(l):empty('مفيش حاجة في المفضلة لسه','دوسي على القلب في أي منتج وهيتحفظ هنا.'));
}
/* quiz */
function quiz(x,P){
 var L=P.filter(function(p){return p.category==='lenses'&&p.state!=='out'});
 if(!L.length){x.innerHTML='<h1>اعثري على عدستك</h1>'+empty('العدسات هتتوفر قريب','لسه مفيش عدسات متاحة.');return}
 var names=[],seen={};L.forEach(function(p){var n=p.name;if(!seen[n]){seen[n]=1;names.push(n)}});
 var durs=DUR.filter(function(d){return L.some(function(p){return p.duration===d[0]})});
 var prices=L.map(function(p){return p.price||0}).filter(Boolean).sort(function(a,b){return a-b}),mid=prices.length?prices[Math.floor(prices.length/2)]:0;
 var Q=[
  {id:'power',t:'بتستخدمي عدسات بقوة نظر؟',o:[['plano','لا، عدسات ملونة بس'],['power','آه، عندي قوة نظر']]},
  {id:'dur',t:'عايزة العدسة تفضل معاكي قد إيه؟',o:durs.concat([['any','مش فارق']])},
  {id:'budget',t:'ميزانيتك للعدسة؟',o:[['low','اقتصادي'],['mid','متوسط'],['any','مش فارق']]},
  {id:'color',t:'أي لون لفت نظرك؟',o:names.slice(0,14).map(function(n){return [n,n]}).concat([['any','مش فارق']])}
 ],A={},i=0;
 function show(){
  if(i>=Q.length)return res();
  var q=Q[i];
  x.innerHTML='<h1>اعثري على عدستك</h1><p class="lead">سؤال '+(i+1)+' من '+Q.length+'</p><h2>'+e(q.t)+'</h2><div class="chips">'+q.o.map(function(o){return '<button type="button" class="chip" data-a="'+e(o[0])+'">'+e(o[1])+'</button>'}).join('')+'</div>'+(i?'<button type="button" class="textlink" data-back>رجوع</button>':'');
 }
 function res(){
  var l=L.filter(function(p){
   if(A.power==='power'&&p.powerType!=='both')return false;
   if(A.dur&&A.dur!=='any'&&p.duration!==A.dur)return false;
   if(A.budget==='low'&&p.price>mid)return false;
   if(A.budget==='mid'&&p.price<mid*0.6)return false;
   return true});
  var best=l.filter(function(p){return A.color==='any'||p.name===A.color}),rest=l.filter(function(p){return best.indexOf(p)<0});
  var list=best.concat(rest).slice(0,8);
  x.innerHTML='<h1>اخترنالك</h1>'+(list.length?'<p class="lead">دي أقرب عدسات لاختياراتك.</p>'+grid(list):empty('مفيش اختيار مطابق تمامًا','جرّبي تغيّري إجاباتك أو شوفي كل المنتجات.'))+'<p><button type="button" class="btn alt" data-again>ابدئي من الأول</button></p>';
 }
 x.onclick=function(ev){
  var t=ev.target.closest('button');if(!t)return;
  if(t.dataset.a!=null){A[Q[i].id]=t.dataset.a;i++;show()}
  else if(t.hasAttribute('data-back')){i--;show()}
  else if(t.hasAttribute('data-again')){A={};i=0;show()}
 };
 show();
}
/* try colors: camera try-on lives in tryon.js */
function tryon(x,P,S){CL.tryon.mount(x,P,S)}
})();
