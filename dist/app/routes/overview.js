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
// import * as emoji from 'telegram-emoji-map';
const logger_1 = require("../util/logger");
const externalMSG_1 = require("../module/externalMSG");
const insertDB_1 = require("../module/insertDB");
const paging_1 = require("../util/paging");
const api_1 = require("./api");
// dao
const signalDAO_1 = require("../dao/signalDAO");
const nameDAO_1 = require("../dao/nameDAO");
const flagDAO_1 = require("../dao/flagDAO");
const db_modules = [insertDB_1.upsertData];
const msg_modules = [externalMSG_1.sendExternalMSG]; // 텔레그램 알림 모음 (내부 / 외부)
const router = new Router();
router.get('/history', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
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
router.post('/telegramflag', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    const reqData = ctx.request.body.data;
    console.log(reqData);
    const flag = new flagDAO_1.default();
    const data = yield flag.changeFlag(reqData['flag'], 'tg');
    return ctx.redirect('/');
}));
router.post('/lastflag', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    const reqData = ctx.request.body.data;
    console.log(reqData);
    const flag = new flagDAO_1.default();
    const data = yield flag.changeFlag(reqData['flag'], 'last');
    return ctx.redirect('/');
}));
router.post('/name/replace', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    const originName = ctx.request.body.originName;
    const replaceName = ctx.request.body.replaceName;
    if (!originName || !replaceName)
        return ctx.redirect('/name');
    const dao = new nameDAO_1.default();
    const result = yield dao.updateReplaceName(originName, replaceName);
    return ctx.redirect('/name');
}));
router.post('/send/specificSignal', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    logger_1.default.info('특정 컬럼 메시지 발송');
    const reqData = ctx.request.body.data;
    let result = reqData.split(','); // ['1', 'BTC/KRW']
    const signalDAO = new signalDAO_1.default();
    const signalResult = yield signalDAO.getSpecificSignalColumn(result[0], result[1]);
    let values = signalResult[0];
    values['send_date'] = moment().format('YYYY-MM-DD HH:mm:ss');
    values['order_date'] = moment(values['order_date']).format('YYYY.MM.DD HH:mm:ss');
    let msg;
    try {
        msg = yield api_1.processMsg(values); // 메시지 문구 만들기 
    }
    catch (error) {
        logger_1.default.warn('[SendSpecificColumn] Msg Formating Error');
    }
    if (!msg) {
        return;
    }
    for (let index in msg_modules) {
        try {
            msg_modules[index](msg);
            db_modules[index](values);
        }
        catch (error) {
            logger_1.default.warn('[MSG Transporters Error]', error);
        }
    }
    return ctx.redirect('/overview/history');
}));
exports.default = router;
