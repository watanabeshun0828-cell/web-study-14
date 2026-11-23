export function hslToRGB(h:number,s:number,l:number):[number,number,number]{
 s/=100;l/=100
 const a=s*Math.min(l,1-l)
 const f=(n:number)=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1))}
 return [f(0),f(8),f(4)].map(v=>Math.round(v*255)) as [number,number,number]
}
export function luminance(rgb:number[]){const c=rgb.map(v=>{const n=v/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
export function contrast(a:number[],b:number[]){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
export const hueAngle=(a:number,b:number)=>Math.min(Math.abs(a-b)%360,360-Math.abs(a-b)%360)
