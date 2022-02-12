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
const telegram = require("../util/TelegramUtil");
const config = require("config");
const tables = config.get('table-type');
function sendInternalMSG(msg, tableType) {
    return __awaiter(this, void 0, void 0, function* () {
        // let internal_msg = '[Internal MSG] > ' + msg;
        const tableInfo = tables[tableType];
        const target = tableInfo['internal-msg-target'];
        for (let index in target) {
            yield telegram.sendTo(target[index], msg);
        }
    });
}
exports.sendInternalMSG = sendInternalMSG;
function sendInternalErrorMSG(msg, tableType) {
    let internal_msg = '[Internal Error MSG] > ' + msg;
    const tableInfo = tables[tableType];
    telegram.sendTo(tableInfo['internal-msg-target'], internal_msg);
}
exports.sendInternalErrorMSG = sendInternalErrorMSG;
