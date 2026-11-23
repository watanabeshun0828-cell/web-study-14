// Only educational HTML/CSS is rendered. No learner code is inserted into the parent DOM.
export function safePreview(html:string,css:string){
 const doc=new DOMParser().parseFromString(html,'text/html')
 const embeddedCSS=[...doc.querySelectorAll('style')].map(style=>style.textContent??'').join('\n')
 const allowed=new Set(['SECTION','ARTICLE','HEADER','FOOTER','MAIN','NAV','DIV','SPAN','P','H1','H2','H3','UL','OL','LI','TABLE','THEAD','TBODY','TR','TH','TD','CAPTION','A','IMG','STRONG','EM','LABEL','INPUT','BUTTON','BR','SMALL'])
 for(const el of [...doc.body.querySelectorAll('*')]){
  if(!allowed.has(el.tagName)){el.remove();continue}
  for(const attr of [...el.attributes]){
   const permitted=['class','id','alt','title','scope','for','type','value','placeholder','width','height'].includes(attr.name)||(attr.name==='href'&&/^#[\w-]*$/.test(attr.value))||(attr.name==='src'&&/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(attr.value))
   if(!permitted)el.removeAttribute(attr.name)
  }
 }
 const safeCSS=(embeddedCSS+'\n'+css).replace(/@import[^;]*;?/gi,'').replace(/url\s*\([^)]*\)/gi,'none').replace(/<\/?style[^>]*>/gi,'')
 return '<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'none\'; connect-src \'none\'; img-src data:; style-src \'unsafe-inline\'; form-action \'none\'; base-uri \'none\'"><style>body{font-family:system-ui,sans-serif;padding:18px;color:#233c46;background:#fff;line-height:1.8}img{max-width:100%}'+safeCSS+'</style></head><body>'+doc.body.innerHTML+'</body></html>'
}
