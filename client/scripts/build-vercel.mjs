import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

// Keep the Vercel build self-contained when its Root Directory is client.
// Login and downloads use the same-origin /api proxy even with a stale env URL.
const clientDir=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(new URL('../package.json',import.meta.url));
const vite=path.join(path.dirname(require.resolve('vite/package.json')),'bin/vite.js');
const result=spawnSync(process.execPath,[vite,'build'],{
  cwd:clientDir,
  env:{...process.env,VITE_API_BASE_URL:'/api'},
  stdio:'inherit',
  windowsHide:true
});
if(result.error)throw result.error;
process.exit(result.status??1);
