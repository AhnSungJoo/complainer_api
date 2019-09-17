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
const settingConfig = require("config");
// import * as emoji from 'telegram-emoji-map';
const logger_1 = require("../util/logger");
const internalMSG_1 = require("../module/internalMSG");
const errorMSG_1 = require("../module/errorMSG");
const insertDB_1 = require("../module/insertDB");
const api_1 = require("./api");
// dao
const signalDAO_1 = require("../dao/signalDAO");
// condition
const condition_1 = require("../module/condition");
const db_modules = [insertDB_1.upsertData];
const msg_modules = [internalMSG_1.sendInternalMSG]; // 텔레그램 알림 모음 (내부 / 외부) => Test 용 
const router = new Router();
router.get('/sendmsg', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    const forum = 'test';
    return ctx.render('sendmsg', { forum });
}));
router.get('/test', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    const forum = 'test';
    return ctx.render('test', { forum });
}));
// POST TEST 
router.post('/signal/test', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    logger_1.default.info('[TEST]Signal test Start');
    logger_1.default.info('Client IP: ' + ctx.ip);
    logger_1.default.info('Request Data: ', ctx.request.body.data);
    let reqData = ctx.request.body.data;
    const mode = reqData['mode'];
    const params = settingConfig.get('params');
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
    logger_1.default.info('condition check');
    // 알고리즘 ID 가 target id 인지 확인 
    const checkAlgo = yield condition_1.checkExistAlgo(values['algorithm_id'], reqData);
    // 이미 들어간 컬럼 있는지 확인
    const verifyFlag = yield condition_1.checkSameColumn(values, reqData);
    // 2분 이내에 발생된 신호인지 확인 => db에 넣지 않고 dev에 에러메시지 발생
    const lastFlag = yield condition_1.checkLast2min(values, reqData);
    // total_score, ord를 업데이트 하고 total_score가 valid한지 확인한다.
    values = yield condition_1.checkTotalScore(values, mode, reqData);
    // 동일 전략 동일 매매 확인 => values['valid_type'] = -1이 됨 
    values = yield condition_1.checkSameTrading(values, reqData);
    if (!lastFlag || !checkAlgo || !verifyFlag) { // 이 3가지 case는 false인 경우 db에도 넣지 않는다.
        logger_1.default.warn('조건에 어긋나 DB에 저장하지 않고 종료합니다.');
        errorMSG_1.sendErrorMSG('조건에 어긋나 DB에 저장하지 않고 종료합니다.');
        return;
    }
    logger_1.default.info('DB start');
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
    if (values['valid_type'] === -1 || mode === 'silent') {
        logger_1.default.warn('valid type 이 -1 혹은 mode가 silent 입니다.(메시지 발송 X)');
        return;
    }
    // 텔레그램 신호 on / off 확인 
    const tgFlag = yield condition_1.checkTelegramFlag();
    if (!tgFlag) {
        logger_1.default.info("텔레그램 메시지 발송 기능이 'Off' 상태입니다.");
        return;
    }
    logger_1.default.info('msg start');
    // 메시지 관련 모듈 
    let msg;
    try {
        msg = yield api_1.processMsg(values); // 메시지 문구 만들기 
    }
    catch (error) {
        logger_1.default.warn('Msg Formating Error');
    }
    if (!msg) {
        return;
    }
    for (let index in msg_modules) {
        try {
            msg_modules[index](msg);
        }
        catch (error) {
            logger_1.default.warn('[MSG Transporters Error]', error);
        }
    }
    logger_1.default.info('Signal Process End');
    return ctx.body = { result: true };
}));
router.post('/rangeSend', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    const startDate = ctx.request.body.startDate;
    const endDate = ctx.request.body.endDate;
    const dao = new signalDAO_1.default();
    const result = yield dao.getDateSignalData(startDate, endDate);
    api_1.delayedTelegramMsgTransporter(result, 0);
    return ctx.body = { result: true };
}));
exports.default = router;
