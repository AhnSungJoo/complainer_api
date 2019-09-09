import * as telegram from '../util/TelegramUtil'
import * as config from 'config';

const target: string = config.get('internal-msg-target');

export function sendInternalMSG(msg) {
  let internal_msg = '[Internal MSG] > ' + msg;
  telegram.sendTo(target, internal_msg)
}

export function sendInternalErrorMSG(msg) {
  let internal_msg = '[Internal Error MSG] > ' + msg;
  telegram.sendTo(target, internal_msg)
}
