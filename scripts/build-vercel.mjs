import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

// The Vercel deployment proxies /api to Render. Override stale dashboard or
// dotenv values so login and downloads always use that same-origin proxy.
const clientDir=fileURLToPath(new URL('../client/',import.meta.url));
const require=createRequire(new URL('../client/package.json',import.meta.url));
const vite=path.join(path.dirname(require.resolve('vite/package.json')),'bin/vite.js');
const result=spawnSync(process.execPath,[vite,'build'],{
  cwd:clientDir,
  env:{...process.env,VITE_API_BASE_URL:'/api'},
  stdio:'inherit',
  windowsHide:true
});
if(result.error)throw result.error;
process.exit(result.status??1);
