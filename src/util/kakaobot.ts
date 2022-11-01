import logger from './logger';
import * as kconfig from './kakaoconfig';
import * as request from 'request';
import { json } from 'body-parser';

export async function sendKaKaoEventAPI(eventName, userId, msg, flag) {
  try {
    const apiUrl = kconfig.returnbase(flag);
    const apiKey = kconfig.returnApiKey(flag);
    logger.info(`apiUrl : ${apiUrl}`);
    logger.info(`apiKey : ${apiKey}`);
    let eventReq = {
      "name" : eventName, // 블록 이벤트 명 ${evnetName}
      "data" : { // optional
        "msg" : msg // ${msg} 말풍선 : {{#current.event.data.paramName}} => {{#current.event.data.msg}} => 파라미터 동일하게 설정
      }
    }
    // ${userId}, ex) {"type": "botUserKey", "id": "fdc236a66636a5f21bcdf3b4589ac2318b3373528cbdcb5c2362f3cc7a4c3f05c9"} 
    /* two more values 
      [
        {"type": "botUserKey", "id": "fdc236a66636a5f21bcdf3b4589ac2318b3373528cbdcb5c2362f3cc7a4c3f05c9"},
        {"type": "botUserKey", "id": "fdc236a66636a5f21bcdf3b4589ac2318b3373528cbdcb5c2362f3cc7a4c3f05c9"} 
      ]

    */
    let userReq = [
      {"type": "botUserKey", "id": userId} 
    ]
    let paramReq = { // optional but 
      "foo": "bar"
    }
    const data: any = {
      event : eventReq,
      user: userReq,
      params: paramReq
    }

    const options = {
      url: apiUrl,
      method: 'POST',
      headers: {
        Authorization : 'KakaoAK ' + apiKey,
        'Content-type': 'application/json',
      },
      body : data,
      json: true
    }

    //console.log('fullUrl:', fullUrl)
    return new Promise((resolve, reject) => {
      request(options, (err, res, body) => {
        if (err) {
          logger.info(err);
          resolve({ ok: false, err })          
        } else {
          logger.info('status: ', res);
          resolve({ ok: true, err: null })
        }
      })
    })
    .catch((err) => {
      return { ok: false, err }
    })
    } catch(err) {
      logger.info(err);
    }
}
