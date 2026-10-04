import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const meta=JSON.parse(await fs.readFile(path.join(root,'course-meta.json'),'utf8'));

async function walk(directory,prefix){
  const entries=await fs.readdir(directory,{withFileTypes:true});
  const files=[];
  for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name,'en'))){
    const absolute=path.join(directory,entry.name);
    const relative=path.posix.join(prefix,entry.name);
    if(entry.isDirectory())files.push(...await walk(absolute,relative));
    else if(entry.isFile())files.push(relative);
  }
  return files;
}

const courseAssets=meta.map(course=>path.posix.join('courses',course.source));
const assets=[...new Set([...courseAssets,...await walk(path.join(root,'images'),'images')])].sort();
let totalBytes=0;
const hash=crypto.createHash('sha256');
for(const asset of assets){
  const content=await fs.readFile(path.join(root,asset));
  totalBytes+=content.byteLength;
  hash.update(asset).update('\0').update(content).update('\0');
}
const output={version:hash.digest('hex').slice(0,24),generatedAt:new Date().toISOString(),totalBytes,assets};
await fs.writeFile(path.join(root,'offline-assets.json'),`${JSON.stringify(output,null,2)}\n`);
console.log(`Offline asset manifest: ${assets.length} asset, ${totalBytes} byte, ${output.version}`);
