'use strict';

import * as os from 'os';
import * as config from 'config';
import * as util from 'util';
import * as request from 'request';
import * as moment from 'moment';
import * as sleep from 'sleep';
import { resolve } from 'dns';

export enum TelegramBot { MON='mon', JI='ji', PNEWS='pnews' };


const botTokens = {
  'ji': '302755456:AAHJSyuG9IdPhA_LeM5I07xp4BiWBFZ2AVI',
  'pnews': '752333489:AAFgdDfSvKRG68TH0K609wI6MCC8d7RJLvg',
  'harry': '752333489:AAFgdDfSvKRG68TH0K609wI6MCC8d7RJLvg',
  'secret': '752333489:AAFgdDfSvKRG68TH0K609wI6MCC8d7RJLvg',
  'CryptoQuant': '907560650:AAGPFF9XTX5WseVazGG55R19js4_1xETtrk',
  'CrpytoQuantMul': '907560650:AAGPFF9XTX5WseVazGG55R19js4_1xETtrk',
  'dev': '223922635:AAG_9dSNTictlAveD3im1AcGLtaFU_Cy6f8'
}

const chatIDs = {
  'ji': '-1001059764764',
  'pnews': '-306581817',
  'harry': '-296108432',
  'secret': '-1001286017289',
  'CryptoQuant': '-1001449664940',
  'CrpytoQuantMul': '-1001491172902',
  'dev': '-156432997'
}

const queue = [];

function _sendSavedMsgs() {
  if (queue.length > 0) {
    const { token, chatId, msg } = queue.shift();
    
    console.log('_sendSavedMsgs here')
    _sendMsg(token, chatId, msg);

    setImmediate(() => {
      _sendSavedMsgs();
    })
  }
}

async function _sendMsg(token: string, chatId: string, msg: string) {
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
        // resolve();
      }
      // return res && res.statusCode
      // console.log('TelegramUtil : statusCode=', res && res.statusCode);
    });
  })
}

function writeLog(...args: Array<any>) {
  const now = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
  const text = util.format.apply(null, args as any);
  console.log(`[${now}] [TelegramUtil] ${text}`);
}

export function sendToBy(target: string, bot: TelegramBot, msg: string) {
  _sendMsg(botTokens[bot], chatIDs[target], msg);
}

export async function sendTo(target: string, msg: string) {
  if (botTokens[target]) {
    const result = await _sendMsg(botTokens[target], chatIDs[target], msg);
    // return result;
  }

  else
    writeLog('Target ${target} does not exist on the sender list');
}
