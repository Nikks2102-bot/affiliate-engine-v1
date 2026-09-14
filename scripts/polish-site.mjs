import fs from 'node:fs';

const sourcePath = 'src/index.ts';
const templatePath = 'src/landing.html';
let source = fs.readFileSync(sourcePath, 'utf8');
let landing = fs.readFileSync(templatePath, 'utf8');

// Complete light-mode pass: the original demo has a true light theme, so
// override the artwork/backgrounds that intentionally use hard-coded dark
// values in the base theme. This keeps dark mode unchanged.
const lightMode = `<style>
html[data-theme="light"] body{background:radial-gradient(circle at 78% 8%,#d9f7e4 0,transparent 32%),var(--bg);color:var(--text)}
html[data-theme="light"] .topbar{background:#ffffffee;border-bottom-color:#d7ded9}
html[data-theme="light"] .brand-mark{border-color:#cfd8d3}
html[data-theme="light"] .theme-toggle{background:#ffffff;border-color:#cfd8d3}
html[data-theme="light"] .hero-art{background:linear-gradient(145deg,#eef4f1,#dce7e2);border-color:#cbd6d1;box-shadow:0 30px 80px #64756d22}
html[data-theme="light"] .hero-art:after{background:#16a34a1c}
html[data-theme="light"] .hand-note{color:#26312c}
html[data-theme="light"] .screen{background:linear-gradient(135deg,#f7faf8,#dfe9e4);border-color:#c8d3ce;box-shadow:0 20px 45px #53645d25}
html[data-theme="light"] .screen b{color:#16201b}
html[data-theme="light"] .screen small{color:#52605a}
html[data-theme="light"] .base{background:linear-gradient(180deg,#b9c5c0,#eef3f1);border-top-color:#c4cfca}
html[data-theme="light"] .mug{background:#f8fbfa;border-color:#c8d3ce;color:#26312c;box-shadow:0 10px 25px #53645d20}
html[data-theme="light"] .hero-copy>p{color:#56625d}
html[data-theme="light"] h1 em{color:#66736d}
html[data-theme="light"] .trust-row{color:#5c6862}
html[data-theme="light"] .btn-ghost{background:#ffffff;color:#18211d;border-color:#cbd5d0}
html[data-theme="light"] .service-grid{border-color:#d5ddd9}
html[data-theme="light"] .service-grid article{border-color:#d5ddd9}
html[data-theme="light"] .service-grid h3{color:#17201c}
html[data-theme="light"] .service-grid p{color:#66716c}
html[data-theme="light"] .offer{background:linear-gradient(145deg,#ffffff,#f0f4f2);border-color:#d1dad5;box-shadow:0 12px 35px #53645d10}
html[data-theme="light"] .offer-featured{box-shadow:inset 0 0 0 1px #16a34a35,0 12px 35px #53645d10}
html[data-theme="light"] .offer:hover{border-color:#16a34a88}
html[data-theme="light"] .pill{background:#edf5f0;border-color:#cbd8d1;color:#506058}
html[data-theme="light"] .offer p,html[data-theme="light"] .offer ul{color:#5d6963}
html[data-theme="light"] .offer li:before{color:#16a34a}
html[data-theme="light"] .process-grid article{border-color:#d5ddd9}
html[data-theme="light"] .process-grid p{color:#5d6963}
html[data-theme="light"] .final-cta{background:linear-gradient(100deg,#e5f6eb,#f4f8f6);border-color:#cbd8d1;box-shadow:0 15px 45px #53645d12}
html[data-theme="light"] .final-cta p{color:#5d6963}
html[data-theme="light"] footer{border-color:#d5ddd9;color:#5d6963}
html[data-theme="light"] .footer-inner strong{color:#17201c}
@media(max-width:520px){html[data-theme="light"] .hero-art{background:linear-gradient(145deg,#eef4f1,#dce7e2)}}
</style>`;
landing = landing.replace('</style>\n<script>', `</style>${lightMode}\n<script>`);
const template = JSON.stringify(landing);

const replacement = `const NIKKSORA_LANDING_TEMPLATE=${template};\nfunction landingPage(env:Env,requestUrl:URL){const q=esc(requestUrl.search);return NIKKSORA_LANDING_TEMPLATE.replaceAll('__AUDIT__',\`/offer/lead-1\${q}\`).replaceAll('__SERVICE__',\`/offer/service-1\${q}\`).replaceAll('__WA__',\`/whatsapp\${q}\`);}`;
const landingRegex = /function landingPage\(env:Env,requestUrl:URL\)\{[\s\S]*?\}\n\nfunction leadForm/;
if (!landingRegex.test(source)) throw new Error('landingPage function not found');
source = source.replace(landingRegex, `${replacement}\n\nfunction leadForm`);

const digitalOffer = "list.push({id:'digital-1',type:'digital',name:'Digital toolkit',description:'A product slot that stays offline until a real product and payment flow are configured.',cta:'View toolkit'});";
source = source.replace(digitalOffer, '');
fs.writeFileSync(sourcePath, source);
console.log('NIKKSORA landing UI + complete light theme applied');
