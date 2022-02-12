import * as telegram from '../util/TelegramUtil'
import * as config from 'config';

const target: string = config.get('external-msg-target');

export function sendExternalMSG(msg) {
  let external_msg = '[External MSG] > ' + msg;
  telegram.sendTo(target, external_msg)
}
