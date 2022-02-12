import * as telegram from '../util/TelegramUtil'
import * as config from 'config';

const tables: any = config.get('table-type');

export async function sendInternalMSG(msg, tableType) {
  // let internal_msg = '[Internal MSG] > ' + msg;
  const tableInfo: any = tables[tableType];
  const target = tableInfo['internal-msg-target'];

  for (let index in target) {
    await telegram.sendTo(target[index], msg)
  }
}

export function sendInternalErrorMSG(msg, tableType) {
  let internal_msg = '[Internal Error MSG] > ' + msg;
  const tableInfo: any = tables[tableType];
  telegram.sendTo(tableInfo['internal-msg-target'], internal_msg)
}
