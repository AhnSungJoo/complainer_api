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

// 후기등록
router.post('/registerReview', async (ctx, next) => {
  logger.info('alba');
  let toUserMsg = `근무하셨던 업체의 상호와 지점을 알려주세요. (형식: OO편의점 ㅇㅇ점 근무)`
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

// 후기삭제
router.post('/deleteReview', async (ctx, next) => {
    logger.info('alba');
    const userId = ctx.request.body.userRequest.user.id;
    let fromUserMsg = ctx.request.body.userRequest.utterance;;
    let toUserMsg = '';
    const alDAO = new albaDAO();
    const cnt = await alDAO.checkAlbaReview(userId);
    if(cnt['cnt'] == 0) {
      toUserMsg = '등록하신 알바후기가 없습니다.';
    } else {
      const resultData = await alDAO.getAlbaReview(userId);
      toUserMsg = '아래의 후기 중 삭제하실 후기를 선택해주세요. (형식: 후기삭제, 1)\n'
      for(let i=0; i<resultData.length; i++) {
          let tempData = resultData[i];
          toUserMsg += `${i+1}번째 후기 ${tempData['alba_review_content']}\n`;
      }
    }
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
  let resutlJson;
  if(fromUserMsg.trim().indexOf('시') != -1 && fromUserMsg.trim().indexOf('구') != -1 && fromUserMsg.trim().indexOf('동') != -1 ) {
    try {

        const alDAO = new albaDAO();
        await alDAO.insertAlbaReview(userId, fromUserMsg);
      toUserMsg = `근무하셨던 업체의 상호명 및 지점명을 알려주세요. (형식: OO편의점 역삼점 근무)`;
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
  else if(fromUserMsg.trim().indexOf('근무') != -1) {
    try {
      const alDAO = new albaDAO();
      await alDAO.updateAlbaCompany(userId, fromUserMsg);
      
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
      
      toUserMsg = `후기작성이 완료됐습니다.\n근무경력 인증을 위해 하단의 인증하기 버튼을 눌러 인증을 진행해주셔야 정상적으로 등록이 완료됩니다.`;
      resutlJson = {
        "version": "2.0",
        "template": {
          "outputs": [
            {
              "basicCard": {
                "title": "",
                "description": toUserMsg,
                "buttons": [
                  {
                    "action":  "webLink",
                    "label": "인증하기",
                    "webLinkUrl": "https://forms.gle/1fg6t11eYWnr39GU6"
                  }
                ]
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
  else if(fromUserMsg.trim().indexOf('후기삭제') != -1) {
    try {
      let startIdx = fromUserMsg.indexOf(',');
      let endIdx = fromUserMsg.length;
      let idx = fromUserMsg.substring(startIdx + 1, endIdx);
      idx = idx.trim();
      logger.info(idx);
      const alDAO = new albaDAO();
      const cnt = await alDAO.checkAlbaReview(userId);
      if(cnt['cnt'] == 0) {
        toUserMsg = '등록하신 알바후기가 없습니다.';
      } else {
        const resultData = await alDAO.getAlbaReview(userId);
        const review = resultData[idx - 1]['alba_review_content'];
        await alDAO.deleteAlbaReview(userId, review);
        toUserMsg =  `후기삭제 요청이 완료됐습니다. 관리자 확인 후 3영업일내에 리뷰가 삭제됩니다.`;
      }
        resutlJson = {
        "version": "2.0",
        "template": {
          "outputs": [
            {
              "basicCard": {
                "title": "",
                "description": toUserMsg,
                "buttons": [
                  {
                    "action":  "webLink",
                    "label": "인증하기",
                    "webLinkUrl": "https://forms.gle/1fg6t11eYWnr39GU6"
                  }
                ]
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