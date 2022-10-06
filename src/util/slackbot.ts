import logger from '../util/logger';
import * as request from 'request';

export async function sendSlackWebHook() {
  try {
    /*
    const url = "https://hooks.slack.com/services/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";
      //console.log('fullUrl : ' + fullUrl);
      return new Promise((resolve, reject) => {
        request({
          headers: {
            'Content-Type': 'application/json'
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
    */
   let Slack = require('slack-node');

  const wecbhookUri = "https://hooks.slack.com/services/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";

  const slack = new Slack();
  slack.setWebhook(wecbhookUri);

  slack.webhook({
      channel: "#봇테스트",	// 현 슬랙의 채널
      username: "불편이", // 슬랙에서 보여질 웹훅 이름
      text: "테스트222"	//텍스트
  }, function (err, response) {
      console.log(response);
  });
}
