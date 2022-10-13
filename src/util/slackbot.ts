import logger from '../util/logger';
import * as slackHook from '@slack/webhook';
import {returnURL} from './slackconfig';

export async function sendSlackWebHook(msg, botType) {
  try {
    const url = returnURL(botType); // 프로불편러 or 얼마빌렸지
    const webhook = new slackHook.IncomingWebhook(url);

    await webhook.send({
      text: msg,
    });
    } catch(err) {
      logger.info(err);
    }
}
