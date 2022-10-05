'use strict';
import logger from '../util/logger';
import * as request from 'request';

export async function sendSlackWebHook() {
  try {
    const url = "https://hooks.slack.com/services/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";
      request({
        headers: {
          'Content-Type': 'application/json'
        },
        uri: url,
        body:{
          "text" : "gogo"
        },
        method: 'POST',
        json: true
      }, function (err, res, body) {
        //it works!
        logger.info(`res: ${res.statusCode}`);
      });
    } catch(err) {
      logger.info(err);
    }
}
