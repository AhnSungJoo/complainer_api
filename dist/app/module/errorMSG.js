"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram = require("../util/TelegramUtil");
const config = require("config");
const target = config.get('error-msg-target');
function sendErrorMSG(msg) {
    let internal_msg = '[Signal Data Error MSG]: ' + msg;
    telegram.sendTo(target, internal_msg);
}
exports.sendErrorMSG = sendErrorMSG;
