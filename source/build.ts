import {rm,copyFile} from 'node:fs/promises';
await rm('./dist',{recursive:true,force:true});
for(const options of [{entrypoints:['src/background/index.ts'],outdir:'dist/background',format:'iife' as const},{entrypoints:['src/ui/index.html'],outdir:'dist/ui',minify:true}]){const result=await Bun.build({...options,target:'browser'});if(!result.success){console.error(result.logs);process.exit(1);}}
for(const file of ['UPSTREAM_APACHE_LICENSE.txt','EVENTEMITTER3_LICENSE.txt','THIRD_PARTY_NOTICES.txt'])await copyFile(file,'dist/'+file);
