import fs from 'node:fs';

const sourcePath = 'src/index.ts';
const templatePath = 'src/landing.html';
let source = fs.readFileSync(sourcePath, 'utf8');
let landing = fs.readFileSync(templatePath, 'utf8');

// Premium UI patch. The base template keeps the demo structure; this layer
// makes the theme genuinely light/dark and adds reliable navigation state.
const lightMode = `<style>
html[data-theme="light"] body{background:#f5f7f6!important;color:#111715!important}
html[data-theme="light"] .topbar{background:#ffffffef!important;border-bottom-color:#d9e0dc!important}
html[data-theme="light"] .topbar nav a{color:#53605a!important}
html[data-theme="light"] .topbar nav a.active,html[data-theme="light"] .topbar nav a:hover{color:#111715!important;border-color:#159b52!important}
html[data-theme="light"] .theme-toggle{background:#fff!important;color:#18201c!important;border-color:#cbd5d0!important}
html[data-theme="light"] .btn-outline{color:#18201c!important;border-color:#bcc8c2!important;background:#fff!important}
html[data-theme="light"] .hero{background:#f0f4f2!important}
html[data-theme="light"] .hero-bg{background:radial-gradient(circle at 78% 20%,#d5e7dc 0,transparent 38%),linear-gradient(100deg,#f6f8f7 0%,#eef3f0 52%,#dfe8e3 100%)!important}
html[data-theme="light"] .hero-copy>p{color:#4f5b56!important}
html[data-theme="light"] .hero h1 em{color:#68746f!important}
html[data-theme="light"] .trust-row{color:#56625c!important}
html[data-theme="light"] .hero-art{background:linear-gradient(125deg,#e3ebe7,#f8faf9 52%,#d6e1db)!important;border-color:#ccd7d1!important;box-shadow:0 25px 60px #5669601c!important}
html[data-theme="light"] .window-light{background:linear-gradient(90deg,#fff8,#d8e4de88)!important}
html[data-theme="light"] .wall-frame{border-color:#d4ddd8!important;background:#fff9!important;color:#53605a!important;box-shadow:0 10px 30px #596a6120!important}
html[data-theme="light"] .desk{background:linear-gradient(#c5d0cb,#e9efec)!important}
html[data-theme="light"] .laptop .screen{background:linear-gradient(135deg,#f8fbfa,#dce7e2)!important;border-color:#b9c8c0!important;box-shadow:0 20px 45px #4f625820!important}
html[data-theme="light"] .n-logo{color:#18221d!important}
html[data-theme="light"] .laptop .base{background:linear-gradient(#aebbb5,#eef3f1)!important}
html[data-theme="light"] .pen{background:#67736e!important}
html[data-theme="light"] .book{background:#fff!important;color:#53605a!important;border-color:#cbd6d0!important}
html[data-theme="light"] .mug{background:#fff!important;color:#26312c!important;border-color:#c1cec7!important;box-shadow:0 15px 30px #53645d20!important}
html[data-theme="light"] .mug:after{border-color:#aab7b1!important}
html[data-theme="light"] .services{background:#fff!important;border-color:#d8dfdc!important}
html[data-theme="light"] .service-grid article{border-color:#d8dfdc!important}
html[data-theme="light"] .service-grid h3{color:#18211d!important}
html[data-theme="light"] .service-grid p{color:#66716c!important}
html[data-theme="light"] .offers{background:#f5f7f6!important}
html[data-theme="light"] .offer{background:linear-gradient(145deg,#fff,#f0f4f2)!important;border-color:#cfd9d4!important;box-shadow:0 15px 40px #4d615712!important}
html[data-theme="light"] .offer.featured{background:radial-gradient(circle at 85% 75%,#b9f5cf 0,transparent 31%),linear-gradient(145deg,#effbf4,#fff)!important;border-color:#36ae6b!important}
html[data-theme="light"] .offer p,html[data-theme="light"] .offer ul{color:#56625c!important}
html[data-theme="light"] .offer h2{color:#15201b!important}
html[data-theme="light"] .pill{background:#edf4f0!important;border-color:#cbd8d1!important;color:#53605a!important}
html[data-theme="light"] .green-pill{background:#e3faeb!important;color:#0b7d3d!important;border-color:#65c98e!important}
html[data-theme="light"] .offer li:before{background:#16a85a!important;color:#fff!important}
html[data-theme="light"] .offer:not(.featured) li:before{background:#dce5e0!important;color:#187541!important}
html[data-theme="light"] .btn-dark{background:#fff!important;color:#18211d!important;border-color:#c7d1cc!important}
html[data-theme="light"] .stats{background:#fff!important;border-color:#d8dfdc!important}
html[data-theme="light"] .stats article{border-color:#d8dfdc!important}
html[data-theme="light"] .stats span{color:#68736e!important}
html[data-theme="light"] .testimonial{background:#f5f7f6!important}
html[data-theme="light"] .quote-label{color:#68736e!important}
html[data-theme="light"] .quote{background:linear-gradient(100deg,#fff,#eef3f0,#fff)!important;border-color:#d2dbd6!important;box-shadow:0 15px 45px #52645b12!important}
html[data-theme="light"] .quote p{color:#26312c!important}
html[data-theme="light"] .quote small{color:#68736e!important}
html[data-theme="light"] .arrow{color:#18211d!important;border-color:#bdc9c3!important}
html[data-theme="light"] .cta-strip{background:linear-gradient(100deg,#fff,#edf4f0)!important;border-color:#d5ded9!important}
html[data-theme="light"] .cta-inner p{color:#66716c!important}
html[data-theme="light"] footer{background:#fff!important;border-color:#d8dfdc!important}
html[data-theme="light"] .footer-right{color:#33403a!important;border-color:#cbd5d0!important}
html[data-theme="light"] .footer-links{color:#56625c!important}
html[data-theme="light"] .footer-links a:hover{color:#101815!important}
html[data-theme="light"] .mobile-menu{background:#fff!important;border-color:#d8dfdc!important}
html[data-theme="light"] .mobile-menu a{color:#53605a!important}
html[data-theme="light"] .mobile-menu a.active{background:#edf5f0!important;color:#111715!important}
</style>`;

// The injected template is a fragment, so explicitly add the viewport metadata to
// the document returned by the Worker. Without it mobile Safari can keep a desktop
// layout viewport and never trigger the mobile breakpoints.
landing = landing.replace('</style>\n<script>', `</style>${lightMode}\n<script>`);

const responsive = `<style>
html{overflow-x:hidden}body{overflow-x:hidden}
@media(max-width:980px){.container{width:min(100% - 36px,760px)}.topbar{height:72px}.topbar nav{display:none}.hero-grid{grid-template-columns:1fr;min-height:auto}.hero-copy{padding:48px 0 24px}.hero-art{height:420px;border-left:0;border-top:1px solid #ffffff12}.hero-copy>p{font-size:18px;max-width:650px}h1{font-size:clamp(46px,8vw,70px)}.service-grid{grid-template-columns:1fr 1fr}.service-grid article{border-bottom:1px solid #ffffff10}.service-grid article:nth-child(2n){border-right:0}.offer-grid{grid-template-columns:1fr}.stats-grid{grid-template-columns:1fr 1fr}.footer-inner{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.container{width:calc(100% - 28px)}.topbar{height:64px}.brand-mark{width:32px;height:32px;font-size:19px}.brand-copy strong{font-size:14px;letter-spacing:.22em}.brand-copy small{font-size:6px;letter-spacing:.3em}.nav-actions .btn{display:none}.theme-toggle{width:70px;height:36px}.hero-copy{padding:38px 0 18px}.eyebrow{font-size:9px;letter-spacing:.22em}h1{font-size:clamp(42px,12vw,56px);line-height:.98;margin:16px 0}.hero-copy>p{font-size:16px;line-height:1.45}.hero-actions{flex-direction:column;align-items:stretch;margin:21px 0}.hero-actions .btn{width:100%}.trust-row{gap:10px;font-size:10px}.hero-art{height:300px}.laptop{width:65%;height:190px;right:18%;bottom:19%}.n-logo{font-size:45px}.mug{width:75px;height:88px;font-size:7px;padding:20px 10px;bottom:17%}.mug:after{right:-19px;width:24px;height:43px;border-width:5px;border-left:0}.book{height:36px;font-size:6px;padding:7px 10px}.pen{width:145px;right:20%;bottom:14%;height:5px}.service-grid,.stats-grid{grid-template-columns:1fr}.service-grid article{border-right:0!important}.offer{padding:22px;min-height:0}.offer h2{font-size:25px}.offer p{font-size:14px}.offer-graphic{opacity:.42;right:8px;bottom:58px}.offer-actions{flex-direction:column;gap:10px}.offer-actions .btn,.offer-actions .btn-whatsapp,.full{width:100%;min-width:0}.stats article{border-right:0!important}.quote-wrap{grid-template-columns:34px 1fr 34px;gap:4px}.quote{padding:16px 12px}.quote p{font-size:13px}.arrow{width:34px;height:34px;font-size:24px}.cta-inner{padding:20px 0;flex-wrap:wrap}.cta-inner .btn{width:100%;margin-left:0;min-width:0}.footer-inner{grid-template-columns:1fr}.footer-links{flex-wrap:wrap;gap:16px}}
</style>`;
landing = landing.replace('</head>', `${responsive}</head>`);

// Add a compact mobile hamburger menu. Desktop keeps the demo's centered navigation.
const mobileMenu = `<button class="mobile-menu-btn" id="mobileMenuBtn" type="button" aria-label="Open menu">☰</button><div class="mobile-menu" id="mobileMenu"><a href="#home">Home</a><a href="#services">Services</a><a href="#about">About</a><a href="#contact">Contact</a></div><style>.mobile-menu-btn{display:none}.mobile-menu{display:none}@media(max-width:980px){.mobile-menu-btn{display:grid;place-items:center;width:42px;height:38px;border:1px solid #697370;border-radius:12px;background:transparent;color:var(--text);font-size:20px;cursor:pointer}.mobile-menu{position:fixed;right:18px;top:76px;z-index:100;width:190px;padding:8px;border:1px solid var(--line);border-radius:16px;background:var(--panel);box-shadow:0 20px 50px #0007}.mobile-menu.open{display:grid}.mobile-menu a{padding:12px;border-radius:10px;color:var(--text)}.mobile-menu a.active,.mobile-menu a:hover{background:var(--panel2);color:var(--green)}}@media(max-width:600px){.mobile-menu{top:70px}}</style>`;
landing = landing.replace('</header>', `${mobileMenu}</header>`);

const interactions = `<script>
(()=>{
 const nav=[...document.querySelectorAll('.topbar nav a, .footer-links a, .mobile-menu a')];
 const sections=['home','services','about','contact'].map(id=>document.getElementById(id)).filter(Boolean);
 const setActive=id=>document.querySelectorAll('.topbar nav a,.mobile-menu a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+id));
 const observer=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(visible)setActive(visible.target.id)},{rootMargin:'-32% 0px -58% 0px',threshold:[.05,.2,.5,.8]});
 sections.forEach(s=>observer.observe(s));
 nav.forEach(a=>a.addEventListener('click',()=>{setActive(a.getAttribute('href').slice(1));document.getElementById('mobileMenu')?.classList.remove('open')}));
 const menuBtn=document.getElementById('mobileMenuBtn'),menu=document.getElementById('mobileMenu');menuBtn?.addEventListener('click',()=>menu?.classList.toggle('open'));
 const qText=document.querySelector('.quote p'),qMeta=document.querySelector('.quote small'),dots=[...document.querySelectorAll('.dots i')],prev=document.querySelector('.quote-wrap .arrow:first-child'),next=document.querySelector('.quote-wrap .arrow:last-child');
 const quotes=[['“NIKKSORA helped us get consistent enquiries through Meta Ads.<br>The process was simple, and the results were real.”','Small Business Owner · Hyderabad'],['“The audit showed us what to improve first instead of wasting budget.”','Growth Audit · Local Business'],['“Clear recommendations, practical next steps and no unnecessary package.”','Business Owner · Telangana'],['“The focus was on better conversations, not just more clicks.”','Business Owner · India']];let index=0;
 const render=()=>{if(qText)qText.innerHTML=quotes[index][0];if(qMeta)qMeta.textContent=quotes[index][1];dots.forEach((d,i)=>d.classList.toggle('selected',i===index));};
 prev?.addEventListener('click',()=>{index=(index+quotes.length-1)%quotes.length;render()});next?.addEventListener('click',()=>{index=(index+1)%quotes.length;render()});dots.forEach((d,i)=>d.addEventListener('click',()=>{index=i;render()}));render();
})();
</script>`;
landing += interactions;

// The Worker must return a real document with a mobile viewport declaration.
landing = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#030506"><title>NIKKSORA — Turn Attention Into Growth</title></head><body>${landing}</body></html>`;

const template = JSON.stringify(landing);
const replacement = `const NIKKSORA_LANDING_TEMPLATE=${template};\nfunction landingPage(env:Env,requestUrl:URL){const q=esc(requestUrl.search);return NIKKSORA_LANDING_TEMPLATE.replaceAll('__AUDIT__',\`/offer/lead-1\${q}\`).replaceAll('__SERVICE__',\`/offer/service-1\${q}\`).replaceAll('__WA__',\`/whatsapp\${q}\`);}`;
const landingRegex = /function landingPage\(env:Env,requestUrl:URL\)\{[\s\S]*?\}\n\nfunction leadForm/;
if (!landingRegex.test(source)) throw new Error('landingPage function not found');
source = source.replace(landingRegex, `${replacement}\n\nfunction leadForm`);

const digitalOffer = "list.push({id:'digital-1',type:'digital',name:'Digital toolkit',description:'A product slot that stays offline until a real product and payment flow are configured.',cta:'View toolkit'});";
source = source.replace(digitalOffer, '');
fs.writeFileSync(sourcePath, source);
console.log('NIKKSORA responsive web/mobile document + active nav + mobile menu + light theme applied');
