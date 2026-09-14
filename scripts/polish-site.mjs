import fs from 'node:fs';

const sourcePath = 'src/index.ts';
const templatePath = 'src/landing.html';
let source = fs.readFileSync(sourcePath, 'utf8');
const template = JSON.stringify(fs.readFileSync(templatePath, 'utf8'));

const replacement = `const NIKKSORA_LANDING_TEMPLATE=${template};\nfunction landingPage(env:Env,requestUrl:URL){const q=esc(requestUrl.search);return NIKKSORA_LANDING_TEMPLATE.replaceAll('__AUDIT__',\`/offer/lead-1\${q}\`).replaceAll('__SERVICE__',\`/offer/service-1\${q}\`).replaceAll('__WA__',\`/whatsapp\${q}\`);}`;
const landingRegex = /function landingPage\(env:Env,requestUrl:URL\)\{[\s\S]*?\}\n\nfunction leadForm/;
if (!landingRegex.test(source)) throw new Error('landingPage function not found');
source = source.replace(landingRegex, `${replacement}\n\nfunction leadForm`);

const digitalOffer = "list.push({id:'digital-1',type:'digital',name:'Digital toolkit',description:'A product slot that stays offline until a real product and payment flow are configured.',cta:'View toolkit'});";
source = source.replace(digitalOffer, '');
fs.writeFileSync(sourcePath, source);
console.log('NIKKSORA landing UI applied');
