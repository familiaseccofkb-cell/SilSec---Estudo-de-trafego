import {mkdir,copyFile} from 'node:fs/promises';
await mkdir(new URL('../public/vendor/',import.meta.url),{recursive:true});
for(const [from,to] of [['dist/pptxgen.bundle.js','pptxgen.bundle.js'],['LICENSE','pptxgenjs.LICENSE']])await copyFile(new URL('../node_modules/pptxgenjs/'+from,import.meta.url),new URL('../public/vendor/'+to,import.meta.url));
