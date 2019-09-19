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
// import * as emoji from 'telegram-emoji-map';
const logger_1 = require("../util/logger");
const internalMSG_1 = require("../module/internalMSG");
const externalMSG_1 = require("../module/externalMSG");
const errorMSG_1 = require("../module/errorMSG");
const insertDB_1 = require("../module/insertDB");
// dao
const nameDAO_1 = require("../dao/nameDAO");
// condition
const condition_1 = require("../module/condition");
const db_modules = [insertDB_1.upsertData];
const msg_modules = { 'real': externalMSG_1.sendExternalMSG, 'test': internalMSG_1.sendInternalMSG }; // 텔레그램 알림 모음 (내부 / 외부) => real 용 
const router = new Router();
// POST Data 받기 
router.post('/signal', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    logger_1.default.info('Signal Process Start');
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
        yield checkConditions(values, reqData, tableType[idx], 'test');
    }
    logger_1.default.info('Signal Process End');
    return ctx.body = { result: true };
}));
// 메시지 포맷팅 함수
function processMsg(values, tableType) {
    return __awaiter(this, void 0, void 0, function* () {
        const namesDAO = new nameDAO_1.default();
        // const data = await namesDAO.getReplaceName(values['algorithm_id']); // param: values.algortihm_id
        // const replaceName = data['algorithm_name']
        logger_1.default.info('processMsg start');
        let algorithmEmoji, sideEmoji, sideKorean, power;
        let symbol = values['symbol'];
        let market = symbol.slice(symbol.indexOf('/') + 1);
        if (values['algorithm_id'] === 'F03') {
            algorithmEmoji = '🦁';
        }
        else if (values['algorithm_id'] === 'F07') {
            algorithmEmoji = '🐨';
        }
        else if (values['algorithm_id'] === 'F08') {
            algorithmEmoji = '🐰';
        }
        else if (values['algorithm_id'] === 'F11') {
            algorithmEmoji = '🐶';
        }
        else if (values['algorithm_id'] === 'F12') {
            algorithmEmoji = '🦊';
        }
        else {
            logger_1.default.warn('target algortihm_id가 아닙니다.');
            return false;
        }
        if (values['side'] === 'BUY') {
            sideEmoji = '⬆️';
            sideKorean = '매수';
        }
        else if (values['side'] === 'SELL') {
            sideEmoji = '⬇️';
            sideKorean = '매도';
        }
        if (values['total_score'] === 1) {
            power = '🌕🌑🌑🌑🌑';
        }
        else if (values['total_score'] === 2) {
            power = '🌕🌕🌑🌑🌑';
        }
        else if (values['total_score'] === 3) {
            power = '🌕🌕🌕🌑🌑';
        }
        else if (values['total_score'] === 4) {
            power = '🌕🌕🌕🌕🌑';
        }
        else if (values['total_score'] === 5) {
            power = '🌕🌕🌕🌕🌕';
        }
        else if (values['total_score'] === 0) {
            power = '🌑🌑🌑🌑🌑';
        }
        let processPrice = comma(Number(values['price']));
        const signalDate = moment(values['order_date']).format('YYYY-MM-DD HH:mm:ss');
        // values['order_date'] = moment(values['order_date'], 'YYYY-MM-DD HH:mm:ss');
        // let msg = `${replaceName} : ${values['side']}`
        let msg;
        if (tableType === 'real') {
            msg = `${algorithmEmoji} 신호 발생 [${signalDate}]
[${values['symbol']}]  <${sideKorean}> ${sideEmoji} 
${processPrice} ${market} 
추세강도 ${power}`;
        }
        else if (tableType === 'alpha') {
            msg = `[${values['symbol']}]  <${sideKorean}> ${sideEmoji} 
${algorithmEmoji} 신호 발생 [${signalDate}]
${processPrice} ${market} 
추세강도 ${power}`;
        }
        return msg;
    });
}
exports.processMsg = processMsg;
// 10000 => 10,000
function comma(num) {
    let len, point, str;
    num = num + "";
    point = num.length % 3;
    len = num.length;
    str = num.substring(0, point);
    while (point < len) {
        if (str != "")
            str += ",";
        str += num.substring(point, point + 3);
        point += 3;
    }
    return str;
}
exports.comma = comma;
// 메시지를 일정 시간 지연해서 보내줌 
function delayedTelegramMsgTransporter(result, index) {
    return __awaiter(this, void 0, void 0, function* () {
        if (result.length === index)
            return;
        const symbol = result[index]['symbol'];
        let tableType;
        if (symbol === 'BTC/KRW') {
            tableType = 'real';
        }
        else {
            tableType = 'alpha';
        }
        let msg = yield processMsg(result[index], tableType); // 메시지 문구 만들기 
        for (let idx in msg_modules) {
            try {
                msg_modules[idx](msg, symbol);
            }
            catch (error) {
                logger_1.default.warn('[MSG Transporters Error]', error);
            }
        }
        setTimeout(() => {
            delayedTelegramMsgTransporter(result, index + 1);
        }, 5000);
    });
}
exports.delayedTelegramMsgTransporter = delayedTelegramMsgTransporter;
function checkConditions(values, reqData, tableType, sendType) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('condition check');
        logger_1.default.info('tableType: ', tableType);
        const symbol = values['symbol'];
        const mode = values['mode'];
        // 알고리즘 ID 가 target id 인지 확인 
        const checkAlgo = yield condition_1.checkExistAlgo(values['algorithm_id'], reqData);
        // 이미 들어간 컬럼 있는지 확인
        const verifyFlag = yield condition_1.checkSameColumn(values, reqData, tableType);
        // 2분 이내에 발생된 신호인지 확인 => db에 넣지 않고 dev에 에러메시지 발생
        const lastFlag = yield condition_1.checkLast2min(values, reqData);
        // total_score, ord를 업데이트 하고 total_score가 valid한지 확인한다.
        values = yield condition_1.checkTotalScore(values, mode, reqData, tableType);
        // 동일 전략 동일 매매 확인 => values['valid_type'] = -1이 됨 
        values = yield condition_1.checkSameTrading(values, reqData, tableType);
        // 심볼의 이전 신호 중 send_date가 null이 있는지 확인 
        let sendFlag = yield condition_1.checkSendDateIsNull(symbol, tableType);
        if (!lastFlag || !checkAlgo || !verifyFlag) { // 이 3가지 case는 false인 경우 db에도 넣지 않는다.
            logger_1.default.warn('조건에 어긋나 DB에 저장하지 않고 종료합니다.');
            errorMSG_1.sendErrorMSG('조건에 어긋나 DB에 저장하지 않고 종료합니다.', symbol);
            return;
        }
        logger_1.default.info('DB task start');
        // DB 관련 모듈
        for (let index in db_modules) {
            try {
                db_modules[index](values, tableType); // tableType에 따라 저장할 테이블이 달라진다.
            }
            catch (error) {
                logger_1.default.warn('[DB Transporters Error]', error);
            }
        }
        logger_1.default.info('DB task success');
        if (values['valid_type'] === -1 || mode === 'silent' || !sendFlag) {
            logger_1.default.warn('valid type 이 -1 혹은 mode가 silent 입니다. (메시지 발송 X)');
            return;
        }
        // 텔레그램 신호 on / off 확인 
        const tgFlag = yield condition_1.checkTelegramFlag(symbol);
        const symbolFlag = yield condition_1.checkSymbolFlag(symbol);
        // 심볼별 신호 on / off 확인 
        if (!tgFlag || !symbolFlag) {
            logger_1.default.info(`텔레그램 메시지 or ${symbol} 발송 기능이 'Off' 상태입니다.`);
            return;
        }
        logger_1.default.info('msg start');
        // 메시지 관련 모듈 
        let msg;
        try {
            msg = yield processMsg(values, tableType); // 메시지 문구 만들기 
        }
        catch (error) {
            logger_1.default.warn('Msg Formating Error');
        }
        if (!msg) {
            return;
        }
        // symbol 별 채팅방 분리 
        let idx = 0;
        for (let key in msg_modules) {
            if (key != sendType)
                continue;
            values['send_date'] = values['order_date'];
            try {
                msg_modules[key](msg, tableType); // tableType에 따라 발송될 채널방이 달라진다.
                db_modules[idx](values, tableType); // tableType에 따라 저장할 테이블이 달라진다.
            }
            catch (error) {
                logger_1.default.warn('[MSG Transporters Error]', error);
            }
            idx++;
        }
    });
}
exports.checkConditions = checkConditions;
exports.default = router;
