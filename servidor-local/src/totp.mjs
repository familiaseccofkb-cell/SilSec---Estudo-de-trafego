import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';

// Código de 6 dígitos (RFC 6238, HMAC-SHA1, 30 s) compatível com Google Authenticator,
// Microsoft Authenticator, Aegis, 2FAS etc.
const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32Encode(buffer){let bits=0,value=0,out='';for(const byte of buffer){value=value<<8|byte;bits+=8;while(bits>=5){out+=ALPHABET[value>>>bits-5&31];bits-=5;}}if(bits>0)out+=ALPHABET[value<<5-bits&31];return out;}
export function base32Decode(text){const clean=String(text).toUpperCase().replace(/[^A-Z2-7]/g,'');let bits=0,value=0;const out=[];for(const ch of clean){value=value<<5|ALPHABET.indexOf(ch);bits+=5;if(bits>=8){out.push(value>>>bits-8&255);bits-=8;}}return Buffer.from(out);}
export const newTotpSecret=()=>base32Encode(randomBytes(20));
export function totpCode(secret,time=Date.now(),step=30){
 const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(time/1000/step)));
 const mac=createHmac('sha1',base32Decode(secret)).update(counter).digest(),offset=mac[mac.length-1]&15;
 return String((mac.readUInt32BE(offset)&0x7fffffff)%1e6).padStart(6,'0');
}
// Aceita o intervalo anterior e o seguinte para tolerar diferença de relógio do celular.
export function verifyTotp(secret,code,time=Date.now()){
 const given=Buffer.from(String(code||'').replace(/\s/g,''));
 if(given.length!==6)return false;
 let ok=false;
 for(const drift of [-1,0,1]){const expected=Buffer.from(totpCode(secret,time+drift*30000));if(timingSafeEqual(expected,given))ok=true;}
 return ok;
}
export const otpauthUrl=(secret,email,issuer='SilSec')=>`otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
