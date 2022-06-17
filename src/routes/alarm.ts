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
import kookminDAO from '../dao/kookminAlarmDAO';
// condition
import {ipAllowedCheck} from '../module/condition';

const router: Router = new Router();

// 알림등록
router.post('/registerAlarm', async (ctx, next) => {
  logger.info('alarm');
  let toUserMsg = `신청서를 작성해주세요\n알림 신청서\n- 금액 :\n- 받는 날짜 :\n- 상대방 이름:\n- 상대방 번호 :\n`
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

// 알림등록
router.post('/dateCheck', async (ctx, next) => {
  logger.info('dateCheck');
  logger.info(`${JSON.stringify(ctx.request.body.user.id)}`);
  logger.info(`${JSON.stringify(ctx.request.body.value.origin)}`);

  return ctx.body = {status: 'success'};
})

// 알림등록
router.post('/registerDate', async (ctx, next) => {
  logger.info('registerDate');
  let toUserMsg = `신청서를 작성해주세요\n알림 신청서\n- 금액 :\n- 받는 날짜 :\n- 상대방 이름:\n- 상대방 번호 :\n`
  const userId = ctx.request.body.userRequest.user.id;
  let fromUserMsg = ctx.request.body.userRequest.utterance;
  logger.info(`${fromUserMsg}`);
  logger.info(`${userId}`);
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

// 신청서 작성
router.post('/writeRegister', async (ctx, next) => {
  const userId = ctx.request.body.userRequest.user.id;
  let fromUserMsg = ctx.request.body.userRequest.utterance;;
  let toUserMsg = '';
  logger.info(`${fromUserMsg}`);
  logger.info(`userid: ${userId}`);
  let resutlJson;
  if(fromUserMsg.trim().indexOf('신청서') != -1) {
    logger.info('alarm');
    try {
      const kookDAO = new kookminDAO();
      await kookDAO.insertKookminApply(userId, fromUserMsg);
      let finalMsg = fromUserMsg.replace("신청서를 작성해주세요", "");
      toUserMsg = `신청서 작성이 완료됐습니다. 신청내역을 다시 한번 확인 후 '확인 및 동의 버튼'을 눌러주세요!\n ${finalMsg}`;
        resutlJson = {
          "version": "2.0",
          "template": {
              "outputs": [
                  {
                      "simpleText": {
                          "text": toUserMsg
                      }
                  }
              ],
              "quickReplies": [
                {
                  "messageText": "확인 및 동의",
                  "action": "message",
                  "label": "확인 및 동의"
                }
              ]
          }
        };
    } catch(err) {
      toUserMsg = `신청서 작성 중 오류가 발생했습니다.\n다시 시도해주세요.`
      resutlJson = {
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
    }
     
  }
  else if(fromUserMsg.trim().indexOf('확인 및 동의') != -1) {
    toUserMsg = `신청서 작성이 완료됐습니다.\n알람은 하루전, 삼일전, 일주일전, 이주일전, 한달전 주기로 발송됩니다.`
    resutlJson = {
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
  }
  else {
    toUserMsg = `신청서를 다시 작성해주세요.`
    resutlJson = {
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
  }
  ctx.body = resutlJson;
})
export default router;