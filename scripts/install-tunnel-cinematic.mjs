// Re-bundle the approved Tunnel opening from a verified immutable Rosie production build.
// The original 48-second soundtrack is muxed into the H.264 video. SHA256 verification
// prevents a missing, substituted, or expired source from shipping a broken introduction.
import {createHash} from "node:crypto";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import {join} from "node:path";
const url="https://rosie-app-gelogtwbq-apex-7488.vercel.app/ember-drill/rosie-tunnel-opening.mp4";
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
