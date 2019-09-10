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
const externalMSG_1 = require("../module/externalMSG");
const errorMSG_1 = require("../module/errorMSG");
const insertDB_1 = require("../module/insertDB");
// dao
const signalDAO_1 = require("../dao/signalDAO");
const nameDAO_1 = require("../dao/nameDAO");
const db_modules = [insertDB_1.upsertData];
const msg_modules = [externalMSG_1.sendExternalMSG]; // 텔레그램 알림 모음 (내부 / 외부)
const router = new Router();
// POST Data 받기 
router.post('/signal', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    logger_1.default.info('Signal Process Start');
    logger_1.default.info('Client IP: ' + ctx.ip);
    logger_1.default.info('Request Data: ', ctx.request.body.data);
    let reqData = ctx.request.body.data;
    const mode = reqData['mode'];
    const params = settingConfig.get('params');
    const rangeTime = settingConfig.get('range_time_days');
    // let curTime = moment().format(); // api call 받은 시간을 DB에 저장 
    const signDAO = new signalDAO_1.default();
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
    let chekcAlgo = yield checkExistAlgo(values['algorithm_id']);
    if (!chekcAlgo) {
        logger_1.default.warn('Target algorithm ID가 아닙니다.');
        errorMSG_1.sendErrorMSG('Target algorithm ID가 아닙니다.');
        return ctx.body = { result: false };
    }
    // values['order_date'] = curTime; // api call 받은 시간을 DB에 저장 
    // 이미 들어간 컬럼 있는지 확인
    // 지금은 중복된 데이터가 있으면 DB, MSG 모둘을 실행하지 않지만
    // 추후엔 기능 변화로 수정될 수 있음 
    const verifyFlag = yield checkSameColumn(values);
    if (!verifyFlag) {
        logger_1.default.warn('중복된 컬럼입니다.');
        return;
    }
    let lastResult = yield signDAO.getSpecificTotalScore(values['symbol']);
    let lastScore, lastOrd;
    if (!lastResult || lastResult.length < 1) {
        lastScore = 0;
        values['ord'] = 0;
    }
    else {
        lastScore = lastResult[0]['total_score'];
        lastOrd = lastResult[0]['ord'];
        values['ord'] = lastOrd + 1;
    }
    if (values['side'] === 'BUY') {
        if (lastScore >= 5 && mode != 'silent') {
            logger_1.default.warn('total score가 5를 초과합니다.');
            errorMSG_1.sendErrorMSG('total_Score가 5를 초과했습니다. req_data: ' + JSON.stringify(reqData));
            values['valid_type'] = -1;
        }
        values['total_score'] = lastScore + 1;
    }
    else if (values['side'] === 'SELL' && mode != 'silent') {
        if (lastScore <= 0) {
            logger_1.default.warn('total score가  음수가 됩니다.');
            errorMSG_1.sendErrorMSG('total_score가 음수가 됩니다. req_data: ' + JSON.stringify(reqData));
            values['valid_type'] = -1;
        }
        values['total_score'] = lastScore - 1;
    }
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
        logger_1.default.warn('valid type 이 -1 혹은 mode가 silent 입니다.');
        return;
    }
    let t1 = moment(values['order_date'], 'YYYY-MM-DD HH:mm:ss');
    let t2 = moment();
    let diffDays = moment.duration(t2.diff(t1)).asDays();
    if (diffDays > rangeTime) {
        logger_1.default.warn('신호의 날짜가 일정 주기를 넘어섭니다.');
        return;
    }
    // 메시지 관련 모듈 
    let msg;
    try {
        msg = yield processMsg(values); // 메시지 문구 만들기 
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
// 메시지 포맷팅 함수
function processMsg(values) {
    return __awaiter(this, void 0, void 0, function* () {
        const namesDAO = new nameDAO_1.default();
        // const data = await namesDAO.getReplaceName(values['algorithm_id']); // param: values.algortihm_id
        // const replaceName = data['algorithm_name']
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
        let msg = `${algorithmEmoji} 신호 발생 [${signalDate}]
[${values['symbol']}]  <${sideKorean}> ${sideEmoji} 
${processPrice} ${market} 
추세강도 ${power}`;
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
// Signal Data가 이미 들어간 컬럼인지 확인 
function checkSameColumn(result) {
    return __awaiter(this, void 0, void 0, function* () {
        const dao = new signalDAO_1.default();
        const data = yield dao.checkColumn(result['algorithm_id'], result['order_date'], result['side'], result['symbol']);
        if (data.cnt >= 1)
            return false;
        else
            return true;
    });
}
exports.checkSameColumn = checkSameColumn;
// 메시지를 일정 시간 지연해서 보내줌 
function delayedTelegramMsgTransporter(result, index) {
    return __awaiter(this, void 0, void 0, function* () {
        if (result.length === index)
            return;
        let msg = yield processMsg(result[index]); // 메시지 문구 만들기 
        for (let idx in msg_modules) {
            try {
                msg_modules[idx](msg);
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
function checkExistAlgo(algorithmId) {
    return __awaiter(this, void 0, void 0, function* () {
        let cnt = 0;
        const namesDAO = new nameDAO_1.default();
        const algoList = yield namesDAO.getAllNameList();
        for (let index in algoList) {
            if (algoList[index]['algorithm_id'] === algorithmId)
                cnt += 1;
        }
        if (cnt === 0) {
            return false;
        }
        return true;
    });
}
exports.default = router;
