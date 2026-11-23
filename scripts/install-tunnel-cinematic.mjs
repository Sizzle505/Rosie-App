// One-time import of the approved Tunnel opening into the immutable Vercel deployment.
// Do not depend on the signed source for subsequent deployments: switch to the archived
// immutable production deployment URL after the first verified build.
import {createHash} from "node:crypto";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import {join} from "node:path";
const url="https://d2jqrm6oza8nb6.cloudfront.net/datasets/507123b0-2aa6-490f-92b5-04ba606bd6c2.mp4?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiNzRiNzUxMzA4MmNjZDcwMyIsImJ1Y2tldCI6InJ1bndheS1kYXRhc2V0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5NTU2NjEyOH0.JDVIB6Em3Kif-nANTBhbR69XK8j0mJosSVh222euyek";
const expected="bfeaf6b48ece51b27dbe106d337ba1b2678b31ce6d500dc4bce380e7c23b60d4";
const dest=join(process.cwd(),"public/ember-drill/rosie-tunnel-opening.mp4");
let file;
try { file=await readFile(dest); } catch{}
if(!file || createHash("sha256").update(file).digest("hex")!==expected){
  const response=await fetch(url);
  if(!response.ok)throw Error("Approved Tunnel opening download failed: HTTP "+response.status);
  file=Buffer.from(await response.arrayBuffer());
  if(createHash("sha256").update(file).digest("hex")!==expected)
    throw Error("Tunnel opening hash mismatch; refusing to deploy");
  await mkdir(join(process.cwd(),"public/ember-drill"),{recursive:true});
  await writeFile(dest,file);
}
console.log("Verified approved Tunnel opening: "+file.byteLength+" bytes");
