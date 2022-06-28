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
import albaDAO from '../dao/albaReviewDAO';
import kookminUserDAO from '../dao/kookminUserDAO';
// condition
import {ipAllowedCheck} from '../module/condition';

const router: Router = new Router();

// 알림등록
router.post('/registerReview', async (ctx, next) => {
  logger.info('alba');
  let toUserMsg = `근무지 주소명을 알려주세요. (형식: OO시 OO구 OO동 상세주소까지 입력)`
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
router.post('/writeReview', async (ctx, next) => {
  logger.info('alba222');
  const userId = ctx.request.body.userRequest.user.id;
  let fromUserMsg = ctx.request.body.userRequest.utterance;;
  let toUserMsg = '';
  logger.info(`${fromUserMsg}`);
  let resutlJson;
  if(fromUserMsg.trim().indexOf('시') != -1 && fromUserMsg.trim().indexOf('구') != -1 && fromUserMsg.trim().indexOf('동') != -1 ) {
    try {

        const alDAO = new albaDAO();
        await alDAO.insertAlbaReview(userId, fromUserMsg);
      toUserMsg = `근무하셨던 업체의 상호명을 알려주세요. (형식: 업체명, OO편의점)`;
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
      toUserMsg = `리뷰 작성 중 오류가 발생했습니다.\n형식에 맞게 다시 작성해주세요.`
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
  else if(fromUserMsg.trim().indexOf('업체명') != -1) {
    try {
      let startIdx = fromUserMsg.indexOf(',');
      let endIdx = fromUserMsg.length;
      let companyName = fromUserMsg.substring(startIdx + 1, endIdx);
      companyName = companyName.trim();
      const alDAO = new albaDAO();
      await alDAO.updateAlbaCompany(userId, companyName);
      
      toUserMsg = `알바 후기를 작성해주세요.(형식: 후기, 이곳은 어땟어요!) `;
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
      toUserMsg = `리뷰 작성 중 오류가 발생했습니다.\n형식에 맞게 다시 작성해주세요.`
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
  else if(fromUserMsg.trim().indexOf('후기') != -1) {
    try {
      let startIdx = fromUserMsg.indexOf(',');
      let endIdx = fromUserMsg.length;
      let review = fromUserMsg.substring(startIdx + 1, endIdx);
      review = review.trim();
      const alDAO = new albaDAO();
      await alDAO.updateAlbaReview(userId, review);
      
      toUserMsg = `후기작성이 완료됐습니다. `;
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
      toUserMsg = `리뷰 작성 중 오류가 발생했습니다.\n형식에 맞게 다시 작성해주세요.`
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
    toUserMsg = `리뷰 작성 중 오류가 발생했습니다.\n형식에 맞게 다시 작성해주세요.`
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
  if(msg.indexOf(',') != -1) {
    msg = msg.replace(/,/gi, "");
  }
  if(msg.indexOf('(') != -1) {
    msg = msg.replace("(", "");
  }
  if(msg.indexOf(')') != -1) {
    msg = msg.replace(")", "");
  }
  if(msg.indexOf('내정보') != -1) {
    msg = msg.replace("내정보", "");
  }
  if(msg.indexOf('상대정보') != -1) {
    msg = msg.replace("상대정보", "");
  }
  if(msg.indexOf('정보등록') != -1) {
    msg = msg.replace("정보등록", "");
  }
  if(msg.indexOf('번호') != -1) {
    msg = msg.replace("번호", "");
  }
  if(msg.indexOf(':') != -1) {
    msg = msg.replace(":", "");
  }

  return msg;
}

export default router;