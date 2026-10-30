import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import {serverDir} from './config/env.js';
import {createApiRouter} from './routes/index.js';
import {apiRequestGuard,apiNotFound} from './middleware/api.middleware.js';
import {errorHandler} from './middleware/error.middleware.js';
import {serverStatus} from './controllers/health.controller.js';

export function createApp(cfg) {
  const app=express();
  app.disable('x-powered-by');
  app.set('trust proxy',cfg.trustProxy??false);
  app.use(helmet({
    contentSecurityPolicy:{directives:{
      defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],
      imgSrc:["'self'",'data:'],connectSrc:["'self'"],fontSrc:["'self'"],objectSrc:["'none'"],
      upgradeInsecureRequests:cfg.production?[]:null
    }},crossOriginEmbedderPolicy:false
  }));
  app.use(cors({origin:cfg.origins,credentials:true,exposedHeaders:['Content-Disposition']}));
  app.use(express.json({limit:'100kb'}));
  app.use('/api',apiRequestGuard(cfg),createApiRouter(cfg),apiNotFound);

  const dist=path.resolve(serverDir,'../client/dist');
  if(cfg.serveClient!==false&&fs.existsSync(path.join(dist,'index.html'))) {
    app.use(express.static(dist));
    app.get('/{*path}',(req,res)=>res.sendFile(path.join(dist,'index.html')));
  } else {
    app.get('/',serverStatus);
  }
  app.use(errorHandler);
  return app;
}
