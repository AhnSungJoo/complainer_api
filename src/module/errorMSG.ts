import * as telegram from '../util/TelegramUtil'
import * as settingConfig from 'config';

const tables: any = settingConfig.get('table-type');

export function sendErrorMSG(msg, tableType) {
  let internal_msg = '[Signal Data Error MSG]: ' + msg;

  const tableInfo: any = tables[tableType];
  const target = tableInfo['error-msg-target'];
  for (let index in target) {
    telegram.sendTo(target[index], msg)
  }
}
