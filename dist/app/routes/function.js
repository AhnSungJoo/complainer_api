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
    const params = settingConfig.get('params');
    const senderId = reqData['sender_id'];
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
    // 심볼별 table 분리
    const senderSet = settingConfig.get('sender-id-set');
    const senderInfo = settingConfig.get('sender-id-info');
    let tableType;
    let senderIdType = 'none';
    for (let key in senderSet) {
        if (senderSet[key].includes(senderId)) {
            senderIdType = key; // multy, real, alpha
        }
    }
    if (senderIdType === 'none') {
        logger_1.default.warn('전략 ID가 참고하고 있는 ID가 아닙니다. req_data: ' + JSON.stringify(reqData));
        errorMSG_1.sendErrorMSG('전략 ID가 참고하고 있는 ID가 아닙니다. req_data: ' + JSON.stringify(reqData), values['symbol']);
        return ctx.bodx = { result: false };
    }
    tableType = senderInfo[senderIdType]['table-type'];
    for (let idx = 0; idx < tableType.length; idx++) {
        console.log('test------------------');
        yield api_1.checkConditions(values, reqData, tableType[idx], 'test');
    }
    logger_1.default.info('Signal Process End');
    return ctx.body = { result: true };
}));
router.post('/rangeSend', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    const startDate = ctx.request.body.startDate;
    const endDate = ctx.request.body.endDate;
    const dao = new signalDAO_1.default('real');
    const result = yield dao.getDateSignalData(startDate, endDate);
    api_1.delayedTelegramMsgTransporter(result, 0);
    return ctx.body = { result: true };
}));
exports.default = router;
