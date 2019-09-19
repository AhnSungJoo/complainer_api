import * as telegram from '../util/TelegramUtil'
import * as settingConfig from 'config';

const symbols: any = settingConfig.get('symbol');

export function sendErrorMSG(msg, symbol) {
  let internal_msg = '[Signal Data Error MSG]: ' + msg;
  symbol = symbol.replace('_', '/'); // BTC/KRW => BTC_KRW
  const symbolInfo: any = symbols[symbol];
  const errorTarget = symbolInfo['error-msg-target'];
  for (let index in errorTarget) {
    telegram.sendTo(errorTarget[index], msg)
  }
}
