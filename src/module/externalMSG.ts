import * as telegram from '../util/TelegramUtil'
import * as config from 'config';

const tables: any = config.get('table-type');

export async function sendExternalMSG(msg, tableType) {
  let external_msg = msg;
  // 심볼별 target 
  const tableInfo: any = tables[tableType];
  const target = tableInfo['external-msg-target'];
  for (let index in target) {
    await telegram.sendTo(target[index], msg);
  }
}
