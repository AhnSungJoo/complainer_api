'use strict';

import * as Router from 'koa-router';
import * as moment from 'moment';
import * as settingConfig from 'config';
// import * as emoji from 'telegram-emoji-map';

import logger from '../util/logger';
import {sendInternalMSG, sendInternalErrorMSG} from '../module/internalMSG';
import {sendExternalMSG} from '../module/externalMSG';
import {sendErrorMSG} from '../module/errorMSG';

import {upsertData} from '../module/insertDB';
import {getPaging} from '../util/paging';

import { config } from 'winston'

// dao
import singnalDAO from '../dao/signalDAO';
import userDAO from '../dao/complainUserDAO';

// condition
import {ipAllowedCheck} from '../module/condition';

const router: Router = new Router();

router.use( async function (ctx, next) {
  const ipFlag = await ipAllowedCheck(ctx);
  if(ipFlag) {
    return next();
  }
  else {
    logger.info(`not allowed user access ip: ${ctx.ip}`);
    return ctx.render('error', {message: "Not Allowed User"});
  }
})

// 기본정보입력
router.post('/registerAlarm', async (ctx, next) => {
  let toUserMsg = `아래의 신청서 양식에 맞게 작성해주세요.\n
  -독촉 품목 (돈 , 책, 월세 등)  :\n
  - 본인이름 :\n
  - 상대방 이름:\n
  - 알림 주기 설정 (매주 1회 / 매달 1회 / 만기 1주전 / 만기 하루 전 등) :\n
  - 빌린날짜 (예시: 2022년 5월 15일) :\n
  - 받기로 한 날짜 (예시: 2022년 5월 15일) :\n
  - 상대방 핸드폰 번호 :\n`
  let resutlJson = {
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
  ctx.body = resutlJson;
})
export default router;