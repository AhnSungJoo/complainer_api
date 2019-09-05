'use strict';
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
    'secret': '752333489:AAFgdDfSvKRG68TH0K609wI6MCC8d7RJLvg'
};
const chatIDs = {
    'ji': '-1001059764764',
    'pnews': '-306581817',
    'harry': '-296108432',
    'secret': '-1001286017289'
};
const queue = [];
function _sendSavedMsgs() {
    if (queue.length > 0) {
        const { token, chatId, msg } = queue.shift();
        _sendMsg(token, chatId, msg);
        setImmediate(() => {
            _sendSavedMsgs();
        });
    }
}
function _sendMsg(token, chatId, msg) {
    const appName = config.get('name');
    msg = `${msg}`;
    const parameters = `chat_id=${chatId}&text=${encodeURI(msg)}`;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const fullUrl = url + '?' + parameters;
    //console.log('fullUrl : ' + fullUrl);
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
        }
        //console.log('TelegramUtil : statusCode=', res && res.statusCode);
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
    if (botTokens[target])
        _sendMsg(botTokens[target], chatIDs[target], msg);
    else
        writeLog('Target ${target} does not exist on the sender list');
}
exports.sendTo = sendTo;
