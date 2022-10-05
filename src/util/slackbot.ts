'use strict';
import logger from '../util/logger';


export async function sendSlackWebHook() {
  try {
  const { IncomingWebhook } = require('@slack/client');
  const url = "https://hooks.slack.com/services/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";

  const webhook = new IncomingWebhook(url);
  let data = "hi there"
    logger.info(`webhook : ${webhook}`);
    logger.info(data);
    // Send simple text to the webhook channel
    webhook.send(data, function(err, res) {
      logger.info('send');
          if (err) {
              logger.info(`Error: ${err}`);
          } else {
              logger.info('Message sent: ', res);
          }
    });
  } catch(err) {
    logger.info(err);
  }
}
