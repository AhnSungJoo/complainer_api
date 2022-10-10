import logger from '../util/logger';
import * as slackHook from '@slack/webhook';
import {returnbase} from './slackconfig';

export async function sendSlackWebHook(msg) {
  try {
    const url = returnbase();
    const webhook = new slackHook.IncomingWebhook(url);

    await webhook.send({
      text: msg,
    });
    } catch(err) {
      logger.info(err);
    }
}
