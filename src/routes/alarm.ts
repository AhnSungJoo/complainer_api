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
import kookminUserDAO from '../dao/kookminUserDAO';
// condition
import {ipAllowedCheck} from '../module/condition';

const router: Router = new Router();

// 알림등록
router.post('/registerAlarm', async (ctx, next) => {
  logger.info('alarm');
  let toUserMsg = `이자 포함 얼마를 받으셔야 하나요? (형식: 00원)`
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
      toUserMsg = `언제까지 받기로 약속하셨나요? (형식: 00년 00월 00일)`;
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
      //new Date("2021-05-23");
      fromUserMsg = "20" + fromUserMsg;
      fromUserMsg = fromUserMsg.replace('년', '/');
      if(fromUserMsg.trim().indexOf('월') != -1) {
        fromUserMsg = fromUserMsg.replace('월', '/');
      } 
      if(fromUserMsg.trim().indexOf('일') != -1) {
        fromUserMsg = fromUserMsg.replace('일', '/');
      }
      let dateMsg = new Date(fromUserMsg.trim());
      const kookDAO = new kookminDAO();
      await kookDAO.updateKookminDate(userId, moment(dateMsg).format('YYYY.MM.DD HH:mm:ss'));
      
      toUserMsg = `빌려주신 분의 이름과 번호를 알려주세요 (형식: 내정보, 홍길동, 01012341234) `;
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
  else if(fromUserMsg.trim().indexOf('내정보') != -1) {
    try {
      let startIdx = fromUserMsg.indexOf('내정보');
      let endIdx = fromUserMsg.indexOf('0');
      let name = fromUserMsg.substring(startIdx, endIdx);
      name = await refineMsg(name);
      name = name.trim();

      startIdx = fromUserMsg.indexOf('0');
      let phoneNumber = fromUserMsg.substring(startIdx, fromUserMsg.length);
      phoneNumber = await refineMsg(phoneNumber);
      phoneNumber = phoneNumber.trim();

      const kookDAO = new kookminDAO();
      await kookDAO.updateKookminReceive(userId, name, phoneNumber);
      toUserMsg = `갚으시는 분의 이름과 번호를 알려주세요 (형식: 상대정보, 홍길동, 01012341234)`;
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
  else if(fromUserMsg.trim().indexOf('상대정보') != -1) {
    try {
      let startIdx = fromUserMsg.indexOf('상대정보');
      let endIdx = fromUserMsg.indexOf('0');
      let name = fromUserMsg.substring(startIdx, endIdx);
      name = await refineMsg(name);
      name = name.trim();
      
      startIdx = fromUserMsg.indexOf('0');
      let phoneNumber = fromUserMsg.substring(startIdx, fromUserMsg.length);
      phoneNumber = await refineMsg(phoneNumber);
      phoneNumber = phoneNumber.trim();

      const kookDAO = new kookminDAO();
      await kookDAO.updateKookminBorrow(userId, name, phoneNumber);
      toUserMsg = `정기적으로 갚으시는 분께 리마인더를 보내드리겠습니다. 감사합니다.`;
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
  else if(fromUserMsg.trim().indexOf('정보등록') != -1) {
    try {

      let userDAO = new kookminUserDAO();
      let userResult = await userDAO.checkKookminUser(userId);

      if(userResult.legnth == 0 ) {
        let startIdx = fromUserMsg.indexOf('정보등록');
        let endIdx = fromUserMsg.indexOf('0');
        let name = fromUserMsg.substring(startIdx, endIdx);
        name = await refineMsg(name);
        name = name.trim();
        
        startIdx = fromUserMsg.indexOf('0');
        let phoneNumber = fromUserMsg.substring(startIdx, fromUserMsg.length);
        phoneNumber = await refineMsg(phoneNumber);
        phoneNumber = phoneNumber.trim();
  
        await userDAO.insertKookminMoney(userId, name, phoneNumber);
  
        const kookDAO = new kookminDAO();
        await kookDAO.updateOtherKaKaoId(userId, phoneNumber);
  
        toUserMsg = `정보 등록이 완료됐습니다. 정보 확인 후 '빌린 돈 확인' 메뉴 사용이 가능합니다. 감사합니다.`;
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
      } else {
        toUserMsg = `이미 등록된 정보가 있습니다.`;
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

    } catch(err) {
      toUserMsg = `정보 등록 중 오류가 발생했습니다.\n형식을 확인하신 후 다시 시도해주세요.`
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
  else if(fromUserMsg.trim().indexOf('아이디') != -1) {
    try {
      let startIdx = fromUserMsg.indexOf(',');
      let kakaoUserId = fromUserMsg.substring(startIdx+1, fromUserMsg.length).trim();

      const kookDAO = new kookminDAO();
      await kookDAO.updateKaKaoUserId(userId, kakaoUserId);
      toUserMsg = `아이디 등록이 정상 완료됐습니다. 빠른시일내에 상담직원이 연락드리겠습니다. 감사합니다.`;
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

// 빌려준돈 확인
router.post('/checkMyMoney', async (ctx, next) => {
  const userId = ctx.request.body.userRequest.user.id;
  const kookDAO = new kookminDAO();
  const resultData = await kookDAO.getBorrowInfo(userId);
  let resutlJson;
  let toUserMsg = "";
  logger.info(`${resultData.length}`);
  if(resultData.length == 0) {
    toUserMsg = `빌려준 정보가 없습니다.`
  } else {
    for(let i=0;i<resultData.length; i++) {
      // 형식 : ㅁㅁㅁ님에게 22년 5월 1일에 2000원을 받기로 하셨습니다. 
      let tempMsg = `${resultData[i]['other_user_name']}님에게 ${moment(resultData[i]['receive_date']).format('YYYY.MM.DD')}에 ${resultData[i]['money_amount']}을 받기로 하셨습니다.\n`;
      toUserMsg += tempMsg;
    }
  }
  
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
  ctx.body = resutlJson;
})


// 빌려준 돈 확인하기
router.post('/checkBorrowMoney', async (ctx, next) => {
  const userId = ctx.request.body.userRequest.user.id;
  let resutlJson;
  let userDAO = new kookminUserDAO();
  let userResult = await userDAO.checkKookminUser(userId);
  let toUserMsg = '';
  if(userResult.length == 0) {
    toUserMsg = '등록된 정보가 없습니다. 본인의 정보를 형식에 맞게 등록해주세요. (형식: 정보등록, 홍길동, 01012341234)'
  } else {
    const kookDAO = new kookminDAO();
    const resultData = await kookDAO.getBorrowPersonData(userId);
    if(resultData.length == 0) {
      toUserMsg = `현재 빌린 돈은 없습니다.`
    } else {
      for(let i=0;i<resultData.length; i++) {
        // 형식 : ㅁㅁㅁ님에게 22년 5월 1일에 2000원을 받기로 하셨습니다. 
        let tempMsg = `${resultData[i]['user_name']}님에게 ${moment(resultData[i]['receive_date']).format('YYYY.MM.DD')}에 ${resultData[i]['money_amount']}을 갚기로 하셨습니다.\n`;
        toUserMsg += tempMsg;
      }
    }
  }

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
  ctx.body = resutlJson;
})

// 관리자에게 문의하기
router.post('/askManager', async (ctx, next) => {
  let resutlJson;
  let toUserMsg = `안녕하세요. 원할한 상담을 위해 본인의 카카오톡 아이디를 형식에 맞게 보내주세요. (형식: 아이디, kakao_id123)`;

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