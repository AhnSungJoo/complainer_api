'use strict';
import logger from '../util/logger';


export function sendSlackWebHook() {
  const { IncomingWebhook } = require('@slack/client');
  const url = "https://hooks.slack.com/services/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";
  const webhook = new IncomingWebhook(url);
  let data = "hi there"
  // Send simple text to the webhook channel
  webhook.send(data, function(err, res) {
      if (err) {
          logger.info(`Error: ${err}`);
      } else {
          console.log('Message sent: ', res);
      }
  });
  
}
