"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram = require("../util/TelegramUtil");
const config = require("config");
const tables = config.get('table-type');
function sendInternalMSG(msg, tableType) {
    // let internal_msg = '[Internal MSG] > ' + msg;
    const tableInfo = tables[tableType];
    const target = tableInfo['internal-msg-target'];
    for (let index in target) {
        telegram.sendTo(target[index], msg);
    }
}
exports.sendInternalMSG = sendInternalMSG;
function sendInternalErrorMSG(msg, tableType) {
    let internal_msg = '[Internal Error MSG] > ' + msg;
    const tableInfo = tables[tableType];
    telegram.sendTo(tableInfo['internal-msg-target'], internal_msg);
}
exports.sendInternalErrorMSG = sendInternalErrorMSG;
