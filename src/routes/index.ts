'use strict';

import * as Router from 'koa-router';
import * as moment from 'moment';
import * as settingConfig from 'config';
// import * as emoji from 'telegram-emoji-map';

import logger from '../util/logger';
import overviewRouter from './overview';

import {sendInternalMSG, sendInternalErrorMSG} from '../module/internalMSG';
import {sendExternalMSG} from '../module/externalMSG';
import {sendErrorMSG} from '../module/errorMSG';

import {upsertData} from '../module/insertDB';
import {getPaging} from '../util/paging';

import { config } from 'winston';

// dao
import signalDAO from '../dao/signalDAO';
import flagDAO from '../dao/flagDAO';
import nameDAO from '../dao/nameDAO';
import { start } from 'repl';

const db_modules = [upsertData]
const msg_modules = [sendExternalMSG]  // 텔레그램 알림 모음 (내부 / 외부)
const router: Router = new Router();

const complainPoint = 500;

router.use( async (ctx, next) => {
  try {
    await next()
  } catch(err) {
    console.log(err.status)
    ctx.status = err.status || 500;
    // ctx.body = err.message;
    return ctx.render('error', {message: 'Not Found'});
  }
})

// Dashboard
router.get('/', async (ctx, next) => {
  logger.info('index here');

  return ctx.render('index');
})

router.get('/ping', async (ctx, next) => {
  return ctx.body = "OK";
})

router.get('/umji', async (ctx, next) => {
  return ctx.body = "엄지 힘내!";
})

router.post('/kakaoChat/registerComplain', async (ctx, next) => {
  logger.info('register complain');
  const userId = ctx.request.body.userRequest.user.id;
  let fromUserMsg = ctx.request.body.userRequest.utterance;;
  let toUserMsg = '';
  logger.info(`${fromUserMsg}`);
  logger.info(`userid: ${userId}`);
  if(fromUserMsg.trim().indexOf('불편사항') != -1) {
    logger.info("register complain");
    try {
      const complainerDAO = new signalDAO('complainer');
      // 불편테이블 추가
      await complainerDAO.insertComplainContext(fromUserMsg, userId, complainPoint);
      const existUser = await complainerDAO.checkExistUser(userId);
      logger.info(`existUser: ${existUser}`);
      if(existUser['cnt'] == 0) {
        await complainerDAO.insertComplainUserData(userId, complainPoint);
      } else {
        let totalPoint = 0;
        let prevPoint = await complainerDAO.getUserPoint(userId);
        totalPoint = prevPoint['point_total'] + complainPoint;
        logger.info(`new point : ${totalPoint}`);
        await complainerDAO.updateComplainUserData(userId, totalPoint);
      }
      const totalPoint = await complainerDAO.getUserPoint(userId);
      toUserMsg  = `네, 접수되었습니다. 500 포인트가 적립되어서 현재 적립금은 ${totalPoint['point_total']} 원 입니다. 감사합니다.`;
    } catch(err) {
      logger.warn("DB insert error");
      toUserMsg = '포인트 적립에 실패했습니다. 다시 접수해주세요.';
    }
  }
  else {    
    logger.info('fullback function?');
    toUserMsg = '불편접수 / 포인트조회 / 입금신청 중 하나를 입력해주세요';
  }        
  ctx.body = {
    "version": "2.0",
    "template": {
        "outputs": [
            {
                "simpleText": {
                    "text": toUserMsg
                }
            }
        ]
    }
};
})

router.post('/kakaoChat/myPoint', async (ctx, next) => {
  logger.info('welcome');
  const userId = ctx.request.body.userRequest.user.id;
  let toUserMsg = ``;
  logger.info(`userid: ${userId}`);
  logger.info('mypoint');
  const complainerDAO = new signalDAO('complainer');
  // 불편테이블 추가
  const totalPoint = await complainerDAO.getUserPoint(userId);
  logger.info(`totalpoint: ${totalPoint['point_total']}`);
  if(totalPoint == '') {
    toUserMsg = '포인트가 없습니다.';
  }
  else {
    toUserMsg = `불편러님의 포인트는 ${totalPoint['point_total']}원 입니다.`;
  }
  ctx.body = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": toUserMsg
                  }
              }
          ]
      }
  };
})

// 중요: cors는 /api에만 적용될거라 index router 뒤에 와야 한다.
router.use('/overview', overviewRouter.routes());

// json test data
/*

{
  "intent": {
    "id": "u8374czixdyo23gkpuw34lat",
    "name": "블록 이름"
  },
  "userRequest": {
    "timezone": "Asia/Seoul",
    "params": {
      "ignoreMe": "true"
    },
    "block": {
      "id": "u8374czixdyo23gkpuw34lat",
      "name": "블록 이름"
    },
    "utterance": "발화 내용",
    "lang": null,
    "user": {
      "id": "687813",
      "type": "accountId",
      "properties": {}
    }
  },
  "bot": {
    "id": "620cea77ca92880f0b4e73c8",
    "name": "봇 이름"
  },
  "action": {
    "name": "krrqubcc0i",
    "clientExtra": null,
    "params": {},
    "id": "vpfi1op5vzjoncdifqzs1p6b",
    "detailParams": {}
  }
}
*/

export default router;
