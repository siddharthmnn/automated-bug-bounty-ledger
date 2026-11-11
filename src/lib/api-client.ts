// Browser helper; the HTTP-only session cookie is sent automatically by fetch.
export class ApiError extends Error {
 constructor(public status:number,message:string){super(message);}
}
export async function api<T=unknown>(method:string,url:string,body?:unknown):Promise<T> {
 const res=await fetch(url,{method,headers:body===undefined?undefined:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
 const json=(await res.json().catch(()=>({}))) as {data?:T;error?:{message?:string}};
 if(!res.ok)throw new ApiError(res.status,json.error?.message??`Request failed (${res.status})`);
 return json.data as T;
}
export function formValues(form:HTMLFormElement):Record<string,string|undefined> {
 const out:Record<string,string|undefined>={};
 new FormData(form).forEach((v,k)=>{const s=String(v);out[k]=s===""?undefined:s;});
 return out;
}
