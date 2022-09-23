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
  let toUserMsg = `👩🏻 고객님께서 빌려준 금액은 얼마인가요?

▶ 작성예시 : 1,000원 (”원”까지 작성필수!!)`
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
  logger.info(`isNan: ${!isNaN(fromUserMsg.replace("원", ""))}`);
  let resutlJson;
  if(fromUserMsg.trim().indexOf('원') != -1) {
    try {
      fromUserMsg = await refineMsg(fromUserMsg);
      if(!isNaN(fromUserMsg.replace("원", ""))){
        const kookDAO = new kookminDAO();
        await kookDAO.insertKookminMoney(userId, fromUserMsg);
        toUserMsg = `👩🏻 빌려준 금액은 언제 돌려 받기로 약속하셨나요?
  
  ▶ 작성형식 : 000000 (년,월,일 순 작성필수!!)
  ▶ 예시 (22년 01월 01일) : 220101`;
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
        resutlJson = {
            "version": "2.0",
            "template": {
                "outputs": [
                    {
                        "simpleText": {
                            "text": "작성형식에 맞게 다시 작성해주세요."
                        }
                    }
                ]
            }
          }; 
      }
      
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
  else if(!isNaN(fromUserMsg)) { // 날짜 형식 찾기 ex) "220101"
    try {
      fromUserMsg = await refineMsg(fromUserMsg);
      //new Date("2021-05-23");
      fromUserMsg = "20" + fromUserMsg;
      let dateMsg = parse(fromUserMsg.trim());
      logger.info(`datetype: ${dateMsg}`);
      const kookDAO = new kookminDAO();
      await kookDAO.updateKookminDate(userId, moment(dateMsg).format('YYYY.MM.DD HH:mm:ss'));
      
      toUserMsg = `빌려주신 분의 이름과 번호를 알려주세요 (형식: 내정보, 홍길동, 010xxxxxxxx) `;
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

      let userDAO = new kookminUserDAO();
      let userResult = await userDAO.checkKookminUser(userId);      
      if(userResult.length == 0) { // 새 프로필 등록
        await userDAO.insertKookminMoney(userId, name, phoneNumber);
      }
      // 내정보로 등록되는 핸드폰 번호가 갚아야 되는 사람 번호로 등록되어있는지 조회
      const borrowData = await kookDAO.getBorrowInfoId(phoneNumber);
      if(borrowData.length > 0) {
          await kookDAO.updateOtherKaKaoId(userId, phoneNumber);
      }
      toUserMsg = `갚으시는 분의 이름과 번호를 알려주세요 (형식: 상대정보, 홍길동, 010xxxxxxxx)`;
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

      let userDAO = new kookminUserDAO();
      let userResult = await userDAO.getOtherKaKaoId(phoneNumber);
      if(userResult.length > 0) {
        await kookDAO.updateOtherKaKaoId(userResult[0]['kakao_id'], phoneNumber);
      } 

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

      if(userResult.length == 0 ) {
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
      if(i != resultData.length -1) {
        tempMsg += "\n";
    }
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
    toUserMsg = '당신의 이름과 번호를 알려주세요 (형식: 정보등록, 홍길동, 010xxxxxxxx)'
  } else {
    const kookDAO = new kookminDAO();
    const resultData = await kookDAO.getBorrowPersonData(userId);
    if(resultData.length == 0) {
      toUserMsg = `현재 빌린 돈은 없습니다.`
    } else {
      for(let i=0;i<resultData.length; i++) {
        // 형식 : ㅁㅁㅁ님에게 22년 5월 1일에 2000원을 받기로 하셨습니다. 
        let tempMsg = `${resultData[i]['user_name']}님에게 ${moment(resultData[i]['receive_date']).format('YYYY.MM.DD')}에 ${resultData[i]['money_amount']}을 갚기로 하셨습니다.`;
        if(i != resultData.length -1) {
            tempMsg += "\n";
        }
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
  let toUserMsg = `카카오톡 아이디를 남겨주시면, 잠시 후 연락드리겠습니다. (형식: 아이디, kakao_id123)`;

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

// YYYYmmdd string to Date
function parse(str) {
    if(!/^(\d){8}$/.test(str)) return "invalid date";
    var y = str.substr(0,4),
        m = str.substr(4,2) - 1,
        d = str.substr(6,2);
    return new Date(y,m,d);
}
export default router;