import * as telegram from '../util/TelegramUtil'
import * as config from 'config';


const target: string = config.get('error-msg-target')

export function sendErrorMSG(msg) {
  let internal_msg = '[Signal Data Error MSG]: ' + msg;
  telegram.sendTo(target, internal_msg)
}
