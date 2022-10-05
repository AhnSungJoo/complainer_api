'use strict';
import logger from '../util/logger';
import * as request from 'request';

export async function sendSlackWebHook() {
  try {
    const url = "https://hooks.slack.com/services/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";

    let options = {
      uri: url,
      method: 'POST',
      body:{
        "text" : "gogo"
      },
      json:true //json으로 보낼경우 true로 해주어야 header값이 json으로 설정됩니다.
  };
      return new Promise((resolve, reject) => {
        request(options, (err, res, body) => {
          if (err) {
            logger.info(err);
          }
          else {
            resolve();
          }
          // return res && res.statusCode
          // console.log('TelegramUtil : statusCode=', res && res.statusCode);
          logger.info(res.statusCode);
        });
      })
    } catch(err) {
      logger.info(err);
    }
}
