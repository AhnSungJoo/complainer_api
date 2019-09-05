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
const moment = require("moment");
const settingConfig = require("config");
const logger_1 = require("../util/logger");
const api_1 = require("./api");
const internalMSG_1 = require("../module/internalMSG");
const externalMSG_1 = require("../module/externalMSG");
const insertDB_1 = require("../module/insertDB");
const paging_1 = require("../util/paging");
// dao
const signalDAO_1 = require("../dao/signalDAO");
const nameDAO_1 = require("../dao/nameDAO");
const db_modules = [insertDB_1.upsertData];
const msg_modules = [internalMSG_1.sendInternalMSG, externalMSG_1.sendExternalMSG]; // 텔레그램 알림 모음 (내부 / 외부)
const router = new Router();
router.use((ctx, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        yield next();
    }
    catch (err) {
        console.log(err.status);
        ctx.status = err.status || 500;
        ctx.body = err.message;
    }
}));
// Dashboard
router.get('/', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    console.log('index here');
    let curPage = ctx.request.query.page;
    if (!curPage)
        curPage = 1;
    const signalDAO = new signalDAO_1.default();
    let symbolList = yield signalDAO.getAllSymbol();
    let totalScoreSet = {};
    for (let index in symbolList) {
        totalScoreSet[symbolList[index]['symbol']] = yield signalDAO.getSpecificTotalScore(symbolList[index]['symbol']);
    }
    let keySet = Object.keys(totalScoreSet);
    const forum = 'home';
    return ctx.render('index', { totalScoreSet, keySet, forum });
}));
// Overview
router.get('/history', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    console.log('history here');
    let curPage = ctx.request.query.page;
    if (!curPage)
        curPage = 1;
    const signalDAO = new signalDAO_1.default();
    const signalResult = yield signalDAO.getAllSignalData();
    const paging = yield paging_1.getPaging(curPage, signalResult.length);
    const pageSignalResult = yield signalDAO.getSpecifitSignalData(paging.no, paging.page_size);
    const forum = 'overview';
    return ctx.render('history', { pageSignalResult, paging, forum, moment });
}));
router.get('/name', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    const forum = 'overview';
    const dao = new nameDAO_1.default();
    const nameList = yield dao.getAllNameList();
    return ctx.render('name', { nameList, forum });
}));
router.post('/name/replace', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    const forum = 'overview';
    const originName = ctx.request.body.originName;
    const replaceName = ctx.request.body.replaceName;
    console.log(ctx.request.body.originName);
    console.log(originName, replaceName);
    if (!originName || !replaceName)
        return ctx.redirect('/name');
    const dao = new nameDAO_1.default();
    const result = yield dao.updateReplaceName(originName, replaceName);
    return ctx.redirect('/name');
}));
// Test 
router.get('/test', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    return ctx.render('test');
}));
// POST Data 받기 
router.post('/api/signal', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    logger_1.default.info('Signal Process Start');
    logger_1.default.info('Request Data: ', ctx.request.body.data);
    let reqData = ctx.request.body.data;
    const params = settingConfig.get('params');
    let curTime = moment().format(); // api call 받은 시간을 DB에 저장 
    const signDAO = new signalDAO_1.default();
    const namesDAO = new nameDAO_1.default();
    let values = {};
    // body로 받은 데이터(json)를 각 컬럼명에 맞게 저장 
    for (let index in params) {
        try {
            values[params[index]] = reqData[params[index]];
        }
        catch (error) {
            logger_1.default.warn('[Json Params Error]', error);
        }
    }
    values['received_date'] = curTime; // api call 받은 시간을 DB에 저장 
    let lastScore = yield signDAO.getSpecificTotalScore(values['symbol']);
    if (!lastScore || lastScore.length < 1)
        lastScore = 0;
    else
        lastScore = lastScore[0].total_score;
    if (values['side'] === 'buy')
        values['total_score'] = lastScore + 1;
    else if (values['side'] === 'sell')
        values['total_score'] = lastScore - 1;
    // DB 관련 모듈
    for (let index in db_modules) {
        try {
            db_modules[index](values);
        }
        catch (error) {
            logger_1.default.warn('[DB Transporters Error]', error);
        }
    }
    logger_1.default.info('db success');
    // 메시지 관련 모듈 
    let msg = yield processMsg(values); // 메시지 문구 만들기 
    for (let index in msg_modules) {
        try {
            msg_modules[index](msg);
        }
        catch (error) {
            logger_1.default.warn('[MSG Transporters Error]', error);
        }
    }
    logger_1.default.info('Signal Process End');
    return ctx.redirect('/');
}));
router.get('/api/signal', (ctx, next) => {
    return ctx.render('signal');
});
// 중요: cors는 /api에만 적용될거라 index router 뒤에 와야 한다.
router.use('/api', api_1.default.routes());
exports.default = router;
function processMsg(values) {
    return __awaiter(this, void 0, void 0, function* () {
        const namesDAO = new nameDAO_1.default();
        const data = yield namesDAO.getReplaceName('F03'); // param: values.algortihm_id
        const replaceName = data['algorithm_name'];
        // let msg = `${replaceName} : ${values['side']}`
        let msg = ` ${replaceName} " ${values['side']} 신호 발생 " \n- INFO - \nAlgorithm ID: ${values['algorithm_id']}, Symbol: ${values['symbol']} \nQty : ${values.qty}, Price: ${values.price}`;
        return msg;
    });
}
