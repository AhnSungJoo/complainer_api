'use strict';
import logger from '../util/logger';
import * as request from 'request';

export async function sendSlackWebHook() {
  try {
    const url = "https://hooks.slack.com/services/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";
      //console.log('fullUrl : ' + fullUrl);
      return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
          if (err) {
            logger.info(err);
          }
          else {
            resolve();
          }
          // return res && res.statusCode
          // console.log('TelegramUtil : statusCode=', res && res.statusCode);
        });
      })
    } catch(err) {
      logger.info(err);
    }
}
