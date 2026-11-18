/* Catchy Lens runtime config. TEST project values (publishable key is public by design).
   mode: 'demo' = data/demo.json only | 'live' = products/settings from Supabase, banners/content still from demo.json */
(function(){
var CL=window.CL;
CL.config.mode='live';
CL.config.supabaseUrl='https://dyxyjslpbpabfpdppsue.supabase.co';
CL.config.anonKey='sb_publishable_ZBUimKgT3pGso9rmsthZRQ_b0iKjKhp';
CL.config.fnUrl=CL.config.supabaseUrl+'/functions/v1/store-api';
})();
