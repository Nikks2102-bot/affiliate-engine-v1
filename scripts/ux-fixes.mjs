import fs from 'node:fs';

const sourcePath = 'src/index.ts';
let source = fs.readFileSync(sourcePath, 'utf8');
const marker = '/* NIKKSORA_UX_V2 */';

const match = source.match(/const NIKKSORA_LANDING_TEMPLATE=("(?:\\.|[^"\\])*");/);
if (!match) throw new Error('NIKKSORA landing template not found');

let landing = JSON.parse(match[1]);
if (landing.includes(marker)) {
  console.log('NIKKSORA UX v2 already applied');
  process.exit(0);
}

const css = `<style>${marker}
/* UX v2 — responsive desktop/mobile + complete theme system */
html{overflow-x:hidden}
body{min-width:320px;overflow-x:hidden}
.topbar{height:82px}
.nav-inner{position:relative}
.topbar nav{align-items:stretch;align-self:stretch}
.topbar nav a{display:flex;align-items:center;padding:0 2px;border-bottom:2px solid transparent;transition:color .2s,border-color .2s}
.topbar nav a.active{border-bottom-color:var(--green);color:var(--text)}
.hero-bg{background:radial-gradient(circle at 75% 40%,#2d454d 0,transparent 31%),linear-gradient(100deg,#050707 0%,#070a0b 40%,#172326 100%)}

/* Light mode: every major section and the hero artwork are intentionally redesigned. */
html[data-theme="light"] body{background:radial-gradient(circle at 75% 5%,#dff8e8 0,transparent 34%),#f6f9f7;color:#101513}
html[data-theme="light"] .topbar{background:#ffffffee;border-bottom:1px solid #d9e1dc}
html[data-theme="light"] .topbar nav a{color:#39443f}
html[data-theme="light"] .topbar nav a.active{color:#101513;border-bottom-color:#16a34a}
html[data-theme="light"] .theme-toggle{background:#f4f7f5;color:#17211c;border-color:#cdd7d1}
html[data-theme="light"] .btn-outline{background:#fff;color:#17211c;border-color:#c8d2cd}
html[data-theme="light"] .hero{background:#f6f9f7}
html[data-theme="light"] .hero-bg{background:radial-gradient(circle at 76% 35%,#d8efe1 0,transparent 35%),linear-gradient(100deg,#f8faf9 0%,#eef4f1 55%,#e4ece8 100%)}
html[data-theme="light"] .hero-copy>p{color:#52605a}
html[data-theme="light"] h1 em{color:#65716c}
html[data-theme="light"] .trust-row{color:#58645f}
html[data-theme="light"] .hero-art{background:linear-gradient(135deg,#edf4f1,#dce7e2);border-left-color:#ccd7d1;box-shadow:inset 0 0 0 1px #fff,0 25px 65px #58706618}
html[data-theme="light"] .window-light{background:linear-gradient(90deg,#fff9,#dce8e330)}
html[data-theme="light"] .wall-frame{background:#f7faf9;color:#34403a;border-color:#d8dfdc;box-shadow:0 10px 30px #53645d20}
html[data-theme="light"] .desk{background:linear-gradient(#d8e1dd,#bfcac5)}
html[data-theme="light"] .screen{background:linear-gradient(135deg,#fbfdfc,#dce7e2);border-color:#c3cfca;box-shadow:0 20px 40px #43534d24}
html[data-theme="light"] .n-logo{color:#17211d}
html[data-theme="light"] .base{background:linear-gradient(#aebbb5,#e9efec)}
html[data-theme="light"] .pen{background:#687671}
html[data-theme="light"] .book{background:#f8fbfa;color:#53605b;border:1px solid #c8d2ce}
html[data-theme="light"] .mug{background:linear-gradient(145deg,#fff,#e8efec);color:#26312c;border-color:#aebbb5;box-shadow:0 10px 25px #53645d25}
html[data-theme="light"] .mug:after{border-color:#9daaa4}
html[data-theme="light"] .services{background:#f7faf8;border-color:#d8e0dc}
html[data-theme="light"] .service-grid article{border-color:#d8e0dc}
html[data-theme="light"] .service-icon{color:#138c4b}
html[data-theme="light"] .service-grid h3{color:#17211d}
html[data-theme="light"] .service-grid p{color:#66716c}
html[data-theme="light"] .offers{background:#f7faf8}
html[data-theme="light"] .offer{background:linear-gradient(145deg,#e8fff0,#d5f6e2);border-color:#83d7a3;box-shadow:0 18px 45px #3d765418}
html[data-theme="light"] .offer.featured{background:linear-gradient(145deg,#dffbea,#c9f4d9);border-color:#36bb6d;box-shadow:0 18px 45px #3d765420}
html[data-theme="light"] .offer h2{color:#101a15}
html[data-theme="light"] .offer p,html[data-theme="light"] .offer ul{color:#4f5d56}
html[data-theme="light"] .pill{background:#f2faf5;border-color:#a8c7b5;color:#42544a}
html[data-theme="light"] .green-pill{background:#d6f8e2;border-color:#37b86d;color:#147341}
html[data-theme="light"] .offer li:before{background:#38d979;color:#06351b}
html[data-theme="light"] .offer:not(.featured) li:before{background:#f2faf5;color:#147341;border:1px solid #b7cec0}
html[data-theme="light"] .offer .btn-dark{background:#f7fbf9;color:#17211d;border-color:#a9bbb3}
html[data-theme="light"] .offer .btn-whatsapp{background:linear-gradient(100deg,#ffffff,#b8ffd1);color:#06130b}
html[data-theme="light"] .note{background:#e9f7efdd;border-color:#8db7a0;color:#385144}
html[data-theme="light"] .doc-graphic{border-color:#91a49b;color:#53625b}
html[data-theme="light"] .stats{background:#ffffff;border-color:#d8e0dc}
html[data-theme="light"] .stats article{border-color:#d8e0dc}
html[data-theme="light"] .stats strong{color:#17211d}
html[data-theme="light"] .stats span{color:#66716c}
html[data-theme="light"] .testimonial{background:#f7faf8}
html[data-theme="light"] .quote-label{color:#66716c}
html[data-theme="light"] .quote{background:linear-gradient(100deg,#fff,#edf5f1,#fff);border-color:#d1dbd6;box-shadow:0 15px 40px #53645d12}
html[data-theme="light"] .quote p{color:#28342e}
html[data-theme="light"] .quote small{color:#64706a}
html[data-theme="light"] .arrow{background:#fff;color:#17211d;border-color:#b9c5bf}
html[data-theme="light"] .cta-strip{background:linear-gradient(100deg,#eaf8ef,#f8fbfa);border-color:#d2ddd7}
html[data-theme="light"] .cta-inner h2{color:#15201a}
html[data-theme="light"] .cta-inner p{color:#617069}
html[data-theme="light"] footer{background:#ffffff;border-color:#d8e0dc}
html[data-theme="light"] .footer-links a,html[data-theme="light"] .footer-right{color:#53605a}
html[data-theme="light"] .footer-right{border-color:#ccd7d1}

/* Desktop polish */
@media(min-width:901px){
  .hero-grid{grid-template-columns:1.03fr .97fr;gap:0}
  .hero-copy{padding-right:30px}
  .hero-art{border-radius:0 0 0 0}
}

/* Mobile is a purpose-built interface, not a shrunken desktop page. */
.mobile-menu-button{display:none}
.mobile-menu{display:none}
@media(max-width:900px){
  .topbar{height:70px}
  .nav-inner{gap:12px}
  .brand-copy strong{font-size:15px}
  .brand-mark{width:34px;height:34px;font-size:20px}
  .topbar nav{display:none}
  .nav-actions{margin-left:auto}
  .nav-actions .btn-outline{display:none}
  .theme-toggle{width:68px;height:36px}
  .mobile-menu-button{display:grid;place-items:center;width:42px;height:38px;border:1px solid var(--line);border-radius:12px;background:var(--panel);color:var(--text);font-size:22px;cursor:pointer}
  .mobile-menu{position:absolute;display:flex;flex-direction:column;gap:4px;left:0;right:0;top:70px;padding:12px 16px;background:color-mix(in srgb,var(--bg) 94%,transparent);border-bottom:1px solid var(--line);backdrop-filter:blur(20px);transform:translateY(-130%);opacity:0;pointer-events:none;transition:.25s;z-index:49}
  .mobile-menu.open{transform:translateY(0);opacity:1;pointer-events:auto}
  .mobile-menu a{padding:15px 14px;border-radius:12px;color:var(--text);font-weight:750}
  .mobile-menu a.active{background:color-mix(in srgb,var(--green) 15%,transparent);color:var(--green)}
  .hero-grid{grid-template-columns:1fr;min-height:auto}
  .hero-copy{padding:52px 0 22px}
  .hero-art{height:340px;border-left:0;border-top:1px solid var(--line);border-radius:0}
  .hero-actions{gap:10px}
  .hero-actions .btn{flex:1;min-width:190px}
  .trust-row{gap:12px 18px}
  .offer-grid{grid-template-columns:1fr}
  .stats-grid{grid-template-columns:1fr 1fr}
  .footer-inner{grid-template-columns:1fr 1fr}
}
@media(max-width:560px){
  .container{width:calc(100% - 28px)}
  .hero-copy{padding-top:36px}
  h1{font-size:clamp(43px,13vw,54px);line-height:.97}
  .hero-copy>p{font-size:17px}
  .hero-actions{display:grid;grid-template-columns:1fr}
  .hero-actions .btn{width:100%;min-width:0}
  .trust-row{font-size:11px}
  .hero-art{height:300px}
  .laptop{width:68%;height:220px;right:16%;bottom:19%}
  .mug{transform:scale(.82);transform-origin:bottom right;right:2%;bottom:17%}
  .wall-frame{transform:scale(.78);transform-origin:top right}
  .offer{padding:24px;min-height:350px}
  .offer h2{font-size:26px}
  .offer-graphic{right:8px;opacity:.6}
  .offer-actions{display:grid;grid-template-columns:1fr}
  .offer-actions .btn,.offer-actions .btn-whatsapp{width:100%;min-width:0}
  .stats-grid{grid-template-columns:1fr}
  .stats article{grid-template-columns:42px 1fr}
  .quote-wrap{grid-template-columns:34px 1fr 34px;gap:5px}
  .quote{padding:16px 12px}
  .quote p{font-size:14px}
  .cta-inner{display:grid;grid-template-columns:35px 1fr;gap:10px;padding:20px 0}
  .cta-inner .btn{grid-column:1/-1;width:100%;margin:4px 0 0}
  .footer-inner{grid-template-columns:1fr}
  .footer-links{flex-wrap:wrap;gap:15px}
  .footer-right{border-left:0;border-top:1px solid var(--line);padding:15px 0 0}
  html[data-theme="light"] .mobile-menu{background:#ffffffee}
}
</style>`;

const js = `<script>
(()=>{
  const root=document.documentElement;
  const toggle=document.getElementById('themeToggle');
  const saved=localStorage.getItem('nikksora-theme');
  root.dataset.theme=saved==='light'?'light':'dark';
  toggle?.addEventListener('click',()=>{
    const next=root.dataset.theme==='light'?'dark':'light';
    root.dataset.theme=next;
    localStorage.setItem('nikksora-theme',next);
  });

  const navLinks=[...document.querySelectorAll('.topbar nav a')];
  const mobileBtn=document.createElement('button');
  mobileBtn.className='mobile-menu-button';
  mobileBtn.type='button';
  mobileBtn.setAttribute('aria-label','Open menu');
  mobileBtn.setAttribute('aria-expanded','false');
  mobileBtn.innerHTML='☰';
  document.querySelector('.nav-actions')?.prepend(mobileBtn);
  const menu=document.createElement('div');
  menu.className='mobile-menu';
  const items=[['Home','#home'],['Services','#services'],['About','#about'],['Contact','#contact']];
  menu.innerHTML=items.map(([label,href])=>'<a href="'+href+'">'+label+'</a>').join('');
  document.querySelector('.topbar')?.appendChild(menu);
  const mobileLinks=[...menu.querySelectorAll('a')];
  const closeMenu=()=>{menu.classList.remove('open');mobileBtn.setAttribute('aria-expanded','false');mobileBtn.innerHTML='☰'};
  mobileBtn.addEventListener('click',()=>{const open=!menu.classList.contains('open');menu.classList.toggle('open',open);mobileBtn.setAttribute('aria-expanded',String(open));mobileBtn.innerHTML=open?'×':'☰'});
  mobileLinks.forEach(a=>a.addEventListener('click',closeMenu));

  const sections=[...document.querySelectorAll('main section[id]')];
  const setActive=id=>{
    navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+id));
    mobileLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+id));
  };
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible) setActive(visible.target.id);
    },{rootMargin:'-28% 0px -58% 0px',threshold:[0,.15,.4,.7]});
    sections.forEach(s=>observer.observe(s));
  }
  navLinks.forEach(a=>a.addEventListener('click',()=>setActive(a.getAttribute('href').slice(1))));

  const quoteData=[
    ['“NIKKSORA helped us get consistent enquiries through Meta Ads.<br>The process was simple, and the results were real.”','Small Business Owner','Hyderabad'],
    ['“The audit gave us a clear direction instead of another complicated marketing plan.”','Local Business Owner','Warangal'],
    ['“The WhatsApp-first approach made it much easier for interested customers to reach us.”','Business Owner','Telangana'],
    ['“Simple steps, clear communication and a much cleaner enquiry process.”','Small Business Owner','Hyderabad']
  ];
  const quote=document.querySelector('.quote');
  let quoteIndex=0;
  const renderQuote=()=>{if(!quote)return;const [text,role,city]=quoteData[quoteIndex];quote.querySelector('p').innerHTML=text;quote.querySelector('small').innerHTML=role+' &nbsp; • &nbsp; '+city;quote.querySelectorAll('.dots i').forEach((d,i)=>d.classList.toggle('selected',i===quoteIndex));};
  document.querySelector('.quote-wrap .arrow:first-child')?.addEventListener('click',()=>{quoteIndex=(quoteIndex+quoteData.length-1)%quoteData.length;renderQuote()});
  document.querySelector('.quote-wrap .arrow:last-child')?.addEventListener('click',()=>{quoteIndex=(quoteIndex+1)%quoteData.length;renderQuote()});
  document.querySelectorAll('.dots i').forEach((d,i)=>d.addEventListener('click',()=>{quoteIndex=i;renderQuote()}));
})();
</script>`;

// Replace the existing final script with the improved interaction layer and append UX overrides.
landing = landing.replace(/<script>[\\s\\S]*?<\/script>\s*$/, `${js}`);
landing = landing.replace('</style>', '</style>');
landing += css;

const newDecl = `const NIKKSORA_LANDING_TEMPLATE=${JSON.stringify(landing)};`;
source = source.replace(match[0], newDecl);
fs.writeFileSync(sourcePath, source);
console.log('NIKKSORA UX v2 applied: responsive desktop/mobile, active navigation, mobile menu, full light mode, interactive testimonial');
