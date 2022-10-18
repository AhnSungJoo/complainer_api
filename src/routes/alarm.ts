'use strict';

import * as Router from 'koa-router';
import * as moment from 'moment';
import * as settingConfig from 'config';
//import * as Slack from 'slack-node';
import * as Slack from "@slack/webhook";
import request from "request";


// import * as emoji from 'telegram-emoji-map';

import logger from '../util/logger';
import {sendInternalMSG, sendInternalErrorMSG} from '../module/internalMSG';
import {sendExternalMSG} from '../module/externalMSG';
import {sendErrorMSG} from '../module/errorMSG';

import {upsertData} from '../module/insertDB';
import {getPaging} from '../util/paging';

import { config } from 'winston'
import {sendSlackWebHook} from '../util/slackbot';

// dao
import kookminDAO from '../dao/kookminAlarmDAO';
import kookminUserDAO from '../dao/kookminUserDAO';
// condition
import {ipAllowedCheck} from '../module/condition';

const router: Router = new Router();

// 알림등록
router.post('/registerAlarm', async (ctx, next) => {
  logger.info('alarm');
  let toUserMsg = `👩🏻 [고객님 성함] 및 [빌려주신 금액]을 기재해주세요.
ⓘ 작성예시 - 얼마빌렸지 / 100,000원`
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
  let fromUserMsg = ctx.request.body.userRequest.utterance;
  // uterrance 검증로직 => 첫글자 string or 숫자가 아닌경우 => ㅣ
  let numberFlag = checkType(fromUserMsg); // fasle : notnumber : 한글이름 
  let phoneFlag = fromUserMsg.trim().substr(0,1);
  let toUserMsg = '';
  logger.info(`${fromUserMsg}`);
  logger.info(`isNan: ${!isNaN(fromUserMsg.replace("원", ""))}`);
  let resutlJson;
  if((fromUserMsg.trim().indexOf('원') != -1 || numberFlag) &&  fromUserMsg.indexOf('/') != -1){ // 첫 질문케이스 
    try {
        //await sendSlackMsg();
      fromUserMsg = await refineMsg(fromUserMsg);
      let wonFlag = false;
      if(fromUserMsg.trim().indexOf('원') != -1) {
          if(!isNaN(fromUserMsg.replace("원", ""))) {
              wonFlag = true;
          }
      }
      if(wonFlag || numberFlag){
        let endIdx = fromUserMsg.indexOf('/');
        let name = fromUserMsg.substring(0, endIdx);
        let money = fromUserMsg.substring(endIdx + 1, fromUserMsg.length);

        const kookDAO = new kookminDAO();
        await kookDAO.insertKookminMoney(userId, money.trim());
        await kookDAO.updateKookminReceive(userId, name.trim());
        toUserMsg = `👩🏻 [상대방 연락처] 및 [받기로 약속한 일자]를 기재해주세요.
ⓘ 작성예시 - 070.8064.6290 / 22.10.30`;
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
  else if(phoneFlag == "0" && fromUserMsg.indexOf('/') != -1 ) { 
    try {
      fromUserMsg = await refineMsg(fromUserMsg);        
      let endIdx = fromUserMsg.indexOf('/');
      let otherPhoneNumber = fromUserMsg.substring(0, endIdx);
      let receive_date = fromUserMsg.substring(endIdx + 1, fromUserMsg.length);
        logger.info(`fromuserMSG: ${fromUserMsg}`);
      //new Date("2021-05-23");
      receive_date = "20" + receive_date;
      let dateMsg = parse(receive_date.trim());
      logger.info(`datetype: ${dateMsg}`);
      const kookDAO = new kookminDAO();
      await kookDAO.updateKookminBorrow(userId, otherPhoneNumber);
      await kookDAO.updateKookminDate(userId, moment(dateMsg).format('YYYY.MM.DD HH:mm:ss'));
      //빌려주신 분의 이름과 번호를 알려주세요 (형식: 내정보, 홍길동, 010xxxxxxxx) 
      toUserMsg = `💸 새 알림 등록 완료!
고객님을 대신하여 상대방에게 정기적으로 리마인더 메시지를 발송해드리겠습니다.
이용해 주셔서 감사합니다🙏
기재된 정보는 서비스 이용 목적 외에 다른 용도로 활용되지 않습니다.`;
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
  else if(fromUserMsg.trim().indexOf('본인') != -1) {
    try {
      let startIdx = fromUserMsg.indexOf('본인');
      let endIdx = fromUserMsg.indexOf('0');
      let name = fromUserMsg.substring(startIdx, endIdx);
      name = await refineMsg(name);
      name = name.trim();

      startIdx = fromUserMsg.indexOf('0');
      let phoneNumber = fromUserMsg.substring(startIdx, fromUserMsg.length);
      phoneNumber = await refineMsg(phoneNumber);
      phoneNumber = phoneNumber.trim();

      const kookDAO = new kookminDAO();
      //await kookDAO.updateKookminReceive(userId, name, phoneNumber);

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
        //갚으시는 분의 이름과 번호를 알려주세요 (형식: 상대정보, 홍길동, 010xxxxxxxx)
      // 
      toUserMsg = `👩🏻 상대방의 이름과 번호 정보를
      기재해주세요.

▶ 작성형식 : 
   “상대방”, 성함, 010********
▶ 예시 : 
   상대방, 김지훈, 01012345678`;
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
  else if(fromUserMsg.trim().indexOf('상대방') != -1) {
    try {
      let startIdx = fromUserMsg.indexOf('상대방');
      let endIdx = fromUserMsg.indexOf('0');
      let name = fromUserMsg.substring(startIdx, endIdx);
      name = await refineMsg(name);
      name = name.trim();
      
      startIdx = fromUserMsg.indexOf('0');
      let phoneNumber = fromUserMsg.substring(startIdx, fromUserMsg.length);
      phoneNumber = await refineMsg(phoneNumber);
      phoneNumber = phoneNumber.trim();

      const kookDAO = new kookminDAO();
      //await kookDAO.updateKookminBorrow(userId, name, phoneNumber);

      let userDAO = new kookminUserDAO();
      let userResult = await userDAO.getOtherKaKaoId(phoneNumber);
      if(userResult.length > 0) {
        await kookDAO.updateOtherKaKaoId(userResult[0]['kakao_id'], phoneNumber);
      } 
      await sendSlackWebHook(`🔔 새로운 얼마빌렸지 알림 등록 완료!`, 'money');
      toUserMsg = `￼￼￼￼💸 새 알림 등록 완료!
고객님을 대신하여 상대방에게 정기적으로 리마인더 메시지를 발송해드리겠습니다.
이용해 주셔서 감사합니다🙏
기재된 정보는 서비스 이용 목적 외에 다른 용도로 활용되지 않습니다.`;
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
    toUserMsg = "✅ 고객님께서 빌려주신 내역은 다음과 같습니다.\n\n";
    for(let i=0;i<resultData.length; i++) {
      let tempMsg = `💰금액 : ${resultData[i]['money_amount'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
빌려가신 분 성함 : ${resultData[i]['other_user_name']}
갚기로 한 날짜 : ${moment(resultData[i]['receive_date']).format('YYYY.MM.DD')}\n`
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
    toUserMsg = '고객님의 이름과 번호를 알려주세요 (형식: 정보등록, 홍길동, 010xxxxxxxx)'
  } else {
    const kookDAO = new kookminDAO();
    const resultData = await kookDAO.getBorrowPersonData(userId);
    if(resultData.length == 0) {
      toUserMsg = `현재 빌린 돈은 없습니다.`
    } else {
      toUserMsg = `☑️ 고객님께서 빌리신 내역은 다음과 같습니다.\n\n`;
      for(let i=0;i<resultData.length; i++) {
        let tempMsg = `💰금액 : ${resultData[i]['money_amount'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
빌려주신 분 성함 : ${resultData[i]['user_name']}
갚기로 한 날짜 : ${moment(resultData[i]['receive_date']).format('YYYY.MM.DD')}\n`
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
  let toUserMsg = `👩🏻 문의하실 내용이 어떻게 되나요? 

“문의하실 내용”과 함께 고객님의 “카카오톡 아이디”를 남겨주시면, 1시간 내로 연락 드리겠습니다. 
  
▶ 작성형식 : 
   “아이디”, 카톡 ID , 문의내용
▶ 예시 : 
   아이디, kakao123, 00이 궁금해요`;

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
  if(msg.indexOf('.') != -1) {
    msg = msg.replace(/./gi, "");
  }
  if(msg.indexOf('(') != -1) {
    msg = msg.replace("(", "");
  }
  if(msg.indexOf(')') != -1) {
    msg = msg.replace(")", "");
  }
  if(msg.indexOf('본인') != -1) {
    msg = msg.replace("본인", "");
  }
  if(msg.indexOf('상대방') != -1) {
    msg = msg.replace("상대방", "");
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

function checkType(msg) {
    let filterMsg = msg.trim().substr(0,1);
    return isNaN(filterMsg); // true : not Number , false : number
}


export default router;