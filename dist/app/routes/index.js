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
const Router = require("koa-router");
// import * as emoji from 'telegram-emoji-map';
const logger_1 = require("../util/logger");
const api_1 = require("./api");
const function_1 = require("./function");
const overview_1 = require("./overview");
const externalMSG_1 = require("../module/externalMSG");
const insertDB_1 = require("../module/insertDB");
// dao
const signalDAO_1 = require("../dao/signalDAO");
const flagDAO_1 = require("../dao/flagDAO");
const db_modules = [insertDB_1.upsertData];
const msg_modules = [externalMSG_1.sendExternalMSG]; // 텔레그램 알림 모음 (내부 / 외부)
const router = new Router();
router.use((ctx, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        yield next();
    }
    catch (err) {
        console.log(err.status);
        ctx.status = err.status || 500;
        // ctx.body = err.message;
        return ctx.render('error', { message: 'Not Found' });
    }
}));
// Dashboard
router.get('/', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    logger_1.default.info('index here');
    let curPage = ctx.request.query.page;
    if (!curPage)
        curPage = 1;
    const realTotalScroreSet = yield getTableInfo('real');
    const alphaTotalScore = yield getTableInfo('alpha');
    console.log('real:', realTotalScroreSet);
    const forum = 'home';
    const flag = new flagDAO_1.default();
    const data = yield flag.getAllFlag();
    return ctx.render('index', { realTotalScroreSet, alphaTotalScore, flagSet: data[0], forum });
}));
function getTableInfo(tabelType) {
    return __awaiter(this, void 0, void 0, function* () {
        const signalDAO = new signalDAO_1.default(tabelType);
        let symbolList = yield signalDAO.getAllSymbol();
        let totalScoreSet = {};
        for (let index in symbolList) {
            totalScoreSet[symbolList[index]['symbol']] = yield signalDAO.getSpecificTotalScore(symbolList[index]['symbol']);
        }
        return totalScoreSet;
    });
}
// 중요: cors는 /api에만 적용될거라 index router 뒤에 와야 한다.
router.use('/api', api_1.default.routes());
router.use('/overview', overview_1.default.routes());
router.use('/function', function_1.default.routes());
exports.default = router;
