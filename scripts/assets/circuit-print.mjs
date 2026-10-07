// Generates an illustrated circuit-board collection inspired by the room photo.
import sharp from 'sharp';
let pieces='';
for(let i=0;i<12;i++){
 const x=18+(i%3)*103,y=16+Math.floor(i/3)*125,w=87,h=105;
 pieces+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${i%3===0?'#244d43':'#366e60'}" stroke="#a3b4a1" stroke-width="1"/>`;
 for(let j=0;j<7;j++){
  const ax=x+7+(j%3)*24,ay=y+9+Math.floor(j/3)*29;
  pieces+=`<path d="M${ax} ${ay}h13v19h12" fill="none" stroke="#a8b680" stroke-width=".8"/><rect x="${ax}" y="${ay}" width="14" height="17" fill="#242b2a"/><path d="M${ax+2} ${ay+3}h10m-10 4h10m-10 4h10" stroke="#7f8880" stroke-width=".7"/>`;
 }
 pieces+=`<rect x="${x+6}" y="${y+93}" width="72" height="5" fill="#dbd1b2"/>`;
}
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="330" height="520"><rect width="330" height="520" fill="#e9e3d7"/>${pieces}</svg>`)).resize(660,1040).webp({quality:92}).toFile('public/lab/circuit-print.webp');
