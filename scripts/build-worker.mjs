import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url),target=new URL('../../circuitproof-hosting/',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const modules=['src/solver.js','src/project.js','src/investigator.mjs','src/service.mjs'];
const code=(await Promise.all(modules.map(read))).map(source=>source.replace(/^import .*?;\s*$/gm,'').replace(/\bexport (?=(?:async )?function|const|class)/g,'')).join('\n');
const paths={'/':'web/index.html','/main.js':'web/main.js','/style.css':'web/style.css','/solver.js':'src/solver.js','/circuits.js':'src/circuits.js','/project.js':'src/project.js','/recording.json':'web/recording.json','/evaluation.json':'web/evaluation.json'};
const assets={};for(const [path,file]of Object.entries(paths))assets[path]={body:await read(file),type:({'html':'text/html','js':'text/javascript','css':'text/css','json':'application/json'})[file.split('.').pop()]};
const worker=code+'\nconst ASSETS='+JSON.stringify(assets)+';\n'+`
let handler;
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname.startsWith('/api/')){handler ||= createService({env:{...env,HOSTED:'1'}});return handler(request);}
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 const asset=ASSETS[url.pathname];if(!Object.hasOwn(ASSETS,url.pathname))return new Response('Not found',{status:404});
 return new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type+'; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'"}});
}};
`;
await mkdir(new URL('worker/',target),{recursive:true});await writeFile(new URL('worker/index.js',target),worker);console.log('Generated secret-free Sites worker from application sources.');
