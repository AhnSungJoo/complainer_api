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
  let toUserMsg = `이자 포함 얼마를 받으셔야 하나요? (양식: 00원)`
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
  if(fromUserMsg.trim().indexOf('원') != -1) {
    try {
      fromUserMsg = await refineMsg(fromUserMsg);
      const kookDAO = new kookminDAO();
      await kookDAO.insertKookminMoney(userId, fromUserMsg);
      toUserMsg = `언제까지 받기로 약속하셨나요? (양식: 00년 00월 00일)`;
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
  else if(fromUserMsg.trim().indexOf('년') != -1) {
    try {
      fromUserMsg = await refineMsg(fromUserMsg);
      const kookDAO = new kookminDAO();
      await kookDAO.updateKookminDate(userId, fromUserMsg);
      toUserMsg = `빌려주신 분의 이름과 번호를 알려주세요 (양식: 빌려준분: 안성주, 번호: 01012345678) `;
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
  else if(fromUserMsg.trim().indexOf('빌려준분') != -1) {
    try {
      fromUserMsg = await refineMsg(fromUserMsg);
      let startIdx = fromUserMsg.indexOf('빌려준분');
      let endIdx = fromUserMsg.indexOf(',');
      let name = fromUserMsg.substring(startIdx, endIdx);
      logger.info(`${name}`);
      logger.info(`${fromUserMsg}`);
      startIdx = fromUserMsg.indexOf('번호:');
      let phoneNumber = fromUserMsg.substring(startIdx, -1);
      const kookDAO = new kookminDAO();
      await kookDAO.updateKookminReceive(userId, name, phoneNumber);
      toUserMsg = `갚으시는 분의 이름과 번호를 알려주세요 (양식: 갚는분: 안성주, 번호: 01012345678) `;
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
  else if(fromUserMsg.trim().indexOf('갚는분') != -1) {
    try {
      fromUserMsg = await refineMsg(fromUserMsg);
      let startIdx = fromUserMsg.indexOf('갚는분');
      let endIdx = fromUserMsg.indexOf(',');
      let name = fromUserMsg.substring(startIdx, endIdx);
      startIdx = fromUserMsg.indexOf('번호:');
      let phoneNumber = fromUserMsg.substring(startIdx, -1);
      const kookDAO = new kookminDAO();
      await kookDAO.updateKookminBorrow(userId, name, phoneNumber);
      toUserMsg = `감사합니다. 갚으시는 분의 확인을 받은 후 간단한 서류와 알람을 설정해드리겠습니다.`;
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


// 양식 및 괄호 제거
async function refineMsg(msg) {
  msg = msg.trim();
  if(msg.indexOf('양식:') != -1) {
    msg = msg.replace("양식:", "");
  }
  if(msg.indexOf('(') != -1) {
    msg = msg.replace("(", "");
  }
  if(msg.indexOf(')') != -1) {
    msg = msg.replace(")", "");
  }
  return msg;
}

export default router;