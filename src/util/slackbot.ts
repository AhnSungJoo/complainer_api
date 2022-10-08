import logger from '../util/logger';
import * as slackHook from '@slack/webhook';
 
export async function sendSlackWebHook(msg) {
  try {
    const url = "https://hooks.slack.com/services/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";
    const webhook = new slackHook.IncomingWebhook(url);

    await webhook.send({
      text: msg,
    });
    } catch(err) {
      logger.info(err);
    }
}
