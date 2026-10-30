import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=path.join(root,'artifacts');
fs.mkdirSync(artifacts,{recursive:true});
// A fresh staging folder prevents moved or deleted source files reappearing in the ZIP.
const staging=path.join(fs.mkdtempSync(path.join(artifacts,'package-')),'Diyaprosoft-LMS');
fs.mkdirSync(staging,{recursive:true});
for(const name of ['client','server','scripts','docs','samples','package.json','package-lock.json','README.md','.gitignore','.dockerignore','Dockerfile','compose.yaml','render.yaml','vercel.json']){
  const source=path.join(root,name);if(!fs.existsSync(source))continue;
  fs.cpSync(source,path.join(staging,name),{recursive:true,filter:src=>!src.split(path.sep).some(p=>['node_modules','dist','.cache','artifacts','test-results'].includes(p))&&!['.env'].includes(path.basename(src))});
}
const destination=path.join(root,'artifacts','Diyaprosoft-LMS-MERN.zip');
if(process.platform==='win32'){
  execFileSync('powershell.exe',['-NoProfile','-Command',`Compress-Archive -LiteralPath '${staging.replaceAll("'","''")}' -DestinationPath '${destination.replaceAll("'","''")}' -Force`],{stdio:'inherit'});
}else {
  fs.rmSync(destination,{force:true});
  execFileSync('zip',['-qr',destination,'Diyaprosoft-LMS'],{cwd:path.dirname(staging),stdio:'inherit'});
}
console.log(destination);
