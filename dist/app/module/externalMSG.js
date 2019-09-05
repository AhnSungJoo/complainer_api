"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram = require("../util/TelegramUtil");
const config = require("config");
const target = config.get('external-msg-target');
function sendExternalMSG(msg) {
    let external_msg = '[External MSG] > ' + msg;
    telegram.sendTo(target, external_msg);
}
exports.sendExternalMSG = sendExternalMSG;
