//web_app.ts
/* jshint node: true, devel: true */
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const http = require("http");
const telegram = require("./util/TelegramUtil");
const Koa = require("koa");
const koaBody = require("koa-body");
const koaRender = require("koa-ejs");
const koaServe = require("koa-static");
const koaMount = require("koa-mount");
const config = require("config");
const moment = require("moment");
const koaIpFilter = require("koa-ip-filter");
////////////////////////////////////////////////////////////
global.appRoot = path.resolve(__dirname);
// logger 내부에서 global.appRoot를 사용한다.
const logger_1 = require("./util/logger");
const index_1 = require("./routes/index");
const WEB_PORT = Number((process.env.PORT || config.get('webPort')));
if (!(WEB_PORT)) {
    logger_1.default.out("Missing config values");
    process.exit(1);
}
const procName = process.env.name || config.get('name');
logger_1.default.init(procName); // 로그 파일명에 이름을 붙이기 위해
logger_1.default.out('App instance name :', procName);
const koaApp = new Koa();
koaRender(koaApp, {
    root: path.join(__dirname, 'views'),
    layout: false,
    viewExt: 'ejs',
    cache: false,
    debug: false
});
// Will process application/json
// And application/x-www-form-urlencoded
koaApp.use(koaBody());
const allowedIPs = config.get('ip-allowed');
koaApp.use(koaIpFilter({
    forbidden: (self) => {
        let msg = `[CQ-S] 허가되지 않은 ${self.ip}로부터 api call 발생`;
        telegram.sendTo('dev', msg);
        return '403: Forbidden!';
    },
    //filter: [ '127.??.6*.12', '!1.2.*.4' ] // allow 127.??.6*.12 and disallow !1.2.*.4
    filter: allowedIPs
}));
// public 폴더를 /resource 주소로 노출
// koaMount는 특정 경로에 코아 미들웨어/앱을 연결하기 위해 쓰임. (koa는 app.get('/resource', 미들웨어) 가 안됨.)
// koaServer는 주어진 경로에 있는 정적 파일들을 클라이언트에게 전송해주는 미들웨어
koaApp.use(koaMount('/resource', koaServe(path.join(__dirname, '/../public'))));
// TODO: 사용 권한 확인 절차, 또는 그 외 코드를 여기로
koaApp.use((ctx, next) => __awaiter(this, void 0, void 0, function* () {
    // 서버 에러 발생시 핸들링
    // (참고: https://github.com/koajs/examples/blob/master/errors/app.js)
    try {
        yield next();
    }
    catch (err) {
        // some errors will have .status however this is not a guarantee
        ctx.status = err.status || 500;
        ctx.type = 'html';
        ctx.body = '<p>Something <em>exploded</em></p>';
        console.log(err);
        // since we handled this manually we'll want to delegate to the regular app
        // level error handling as well so that centralized still functions correctly.
        ctx.app.emit('error', err, ctx);
    }
}));
koaApp.use(index_1.default.routes());
const ENV = process.env.NODE_ENV;
koaApp.on('error', (err) => {
    if (ENV === 'dev') {
        // 1) Development error handler
        // will print stacktrace
        logger_1.default.out(err);
    }
    else {
        // 2) Production error handler
        // no stacktraces leaked to user
    }
});
// NOTE : This middle-ware must be placed at the end of all routes which will get executed when none of the routes match.
// Catch 404 and forward to error handler
// (참고: https://github.com/koajs/examples/blob/master/404/app.js)
koaApp.use(function pageNotFound(ctx) {
    return __awaiter(this, void 0, void 0, function* () {
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
});
const webServer = http.createServer(koaApp.callback());
const webPromise = new Promise((resolve, reject) => {
    webServer.listen(WEB_PORT, '0.0.0.0', () => {
        logger_1.default.info(`[Web] <${ENV}> Web server is running on port ${WEB_PORT}`);
        logger_1.default.info('[Web] Starts at...' + moment().format());
        resolve(true);
    });
});
// 초기화 작업이 모두 끝나야 요청들을 수행할 수 있도록 해야함.
Promise.all([webPromise])
    .then((results) => {
    const isInited = results.reduceRight((prev, curr) => prev && curr);
    if (isInited === false)
        throw new Error('Failed');
})
    .catch((err) => {
    logger_1.default.info(`Failed to initialize.`, err);
    process.exit(1);
});
