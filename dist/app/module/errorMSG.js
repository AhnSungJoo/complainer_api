"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram = require("../util/TelegramUtil");
const settingConfig = require("config");
const symbols = settingConfig.get('symbol');
function sendErrorMSG(msg, symbol) {
    let internal_msg = '[Signal Data Error MSG]: ' + msg;
    symbol = symbol.replace('_', '/'); // BTC/KRW => BTC_KRW
    const symbolInfo = symbols[symbol];
    const errorTarget = symbolInfo['error-msg-target'];
    for (let index in errorTarget) {
        telegram.sendTo(errorTarget[index], msg);
    }
}
exports.sendErrorMSG = sendErrorMSG;
