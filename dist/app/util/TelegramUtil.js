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
const config = require("config");
const util = require("util");
const request = require("request");
const moment = require("moment");
var TelegramBot;
(function (TelegramBot) {
    TelegramBot["MON"] = "mon";
    TelegramBot["JI"] = "ji";
    TelegramBot["PNEWS"] = "pnews";
})(TelegramBot = exports.TelegramBot || (exports.TelegramBot = {}));
;
const botTokens = {
    'ji': '302755456:AAHJSyuG9IdPhA_LeM5I07xp4BiWBFZ2AVI',
    'pnews': '752333489:AAFgdDfSvKRG68TH0K609wI6MCC8d7RJLvg',
    'harry': '752333489:AAFgdDfSvKRG68TH0K609wI6MCC8d7RJLvg',
    'secret': '752333489:AAFgdDfSvKRG68TH0K609wI6MCC8d7RJLvg',
    'CryptoQuant': '907560650:AAGPFF9XTX5WseVazGG55R19js4_1xETtrk',
    'CrpytoQuantMul': '907560650:AAGPFF9XTX5WseVazGG55R19js4_1xETtrk',
    'dev': '223922635:AAG_9dSNTictlAveD3im1AcGLtaFU_Cy6f8'
};
const chatIDs = {
    'ji': '-1001059764764',
    'pnews': '-306581817',
    'harry': '-296108432',
    'secret': '-1001286017289',
    'CryptoQuant': '-1001449664940',
    'CrpytoQuantMul': '-1001491172902',
    'dev': '-156432997'
};
const queue = [];
function _sendSavedMsgs() {
    if (queue.length > 0) {
        const { token, chatId, msg } = queue.shift();
        console.log('_sendSavedMsgs here');
        _sendMsg(token, chatId, msg);
        setImmediate(() => {
            _sendSavedMsgs();
        });
    }
}
function _sendMsg(token, chatId, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        const appName = config.get('name');
        msg = `${msg}`;
        const parameters = `chat_id=${chatId}&text=${encodeURI(msg)}`;
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const fullUrl = url + '?' + parameters;
        //console.log('fullUrl : ' + fullUrl);
        return new Promise((resolve, reject) => {
            request(fullUrl, (err, res, body) => {
                if (err) {
                    writeLog(`FAILED to send msg. ${err}`);
                    if (queue.length > 50) {
                        const { _, msg } = queue.shift();
                        writeLog('Unsent msg:', msg);
                    }
                    queue.push({ token, chatId, msg });
                    _sendSavedMsgs();
                }
                else {
                    resolve();
                }
                // return res && res.statusCode
                // console.log('TelegramUtil : statusCode=', res && res.statusCode);
            });
        });
    });
}
function writeLog(...args) {
    const now = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    const text = util.format.apply(null, args);
    console.log(`[${now}] [TelegramUtil] ${text}`);
}
function sendToBy(target, bot, msg) {
    _sendMsg(botTokens[bot], chatIDs[target], msg);
}
exports.sendToBy = sendToBy;
function sendTo(target, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (botTokens[target]) {
            const result = yield _sendMsg(botTokens[target], chatIDs[target], msg);
            // return result;
        }
        else
            writeLog('Target ${target} does not exist on the sender list');
    });
}
exports.sendTo = sendTo;
