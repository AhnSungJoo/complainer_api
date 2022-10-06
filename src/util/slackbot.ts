'use strict';
import logger from '../util/logger';
import * as request from 'request';

export async function sendSlackWebHook() {
  try {
    const url = "https://hooks.slack.com/services/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";
      //console.log('fullUrl : ' + fullUrl);
      return new Promise((resolve, reject) => {
        request({
          headers: {
            'Content-Type': 'application/json',
            'User-Agent' : 'request'
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
