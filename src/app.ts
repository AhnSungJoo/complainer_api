//web_app.ts

/* jshint node: true, devel: true */
'use strict';

import * as util from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as EventEmitter from 'events';
import * as telegram from './util/TelegramUtil'

import * as Koa from 'koa';
import * as koaBody from 'koa-body';
import * as koaRender from 'koa-ejs';
import * as koaServe from 'koa-static';
import * as koaMount from 'koa-mount';
import * as config from 'config';
import * as moment from 'moment';
import * as koaIpFilter from 'koa-ip-filter'

////////////////////////////////////////////////////////////
(global as any).appRoot = path.resolve(__dirname);

// logger 내부에서 global.appRoot를 사용한다.
import logger from './util/logger';


import idxRouter from './routes/index';

const WEB_PORT: number = Number((process.env.PORT || config.get('webPort')));
if (!(WEB_PORT)) {
  logger.out("Missing config values");
  process.exit(1);
}
const procName = process.env.name || config.get('name');
logger.init(procName); // 로그 파일명에 이름을 붙이기 위해
logger.out('App instance name :', procName);

const koaApp = new Koa();
koaRender(koaApp, {
  root: path.join(__dirname, 'views'),
  layout: false, // layout 기능을 안 쓸꺼면 꺼야함
  viewExt: 'ejs',
  cache: false,
  debug: false

})

// Will process application/json
// And application/x-www-form-urlencoded
koaApp.use(koaBody());


//const allowedIPs = config.get('ip-allowed');
/*
koaApp.use(koaIpFilter({
  forbidden: (self) => {
    return '403: Forbidden!'
  },
  filter: [ '127.0.0.1' ] // allow 127.??.6*.12 and disallow !1.2.*.4
  //filter: allowedIPs
}))
*/

// public 폴더를 /resource 주소로 노출
// koaMount는 특정 경로에 코아 미들웨어/앱을 연결하기 위해 쓰임. (koa는 app.get('/resource', 미들웨어) 가 안됨.)
// koaServer는 주어진 경로에 있는 정적 파일들을 클라이언트에게 전송해주는 미들웨어
koaApp.use(koaMount('/resource', koaServe(path.join(__dirname, '/../public'))));

// TODO: 사용 권한 확인 절차, 또는 그 외 코드를 여기로
koaApp.use(async (ctx, next) => {
  // 서버 에러 발생시 핸들링
  // (참고: https://github.com/koajs/examples/blob/master/errors/app.js)
  try {
    await next();
  } catch(err) {
    // some errors will have .status however this is not a guarantee
    ctx.status = 500;
    ctx.type = 'html';
    ctx.body = '<p>Something <em>exploded</em></p>';

    console.log(err);

    // since we handled this manually we'll want to delegate to the regular app
    // level error handling as well so that centralized still functions correctly.
    ctx.app.emit('error', err, ctx);
  }
})

koaApp.use(idxRouter.routes());

const ENV = process.env.NODE_ENV || config.get('host');
logger.info(`ENV : ${ENV}`);
logger.info (`process env : ${process.env.NODE_ENV}, ${config.get('host')}`);
koaApp.on('error', (err) => {
  if (ENV === 'dev') {
    // 1) Development error handler
    // will print stacktrace
    logger.out(err);
  }
  else {
    // 2) Production error handler
    // no stacktraces leaked to user
  }
})

// NOTE : This middle-ware must be placed at the end of all routes which will get executed when none of the routes match.
// Catch 404 and forward to error handler
// (참고: https://github.com/koajs/examples/blob/master/404/app.js)
koaApp.use(async function pageNotFound(ctx) {
  // we need to explicitly set 404 here
  // so that koa doesn't assign 200 on body=
  ctx.status = 404;

  switch (ctx.accepts('html', 'json')) {
    case 'html':
      ctx.type = 'html';
      ctx.body = '<p>Page Not Found</p>';
      break;
    case 'json':
      ctx.body = {
        message: 'Page Not Found'
      };
      break;
    default:
      ctx.type = 'text';
      ctx.body = 'Page Not Found';
  }
});

const webServer: http.Server = http.createServer(koaApp.callback());
const webPromise = new Promise((resolve, reject) => {
  webServer.listen(WEB_PORT, '0.0.0.0', () => {
    logger.info(`[Web] <${ENV}> Web server is running on port ${WEB_PORT}`);
    logger.info('[Web] Starts at...' + moment().format());
    resolve(true);
  })
})

// 초기화 작업이 모두 끝나야 요청들을 수행할 수 있도록 해야함.
Promise.all([ webPromise ])
.then((results) => {
  const isInited: boolean = results.reduceRight((prev, curr) => prev && curr) as boolean;
  
  if (isInited === false)
    throw new Error('Failed');
})
.catch((err) => {
  logger.info(`Failed to initialize.`, err);
  process.exit(1);
})