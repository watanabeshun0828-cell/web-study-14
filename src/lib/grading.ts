import type {Calculation,Question} from './schema'
export type Response={values:Record<string,string>;choiceId:string}
export const emptyResponse=():Response=>({values:{},choiceId:''})
export function parseNumber(raw:string):number|null {
  const value=raw.normalize('NFKC').trim().replace(/−/g,'-')
  if(!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value))return null
  const number=Number(value.replaceAll(',',''))
  return Number.isFinite(number)&&Math.abs(number)<=1e12?number:null
}
export function calculate(c:Calculation){
  const v=c.operands
  let result:number
  switch(c.operator){
    case 'sum':result=v.reduce((a,b)=>a+b,0);break
    case 'difference':result=v.slice(1).reduce((a,b)=>a-b,v[0]);break
    case 'product':result=v.reduce((a,b)=>a*b,1);break
    case 'quotient':result=v.slice(1).reduce((a,b)=>a/b,v[0]);break
    case 'power':result=v[0]**v[1];break
  }
  return c.rounding==='floor'?Math.floor(result):c.rounding==='ceil'?Math.ceil(result):c.rounding==='round'?Math.round(result):result
}
export function assess(q:Question,response:Response){
  if(q.format==='choice'){
    const ready=q.choices.some(c=>c.id===response.choiceId)
    return{ready,correct:ready&&response.choiceId===q.correctChoiceId,message:ready?'':'選択肢を選んでください。'}
  }
  const ready=q.fields.every(f=>parseNumber(response.values[f.id]??'')!==null)
  return{ready,correct:ready&&q.fields.every(f=>Math.abs(parseNumber(response.values[f.id])!-f.expected)<1e-9),message:ready?'':'単位と端数の条件を確認し、すべての数値を入力してください。'}
}
