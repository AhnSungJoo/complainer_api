"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const settingConfig = require("config");
// dao
const signalDAO_1 = require("../dao/signalDAO");
const flagDAO_1 = require("../dao/flagDAO");
const nameDAO_1 = require("../dao/nameDAO");
const logger_1 = require("../util/logger");
const errorMSG_1 = require("./errorMSG");
// 알고리즘 ID가 target id인지 확인 
// fasle인 경우 DB 저장 X
function checkExistAlgo(algorithmId, reqData) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('알고리즘 ID가 target id인지 확인합니다.');
        let cnt = 0;
        const namesDAO = new nameDAO_1.default();
        const algoList = yield namesDAO.getAllNameList();
        const symbol = reqData['symbol'];
        for (let index in algoList) {
            if (algoList[index]['algorithm_id'] === algorithmId)
                cnt += 1;
        }
        if (cnt === 0) {
            logger_1.default.warn('Target algorithm ID가 아닙니다.');
            errorMSG_1.sendErrorMSG('Target algorithm ID가 아닙니다.' + JSON.stringify(reqData), symbol);
            return false;
        }
        return true;
    });
}
exports.checkExistAlgo = checkExistAlgo;
// Signal Data가 이미 들어간 컬럼인지 확인 
// fasle인 경우 DB 저장 X
function checkSameColumn(result, reqData, tableType) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('중복되는 signal data인지 확인합니다.');
        const dao = new signalDAO_1.default(tableType);
        const data = yield dao.checkColumn(result['algorithm_id'], result['order_date'], result['side'], result['symbol']);
        const symbol = reqData['symbol'];
        if (data.cnt >= 1) {
            logger_1.default.warn('중복된 컬럼입니다.');
            errorMSG_1.sendErrorMSG('중복된 컬럼입니다.' + JSON.stringify(reqData), symbol);
            return false;
        }
        else {
            return true;
        }
    });
}
exports.checkSameColumn = checkSameColumn;
// 2분 이내에 발생한 신호인지 확인
// fasle인 경우 DB 저장 X
function checkLast2min(values, reqData) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('2분 이내에 발생한 Signal인지 확인합니다.');
        const rangeTime = settingConfig.get('range_time_min');
        const flag = new flagDAO_1.default();
        const flagData = yield flag.getFlag('last');
        const lastFlag = flagData[0]['flag'];
        const symbol = reqData['symbol'];
        let t1 = moment(values['order_date'], 'YYYY-MM-DD HH:mm:ss');
        let t2 = moment();
        let diffDays = moment.duration(t2.diff(t1)).asMinutes();
        console.log(diffDays);
        if (diffDays > rangeTime && lastFlag === 'on') {
            logger_1.default.warn('신호의 날짜가 일정 주기를 넘어섭니다.');
            errorMSG_1.sendErrorMSG('2분이 지난 Signal Data가 들어왔습니다. req_data: ' + JSON.stringify(reqData), symbol);
            return false;
        }
        return true;
    });
}
exports.checkLast2min = checkLast2min;
// 각 전략별 심볼의 최신 total_score, ord 를 가져온다.
// checkTotalScore에서 사용
function getTotalScore(values, tableType) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('특정 symbol별 가장 최근의 total_score, ord를 가져옵니다.');
        const signDAO = new signalDAO_1.default(tableType);
        let lastResult = yield signDAO.getSpecificTotalScore(values['symbol']);
        let lastScore, lastOrd;
        if (!lastResult || lastResult.length < 1) { // 보통 처음 컬럼이 들어가는 경우 
            lastScore = 0;
            lastOrd = 0;
        }
        else { // lastResult 가 존재하는 경우 => 컬럼이 있는경우
            lastScore = lastResult[0]['total_score'];
            lastOrd = lastResult[0]['ord'];
            lastOrd = lastOrd + 1;
        }
        return { lastScore, lastOrd };
    });
}
exports.getTotalScore = getTotalScore;
// 종목점수가 5가 넘어가거니 0 아래로 떨어지는 지 확인
// 5를 넘거나 0을 넘으면 ord, valid_type 을 -1로 변경
// 텔레그램 메시지 발송 X
function checkTotalScore(values, mode, reqData, tableType) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('total score가 5가 넘거나 0 아래로 떨어지는지 확인합니다.');
        const result = yield getTotalScore(values, tableType);
        const symbol = reqData['symbol'];
        const lastScore = result['lastScore'];
        const lastOrd = result['lastOrd'];
        values['ord'] = lastOrd;
        if (values['side'] === 'BUY') {
            if (lastScore >= 5 && mode != 'silent') {
                logger_1.default.warn('total score가 5를 초과합니다.');
                errorMSG_1.sendErrorMSG('total_Score가 5를 초과했습니다. req_data: ' + JSON.stringify(reqData), symbol);
                values['valid_type'] = -1;
                values['ord'] = -1;
            }
            values['total_score'] = lastScore + 1;
        }
        else if (values['side'] === 'SELL' && mode != 'silent') {
            if (lastScore <= 0) {
                logger_1.default.warn('total score가  음수가 됩니다.');
                errorMSG_1.sendErrorMSG('total_score가 음수가 됩니다. req_data: ' + JSON.stringify(reqData), symbol);
                values['valid_type'] = -1;
                values['ord'] = -1;
            }
            values['total_score'] = lastScore - 1;
        }
        return values;
    });
}
exports.checkTotalScore = checkTotalScore;
// 동일 전략의 동일 매매 신호가 왔는지 확인
// ex) 3번 전략 매수 신호 후 매도가 안된 상태에서 다시 매수 신호가 온 경우 
// ord, valid_type 을 -1로 변경 후 텔레그램 메시지 발송 X 
function checkSameTrading(values, reqData, tableType) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('동일 전략 동일 매매인지 확인합니다.');
        const signDAO = new signalDAO_1.default(tableType);
        const data = yield signDAO.getLastSideEachAlgorithm(values['algorithm_id'], values['symbol']);
        const symbol = reqData['symbol'];
        if (!data || data.length < 1) {
            logger_1.default.info('[checkSameTrading] 해당 전략 & 심볼에 side가 없습니다. => 처음 들어온 전략 ');
            // 특정 전략의 심볼의 첫 신호가 SELL 이 들어온 경우 
            if (values['side'] === 'SELL') {
                logger_1.default.warn('BUY 신호가 없는데 SELL 신호가 발생했습니다.');
                errorMSG_1.sendErrorMSG('BUY 신호가 없는데 SELL 신호가 발생했습니다. req_data: ' + JSON.stringify(reqData), symbol);
                values['valid_type'] = -1;
                values['ord'] = -1;
            }
            return values;
        }
        // BUY 신호 다음 BUY가 들어오거나 / SELL 신호 다음 SELL 신호가 들어온 경우 
        if (data[0]['side'] === values['side']) {
            logger_1.default.warn('동일 전략에 동일 매매 신호가 발생했습니다.');
            errorMSG_1.sendErrorMSG('동일 전략에 동일 매매 신호가 발생했습니다. req_data: ' + JSON.stringify(reqData), symbol);
            values['valid_type'] = -1;
            values['ord'] = -1;
        }
        return values;
    });
}
exports.checkSameTrading = checkSameTrading;
// 텔레그램 메시지 발송이 켜져 있는지 (On) 꺼져 있는지 (Off) 확인
// 꺼져있다면 어떤 경우든 텔레그램 메시지를 발송하지 않음 
function checkTelegramFlag(symbol) {
    return __awaiter(this, void 0, void 0, function* () {
        const flag = new flagDAO_1.default();
        const tgFlag = yield flag.getFlag('tg');
        if (tgFlag[0]['flag'] === 'off') {
            logger_1.default.warn('현재 텔레그램 신호가 꺼져있는 상태입니다.');
            errorMSG_1.sendErrorMSG('현재 텔레그램 신호가 꺼져있는 상태입니다.', symbol);
            return false;
        }
        return true;
    });
}
exports.checkTelegramFlag = checkTelegramFlag;
function checkSymbolFlag(symbol) {
    return __awaiter(this, void 0, void 0, function* () {
        const flag = new flagDAO_1.default();
        symbol = symbol.replace('/', '_'); // BTC/KRW => BTC_KRW
        const tgFlag = yield flag.getSymbolFlag(symbol);
        if (tgFlag[0]['flag'] === 'off') {
            logger_1.default.warn(`현재 ${symbol}의  텔레그램 신호가 꺼져있는 상태입니다.`);
            errorMSG_1.sendErrorMSG(`현재 ${symbol}의  텔레그램 신호가 꺼져있는 상태입니다.`, symbol);
            return false;
        }
        return true;
    });
}
exports.checkSymbolFlag = checkSymbolFlag;
function checkSendDateIsNull(symbol, tableType) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info(`${symbol}의 신호 중 send_date가 null이 있는지 확인합니다.`);
        const signDAO = new signalDAO_1.default(tableType);
        const data = yield signDAO.getSendDateIsNull(symbol);
        if (data['cnt'] >= 1) {
            logger_1.default.warn(`${symbol}의 신호 중 send_date가 null이 있습니다.`);
            errorMSG_1.sendErrorMSG(`현재 ${symbol}의 신호 중 send_date가 null이 있습니다.`, symbol);
            return false;
        }
        return true;
    });
}
exports.checkSendDateIsNull = checkSendDateIsNull;
