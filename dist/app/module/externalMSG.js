"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram = require("../util/TelegramUtil");
const config = require("config");
const tables = config.get('table-type');
function sendExternalMSG(msg, tableType) {
    let external_msg = msg;
    // 심볼별 target 
    const tableInfo = tables[tableType];
    const target = tableInfo['external-msg-target'];
    for (let index in target) {
        telegram.sendTo(target[index], msg);
    }
}
exports.sendExternalMSG = sendExternalMSG;
