"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram = require("../util/TelegramUtil");
const settingConfig = require("config");
const tables = settingConfig.get('table-type');
function sendErrorMSG(msg, tableType) {
    let internal_msg = '[Signal Data Error MSG]: ' + msg;
    const tableInfo = tables[tableType];
    const target = tableInfo['error-msg-target'];
    for (let index in target) {
        telegram.sendTo(target[index], msg);
    }
}
exports.sendErrorMSG = sendErrorMSG;
