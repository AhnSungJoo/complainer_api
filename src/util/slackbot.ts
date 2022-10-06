import logger from '../util/logger';
import * as request from 'request';

export async function sendSlackWebHook() {
  try {
    const slackToken = `xoxb-4033740111041-4179044897829-mNGwmTogdP7Y6qq4LnohzK65`;
    const url = "https://hooks.slack.com/services/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";
      //console.log('fullUrl : ' + fullUrl);
      return new Promise((resolve, reject) => {
        request({
          headers: {
            'Content-Type': 'application/json',
            'authorization' : `Bearer ${slackToken}`
          },
          url: url,
          body:{
            "text" : "gogo"
          },
          method: 'POST',
          json: true
        }, (err, res, body) => {
          if (err) {
            logger.info(err);
          }
          else {
            resolve();
          }
          // return res && res.statusCode
          // console.log('TelegramUtil : statusCode=', res && res.statusCode);
          logger.info(`res: ${res.statusCode}`);
        });
      })
    } catch(err) {
      logger.info(err);
    }
}
