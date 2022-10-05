'use strict';
import logger from '../util/logger';
import * as request from 'request';

export async function sendSlackWebHook() {
  try {
    const url = "https://hooks.slack.com/services/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";
    let payload = {"text" : "why?!!!"};
    //console.log('fullUrl : ' + fullUrl);
      return new Promise((resolve, reject) => {
        request(url, payload, (err, res, body) => {
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
