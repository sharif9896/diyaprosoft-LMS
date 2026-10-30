import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import {serverDir} from './config/env.js';
import {createApiRouter} from './routes/index.js';
import {apiRequestGuard,apiNotFound} from './middleware/api.middleware.js';
import {errorHandler} from './middleware/error.middleware.js';

export function createApp(cfg) {
  const app=express();
  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy:{directives:{
      defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],
      imgSrc:["'self'",'data:'],connectSrc:["'self'"],fontSrc:["'self'"],objectSrc:["'none'"],
      upgradeInsecureRequests:cfg.production?[]:null
    }},crossOriginEmbedderPolicy:false
  }));
  app.use(cors({origin:cfg.origins,credentials:true}));
  app.use(express.json({limit:'100kb'}));
  app.use('/api',apiRequestGuard(cfg),createApiRouter(cfg),apiNotFound);

  const dist=path.resolve(serverDir,'../client/dist');
  if(fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('/{*path}',(req,res)=>res.sendFile(path.join(dist,'index.html')));
  }
  app.use(errorHandler);
  return app;
}
