import logger from '../util/logger';
import * as request from 'request';

export async function sendSlackWebHook() {
  try {
    const url = "https://hooks.slack.com/services/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";
      return new Promise((resolve, reject) => {
        request({
          headers: {
            'Content-Type': 'application/json',
          },
          url: url,
          body:{
            "text" : "plz send.."
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
          logger.info(`res: ${res.statusCode}`); // always 404...
        });
      })
    } catch(err) {
      logger.info(err);
    }
}
