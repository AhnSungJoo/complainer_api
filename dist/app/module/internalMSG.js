"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram = require("../util/TelegramUtil");
const config = require("config");
const target = config.get('internal-msg-target');
function sendInternalMSG(msg) {
    let internal_msg = '[Internal MSG] > ' + msg;
    telegram.sendTo(target, internal_msg);
}
exports.sendInternalMSG = sendInternalMSG;
