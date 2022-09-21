'use strict';

import * as Router from 'koa-router';
import * as moment from 'moment';
import * as settingConfig from 'config';
// import * as emoji from 'telegram-emoji-map';

import logger from '../util/logger';
import overviewRouter from './overview';
import functionRouter from './function';
import alarmFunction from './alarmFunction';
import alarmRouter from './alarm';
import albaRouter from './alba';

import {sendInternalMSG, sendInternalErrorMSG} from '../module/internalMSG';
import {sendExternalMSG} from '../module/externalMSG';
import {sendErrorMSG} from '../module/errorMSG';

import {upsertData} from '../module/insertDB';
import {getPaging} from '../util/paging';

import { config } from 'winston';

// dao
import signalDAO from '../dao/signalDAO';
import complainUserDAO from '../dao/complainUserDAO';
import flagDAO from '../dao/flagDAO';
import nameDAO from '../dao/nameDAO';
import { start } from 'repl';

const db_modules = [upsertData]
const msg_modules = [sendExternalMSG]  // 텔레그램 알림 모음 (내부 / 외부)
const router: Router = new Router();

let complainPoint = 500;

// Dashboard
router.get('/', async (ctx, next) => {
  logger.info('index here');

  return ctx.render('index');
})

router.get('/ping', async (ctx, next) => {
  return ctx.body = "OK";
})

// 불편접수
router.post('/kakaoChat/registerComplain', async (ctx, next) => {
  logger.info('register complain');
  const userId = ctx.request.body.userRequest.user.id;
  let fromUserMsg = ctx.request.body.userRequest.utterance;;
  let toUserMsg = '';
  logger.info(`${fromUserMsg}`);
  logger.info(`userid: ${userId}`);
  let resutlJson;
  if(fromUserMsg.trim().indexOf('불편제보') != -1) {
    logger.info('불편제보');
    try {
      const complainerDAO = new signalDAO('complainer');
      // 불편테이블 추가
      //await complainerDAO.insertComplainContext(fromUserMsg, userId, complainPoint);
      const existUser = await complainerDAO.checkExistUser(userId);
      logger.info(`existUser: ${existUser}`);
      const  existUserInfo = await complainerDAO.checkExistUserInfo(userId);
      logger.info(`existinfo ${existUserInfo['cnt']}`);
      if(existUser['cnt'] == 0 || existUserInfo['cnt'] != 0) {
        logger.info('none');
        resutlJson = {
          "version": "2.0",
          "template": {
              "outputs": [
                  {
                      "simpleText": {
                          "text": '불편을 제보하기 위해서는 우선 프로필을 등록해주시길 바랍니다.'
                      }
                  }
              ],
              "quickReplies": [
                {
                  "messageText": "프로필등록",
                  "action": "message",
                  "label": "프로필등록"
                }
              ]
          }
        };
      }
      else {
        toUserMsg = `✍🏻 작성방법\n1. 많은 공감을 얻을 수 있는 불편 또는 필요한 제품이나 서비스 작성하기\n2. 작성된 내용 마지막에 “접수” 기입하기\n예시) “밤에 애기가 갑자기 아플 때, 물어볼 의사가 없어서 불편해요. 접수”\n
- 더 많은 사람들이 공감할 수 있는 불편
- 불편한 상황을 충분히 이해할 수 있는 설명
- 해당 불편을 어떻게 해결했는지 경험
- 원하는 해결 방법 제안\n
☝🏻 위 4가지 사항 중 하나라도 더 자세하게 작성해주시면,
최대 “2,000원” 까지 포인트 지급해드려요`;
        resutlJson= {
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
    catch(err) {
      toUserMsg = '죄송합니다. 다시한번 시도해주세요';
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
  } else if(fromUserMsg.trim().indexOf('접수') != -1) {
    logger.info("register complain");
    try {
      const complainerDAO = new signalDAO('complainer');
      // 불편테이블 추가
      fromUserMsg = await filterUserMsg(fromUserMsg); // 특수문자 필터링
      await complainerDAO.insertComplainContext(fromUserMsg, userId, complainPoint);
      const existUser = await complainerDAO.checkExistUser(userId);
      logger.info(`existUser: ${existUser}`);
      const  existUserInfo = await complainerDAO.checkExistUserInfo(userId);
      if(existUser['cnt'] == 0 || existUserInfo['cnt'] != 0) {
        resutlJson = {
          "version": "2.0",
          "template": {
              "outputs": [
                  {
                      "simpleText": {
                          "text": '불편을 제보하기 위해서는 우선 프로필을 등록해주시길 바랍니다.'
                      }
                  }
              ],
              "quickReplies": [
                {
                  "messageText": "프로필등록",
                  "action": "message",
                  "label": "프로필등록"
                }
              ]
          }
        };
      } else {
        let tempTotalPoint = 0;
        let prevPoint = await complainerDAO.getUserPoint(userId);
        logger.info(`prevPoint: ${prevPoint['point_total']}`);
        tempTotalPoint = prevPoint['point_total'] + complainPoint;
        logger.info(`new point : ${tempTotalPoint}`);
        await complainerDAO.updateComplainUserData(userId, tempTotalPoint);
        const totalPoint = await complainerDAO.getUserPoint(userId);
        toUserMsg  = `불편 접수 완료!
현재 고객님의 포인트 : ${totalPoint['point_total']}원
(어뷰징으로 판단될 경우,
포인트는 회수될 수 있으니 참고 부탁드립니다.)`;
        
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
                  "messageText": "불편제보",
                  "action": "message",
                  "label": "불편제보"
                },
                {
                  "messageText": "포인트조회",
                  "action": "message",
                  "label": "포인트조회"
                },
                {
                  "messageText": "출금신청",
                  "action": "message",
                  "label": "출금신청"
                },
                {
                  "messageText": "친구에게 채널 홍보하기",
                  "action": "message",
                  "label": "친구에게 채널 홍보하기"
                }
              ]
          }
        };
      } 
  }catch(err) {
      logger.warn("DB insert error");
      toUserMsg = '포인트 적립에 실패했습니다. 다시 접수해주세요.';
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
  else if(fromUserMsg.trim().indexOf('추천인') != -1){
    const firstIdx = fromUserMsg.trim().indexOf('추천인') + 4;
    logger.info(`firt: ${firstIdx}`);
    const  refCode  = fromUserMsg.trim().substring(firstIdx); 
    logger.info(`refcode: ${refCode}`);
    try{
      const complainerDAO = new signalDAO('complainer');
      // 친구 포인트 추가
      const friUserId = await complainerDAO.getfriUserId(refCode);
      const refCheck = await complainerDAO.checkExistRefUser(userId);

      //등록되어잇는 사용자인지 확인
      const existUser = await complainerDAO.checkExistUser(userId);
      const  existUserInfo = await complainerDAO.checkExistUserInfo(userId);
      if(existUser['cnt'] == 0 || existUserInfo['cnt'] != 0) {
        resutlJson = {
          "version": "2.0",
          "template": {
              "outputs": [
                  {
                      "simpleText": {
                          "text": '추천인 등록을 위해서 먼저 프로필을 등록해주시길 바랍니다.'
                      }
                  }
              ],
              "quickReplies": [
                {
                  "messageText": "프로필등록",
                  "action": "message",
                  "label": "프로필등록"
                }
              ]
          }
        };
      } else if(friUserId['kakao_id'] == userId) {
        resutlJson = {
          "version": "2.0",
          "template": {
              "outputs": [
                  {
                      "simpleText": {
                          "text": `불편러님 본인의 추천인코드를 입력하셨습니다. 추천인코드 확인 후 "추천인코드등록"을 눌러 다시 시도해주세요!`
                      }
                  }
              ]
          }
        };
      } else if (refCheck['ref_user_is'] == 1) {
        resutlJson = {
          "version": "2.0",
          "template": {
              "outputs": [
                  {
                      "simpleText": {
                          "text": `불편러님은 이미 추천인코드를 입력하셨습니다. 추천인코드등록은 한 번만 가능합니다.`
                      }
                  }
              ]
          }
        };
      } else {
        let tempTotalfriPoint = 0;
        logger.info(`fri ${friUserId['kakao_id']}`);
        let prevfriPoint = await complainerDAO.getUserPoint(friUserId['kakao_id']);
        logger.info(`prevPoint: ${prevfriPoint['point_total']}`);
        // 친구가 추천한 유저의 추천인코드를 입력하였다면 1000원을 적립해줌 - 수정 2022.04.09
        tempTotalfriPoint = prevfriPoint['point_total'] + 1000;
        logger.info(`new point : ${tempTotalfriPoint}`);
        await complainerDAO.updateComplainUserData(friUserId['kakao_id'], tempTotalfriPoint);
      
        // 등록한 친구 포인트 추가
        let tempTotalPoint = 0;
        let prevPoint = await complainerDAO.getUserPoint(userId);
        logger.info(`prevPoint: ${prevPoint['point_total']}`);
        if (refCode == 'PLAIN1' || refCode == 'plain1') { // 길거리 이벤트 추가
          tempTotalPoint = prevPoint['point_total'] + 1000;
        } else {
          tempTotalPoint = prevPoint['point_total'] + complainPoint;
        }
        
        logger.info(`new point : ${tempTotalPoint}`);
        await complainerDAO.updateComplainUserRefCodeData(userId, tempTotalPoint, refCode);
  
        resutlJson = {
          "version": "2.0",
          "template": {
              "outputs": [
                  {
                      "simpleText": {
                          "text": `추천인코드 입력이 정상적으로 완료됐습니다. 현재 불편러님의 포인트는 ${tempTotalPoint}입니다.`
                      }
                  }
              ]
          }
        };
      }
    } catch(err) {
      resutlJson = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": `추천인코드를 입력 중 오류가 발생했습니다. "추천인코드등록"을 눌러 다시 시도해주세요!`
                    }
                }
            ]
        }
      };
    }
  }
  else {    
    logger.info('fullback function?');
    const complainerDAO = new signalDAO('complainer');
    const existUser = await complainerDAO.checkExistUser(userId);
    const  existUserInfo = await complainerDAO.checkExistUserInfo(userId);
    if(existUser['cnt'] == 0 || existUserInfo['cnt'] != 0) {
      resutlJson = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": '불편을 제보하기 위해서는 우선 프로필을 등록해주시길 바랍니다.'
                    }
                }
            ],
            "quickReplies": [
              {
                "messageText": "프로필등록",
                "action": "message",
                "label": "프로필등록"
              }
            ]
        }
      };
    }
    else {
      resutlJson = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": '환영합니다 불편러님. 아래의 말풍선중 원하는 기능을 선택해주세요.'
                    }
                }
            ],
            "quickReplies": [
              {
                "messageText": "불편제보",
                "action": "message",
                "label": "불편제보"
              },
              {
                "messageText": "포인트조회",
                "action": "message",
                "label": "포인트조회"
              },
              {
                "messageText": "출금신청",
                "action": "message",
                "label": "출금신청"
              },
              {
                "messageText": "친구에게 채널 홍보하기",
                "action": "message",
                "label": "친구에게 채널 홍보하기"
              }
            ]
        }
      };
    }
  }       
  //logger.info(`${JSON.stringify(resutlJson)}`);
  ctx.body = resutlJson;
})

// 포인트조회
router.post('/kakaoChat/myPoint', async (ctx, next) => {
  logger.info('welcome');
  logger.info(`json : ` + JSON.stringify(ctx.request.body.userRequest));
  const userId = ctx.request.body.userRequest.user.id;
  let toUserMsg = ``;
  logger.info(`userid: ${userId}`);
  logger.info('mypoint');
  const complainerDAO = new signalDAO('complainer');
  // 불편테이블 추가
  const totalPoint = await complainerDAO.getUserPoint(userId);
  const existUser = await complainerDAO.checkExistUser(userId);
  logger.info(`existUser: ${existUser}`);
  const  existUserInfo = await complainerDAO.checkExistUserInfo(userId);
  logger.info(`existinfo ${existUserInfo['cnt']}`);
  let resutlJson;
  if(existUser['cnt'] == 0 || existUserInfo['cnt'] != 0) {
    logger.info('none');
    resutlJson = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": '불편을 제보하기 위해서는 우선 프로필을 등록해주시길 바랍니다.'
                  }
              }
          ],
          "quickReplies": [
            {
              "messageText": "프로필등록",
              "action": "message",
              "label": "프로필등록"
            }
          ]
      }
    };
  } 
  else {
    toUserMsg = `현재 적립된 포인트: ${totalPoint['point_total']}원\n*5000원 부터 포인트 출금신청이 가능하오니,여러분의 불편을 더 많이 작성해주세요.`;
    resutlJson= {
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

// 출금신청
router.post('/kakaoChat/reqIncome', async (ctx, next) => {
  logger.info('reqIncome');
  const userId = ctx.request.body.userRequest.user.id;
  let toUserMsg = ``;
  logger.info(`userid: ${userId}`);
  const complainerDAO = new signalDAO('complainer');
  // 불편테이블 추가
  const totalPoint = await complainerDAO.getUserPoint(userId);
  const existUser = await complainerDAO.checkExistUser(userId);
  logger.info(`totalPoint: ${Number(totalPoint['point_total'])}`);
  if(totalPoint == '' || existUser['cnt'] == 0) {
    toUserMsg = '현재 불편러님은 보유하신 포인트가 없습니다. 새로운 불편을 접수하신 후 출금신청 부탁드립니다.';
  }
  else if(Number(totalPoint['point_total']) < 5000) {
    toUserMsg = '5,000원부터 출금할 수 있습니다. 더 많은 불편을 제보해주시길 바랍니다.';
  }
  else {
    try {
      const incomeSatus = await complainerDAO.checkIncomeStatus(userId);
      if(incomeSatus['status'] == 1) {
        toUserMsg = `이미 출금신청이 완료됐습니다. 5영업일 이내 출금이 완료됩니다.`;
      }
      else {
        await complainerDAO.updateComplainUserIncome(userId);
        toUserMsg = `출금신청이 완료되었습니다. 본인 확인을 위해 아래 "상담직원 연결"을 누르신 후 메시지를 보내주세요. 감사합니다.`;
      }

    } catch(err) {
      toUserMsg = `출금신청이 실패했습니다. 다시 시도해주세요.`;
    }
    
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

// 기본정보입력
router.post('/kakaoChat/inputInfo', async (ctx, next) => {
  logger.info('inputInfo');
  const userId = ctx.request.body.userRequest.user.id;
  let fromUserMsg = ctx.request.body.userRequest.utterance;;
  logger.info(`userid: ${userId}`);

  if(fromUserMsg.trim().indexOf('기본정보입력') != -1) {
    ctx.body = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": '기본정보 선택후 해당하는 값을 입력해주세요.'
                  }
              }
          ],
          "quickReplies": [
            {
              "messageText": "나이",
              "action": "message",
              "label": "나이"
            },
            {
              "messageText": "성별",
              "action": "message",
              "label": "성별"
            },
            {
              "messageText": "직업",
              "action": "message",
              "label": "직업"
            }
          ]
      }
    };
  }
})

// 기본정보입력 - 나이
router.post('/kakaoChat/inputAge', async (ctx, next) => {
  logger.info('inputInfo AGe');
  const userId = ctx.request.body.userRequest.user.id;
  let fromUserMsg = ctx.request.body.userRequest.utterance;;
  let toUserMsg = ``;
  const complainerDAO = new signalDAO('complainer');
  // 불편테이블 추가
  const totalPoint = await complainerDAO.getUserPoint(userId);
  const existUser = await complainerDAO.checkExistUser(userId);
  logger.info(`userid: ${userId}`);

  if(fromUserMsg.trim().indexOf('프로필등록') != -1) {
    ctx.body = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": '해당하는 연령대를 선택해주세요.'
                  }
              }
          ],
          "quickReplies": [
            {
              "messageText": "10대",
              "action": "message",
              "label": "10대"
            },
            {
              "messageText": "20대",
              "action": "message",
              "label": "20대"
            },
            {
              "messageText": "30대",
              "action": "message",
              "label": "30대"
            },
            {
              "messageText": "40대",
              "action": "message",
              "label": "40대"
            },
            {
              "messageText": "50대",
              "action": "message",
              "label": "50대"
            },
            {
              "messageText": "60대이상",
              "action": "message",
              "label": "60대이상"
            }
          ]
      }
    };
  } else if (fromUserMsg.trim().indexOf('대') != -1) {
    let age = fromUserMsg.substring(0,2);
    logger.info(`age right? ${age}`);
    if(existUser['cnt'] == 0) {
      await complainerDAO.insertComplainUserAge(userId, age);
    } else {
      await complainerDAO.updateComplainUserAge(userId, age);
    }
    ctx.body = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": '해당하는 성별을 선택해주세요.'
                  }
              }
          ],
          "quickReplies": [
            {
              "messageText": "남자",
              "action": "message",
              "label": "남자"
            },
            {
              "messageText": "여자",
              "action": "message",
              "label": "여자"
            }
          ]
      }
    };
  }
})

// 기본정보입력 - 성별
router.post('/kakaoChat/inputSex', async (ctx, next) => {
  logger.info('inputInfo Sex');
  const userId = ctx.request.body.userRequest.user.id;
  let fromUserMsg = ctx.request.body.userRequest.utterance;;
  let toUserMsg = ``;
  const complainerDAO = new signalDAO('complainer');
  // 불편테이블 추가
  const totalPoint = await complainerDAO.getUserPoint(userId);
  const existUser = await complainerDAO.checkExistUser(userId);
  logger.info(`userid: ${userId}`);

  if(fromUserMsg.trim().indexOf('성별') != -1) {
    ctx.body = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": '해당하는 성별을 선택해주세요.'
                  }
              }
          ],
          "quickReplies": [
            {
              "messageText": "남자",
              "action": "message",
              "label": "남자"
            },
            {
              "messageText": "여자",
              "action": "message",
              "label": "여자"
            }
          ]
      }
    };
  } else if (fromUserMsg.trim().indexOf('자') != -1) {
    let sex = fromUserMsg.substring(0,1);
    logger.info(`sex right? ${sex}`);
    if(sex == '남') {
      sex = 1;
    } else {
      sex = 0;
    }
    logger.info(`sex value right? ${sex}`);
    if(existUser['cnt'] == 0) {
      await complainerDAO.insertComplainUserSex(userId, sex);
    } else {
      await complainerDAO.updateComplainUserSex(userId, sex);
    }
    ctx.body = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": '해당하는 직업을 선택해주세요.'
                  }
              }
          ],
          "quickReplies": [
            {
              "messageText": "직장인",
              "action": "message",
              "label": "직장인"
            },
            {
              "messageText": "사업가",
              "action": "message",
              "label": "사업가"
            },
            {
              "messageText": "학생",
              "action": "message",
              "label": "학생"
            },
            {
              "messageText": "주부",
              "action": "message",
              "label": "주부"
            },
            {
              "messageText": "무직",
              "action": "message",
              "label": "무직"
            }            
          ]
      }
    };
  }
})

// 기본정보입력 - 직업
router.post('/kakaoChat/inputJob', async (ctx, next) => {
  logger.info('inputInfo Job');
  const userId = ctx.request.body.userRequest.user.id;
  let fromUserMsg = ctx.request.body.userRequest.utterance;;
  let toUserMsg = ``;
  const complainerDAO = new signalDAO('complainer');
  // 불편테이블 추가
  const totalPoint = await complainerDAO.getUserPoint(userId);
  const existUser = await complainerDAO.checkExistUser(userId);
  logger.info(`userid: ${userId}`);

  if(fromUserMsg.trim().indexOf('직업') != -1) {
    ctx.body = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": '해당하는 직업을 선택해주세요.'
                  }
              }
          ],
          "quickReplies": [
            {
              "messageText": "직장인",
              "action": "message",
              "label": "직장인"
            },
            {
              "messageText": "사업가",
              "action": "message",
              "label": "사업가"
            },
            {
              "messageText": "학생",
              "action": "message",
              "label": "학생"
            },
            {
              "messageText": "주부",
              "action": "message",
              "label": "주부"
            },
            {
              "messageText": "무직",
              "action": "message",
              "label": "무직"
            }            
          ]
      }
    };
  } else if (fromUserMsg.trim().indexOf('직장인') != -1 || fromUserMsg.trim().indexOf('사업가') != -1 ||
  fromUserMsg.trim().indexOf('학생') != -1 || fromUserMsg.trim().indexOf('주부') != -1 ||
  fromUserMsg.trim().indexOf('무직') != -1 ) {
    const job = fromUserMsg.trim();
    logger.info(`job right? ${job}`);
    
    if(existUser['cnt'] == 0) {
      await complainerDAO.insertComplainUserJob(userId, job);
    } else {
      await complainerDAO.updateComplainUserJob(userId, job);
    }
    const refCode = await generateRefCode();
    const complainerUserDAO = new complainUserDAO();
    await complainerUserDAO.updateRef(userId, refCode);
    ctx.body = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": `프로필이 정상적으로 등록되었습니다. 불편을 제보하시려면 "불편 제보"를, 친구에게 받은 추천인코드가 있다면 "추천인코드등록"을 선택해주세요.`
                  }
              }
          ],
          "quickReplies": [
            {
              "messageText": "불편제보",
              "action": "message",
              "label": "불편제보"
            },
            {
              "messageText": "포인트조회",
              "action": "message",
              "label": "포인트조회"
            },
            {
              "messageText": "출금신청",
              "action": "message",
              "label": "출금신청"
            },
            {
              "messageText": "친구에게 채널 홍보하기",
              "action": "message",
              "label": "친구에게 채널 홍보하기"
            },
            {
              "messageText": "추천인코드등록",
              "action": "message",
              "label": "추천인코드등록"
            }
          ]
      }
    };
  }
})

// 친구에게 홍보하기 skill (추천인 코드 조회 포함)
router.post('/kakaoChat/myRefCode', async (ctx, next) => {
  logger.info('welcome');
  const userId = ctx.request.body.userRequest.user.id;
  let toUserMsg = ``;
  logger.info(`userid: ${userId}`);
  logger.info('mypoint');
  const complainerDAO = new complainUserDAO();
  const complainDAO = new signalDAO('complainer');
  const existUser = await complainDAO.checkExistUser(userId);
  logger.info(`existUser: ${existUser}`);
  const  existUserInfo = await complainDAO.checkExistUserInfo(userId);
  logger.info(`existinfo ${existUserInfo['cnt']}`);
  let resutlJson;
  if(existUser['cnt'] == 0 || existUserInfo['cnt'] != 0) {
    logger.info('none');
    resutlJson = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": '불편을 제보하기 위해서는 우선 프로필을 등록해주시길 바랍니다.'
                  }
              }
          ],
          "quickReplies": [
            {
              "messageText": "프로필등록",
              "action": "message",
              "label": "프로필등록"
            }
          ]
      }
    };
  } else {
    const refCode = await complainerDAO.getRef(userId);
    toUserMsg = `당신은 일상속에서 어떤 불편을 마주하시나요? 당신의 제보로 세상을 조금 더 편하게 바꾸어 보세요.\n
불편 제보 시, 500원부터 2000원까지 보상이 지급되며, 많은 공감을 받은 불편은 이를 잘 해결할 수 있는 대학, 기관, 팀 등에게 전달되어 세상을 조금 더 편하게 바꾸는데 활용됩니다. (만약 불편 제보가 어려우시면, 어떠한 제품이나 서비스가 왜 필요한지 제안해주셔도 좋습니다.)\n
추천인 코드를 입력하시면 추천인에게는 500포인트를 추천받은 친구는 추가로 1000포인트가 지급됩니다. http://pf.kakao.com/_SxgChb (추천인코드: ${refCode['ref_code']})\n
친구에게 이 메시지를 복사해서 공유해주세요!`
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

// 추천인코드 입력
router.post('/kakaoChat/registerRefcode', async (ctx, next) => {
  logger.info('registerRefCode');
  const userId = ctx.request.body.userRequest.user.id;
  let fromUserMsg = ctx.request.body.userRequest.utterance;
  let resutlJson;
  if(fromUserMsg.trim().indexOf('추천인코드등록') != -1) {
    resutlJson = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": `추천인코드를 등록하시려면 다음과 같이 입력해주세요.(주의! 공백이 있으면 안됩니다.) 예) 추천인=AAA555`
                  }
              }
          ]
      }
    };
  } else if (fromUserMsg.trim().indexOf('추천인') != -1){
    const firstIdx = fromUserMsg.trim().indexOf('추천인') + 4;
    logger.info(`firt: ${firstIdx}`);
    const  refCode  = fromUserMsg.trim().substring(firstIdx);
    logger.info(`refcode: ${refCode}`);
    try{
      const complainerDAO = new signalDAO('complainer');
      // 친구 포인트 추가
      const friUserId = await complainerDAO.getfriUserId(refCode);
      const refCheck = await complainerDAO.checkExistRefUser(userId);
      if(friUserId['kakao_id'] == userId) {
        resutlJson = {
          "version": "2.0",
          "template": {
              "outputs": [
                  {
                      "simpleText": {
                          "text": `불편러님 본인의 추천인코드를 입력하셨습니다. 추천인코드 확인 후 다시 입력해주세요!`
                      }
                  }
              ]
          }
        };
      } else if (refCheck['ref_user_is'] == 1) {
        resutlJson = {
          "version": "2.0",
          "template": {
              "outputs": [
                  {
                      "simpleText": {
                          "text": `불편러님은 이미 추천인코드를 입력하셨습니다. 추천인코드등록은 한 번만 가능합니다.`
                      }
                  }
              ]
          }
        };
      } else {
        let tempTotalfriPoint = 0;
        logger.info(`fri ${friUserId['kakao_id']}`);
        let prevfriPoint = await complainerDAO.getUserPoint(friUserId['kakao_id']);
        logger.info(`prevPoint: ${prevfriPoint['point_total']}`);
        // 친구가 추천한 유저의 추천인코드를 입력하였다면 1000원을 적립해줌 - 수정 2022.04.09
        tempTotalfriPoint = prevfriPoint['point_total'] + 1000;
        logger.info(`new point : ${tempTotalfriPoint}`);
        await complainerDAO.updateComplainUserData(friUserId['kakao_id'], tempTotalfriPoint);
      
        // 등록한 친구 포인트 추가
        let tempTotalPoint = 0;
        let prevPoint = await complainerDAO.getUserPoint(userId);
        logger.info(`prevPoint: ${prevPoint['point_total']}`);
        tempTotalPoint = prevPoint['point_total'] + complainPoint;
        logger.info(`new point : ${tempTotalPoint}`);
        await complainerDAO.updateComplainUserRefCodeData(userId, tempTotalPoint, refCode);
  
        resutlJson = {
          "version": "2.0",
          "template": {
              "outputs": [
                  {
                      "simpleText": {
                          "text": `추천인코드 입력이 정상적으로 완료됐습니다. 현재 불편러님의 포인트는 ${tempTotalPoint}입니다.`
                      }
                  }
              ]
          }
        };
      }
    } catch(err) {
      resutlJson = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": `추천인코드등록 중 오류가 발생했습니다. 추천인코드 확인 후 다시 입력해 주세요.`
                    }
                }
            ]
        }
      };
    }
  }
  ctx.body = resutlJson;
})


// 내 추천인코드확인하기 (추천인 코드 조회 포함)
router.post('/kakaoChat/getMyRefCode', async (ctx, next) => {
  logger.info('getMyRefCode');
  const userId = ctx.request.body.userRequest.user.id;
  let toUserMsg = ``;
  logger.info(`userid: ${userId}`);
  logger.info('mypoint');
  const complainerDAO = new complainUserDAO();
  const complainDAO = new signalDAO('complainer');
  const existUser = await complainDAO.checkExistUser(userId);
  logger.info(`existUser: ${existUser}`);
  const  existUserInfo = await complainDAO.checkExistUserInfo(userId);
  logger.info(`existinfo ${existUserInfo['cnt']}`);
  let resutlJson;
  if(existUser['cnt'] == 0 || existUserInfo['cnt'] != 0) {
    logger.info('none');
    resutlJson = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": '불편을 제보하기 위해서는 우선 프로필을 등록해주시길 바랍니다.'
                  }
              }
          ],
          "quickReplies": [
            {
              "messageText": "프로필등록",
              "action": "message",
              "label": "프로필등록"
            }
          ]
      }
    };
  } else {
    const refCode = await complainerDAO.getRef(userId);
    toUserMsg = `불편러님의 추천인코드는 ${refCode['ref_code']} 입니다.`
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

// 추천인 코드  생성
async function generateRefCode() {
  let CodeGenerator = require('node-code-generator');
  // DB던 어디던 기존의 모든 추천인코드를 일단 한번에 다 가져오고, 그 목록을 code generator에게 넘겨주고 그 generator가 알아서 중복되지 않는 코드를 생성하게 함.
  return new complainUserDAO().get()
  .then(async userSet => {
    // 딱 코드들만 들어가있는 배열이 필요.
    // 예 [ 'ABCDFEF', 'DVCFDSE', … ]
    //let idSet: any = userSet.map(c => c.kako_id);
    logger.info(`userdata: ${userSet}`);
    let prevCodes = userSet.map(c => c.ref_code);
    
    let generator = new CodeGenerator();

    // 123456789 ABCDEFGHJKLMNPQRSTUVWXYZ = 9 + 24 (i랑 o가 빠짐) = 33
    // 33^6 = 1291467969 개
    // 33^5 = 39135393 개
    let pattern = '******';

    var howMany = 1;
    var options = {
      existingCodesLoader: (pattern) => prevCodes
    };

    // Generate an array of random unique codes according to the provided pattern:
    var codes = generator.generateCodes(pattern, howMany, options);

    return codes[0];
  });
}

// 접수된 불편 내역 중 DB insert 오류 발생시키는 특수문자 제외 Change quote(') to double quote(")
async function filterUserMsg(userMsg) {
  let filteredMsg = userMsg;
  if(filteredMsg.trim().indexOf(`'`) != -1) {
    filteredMsg = userMsg.replace(/[']/g, `"`);
  }
  return filteredMsg;
}
// 중요: cors는 /api에만 적용될거라 index router 뒤에 와야 한다.
router.use('/overview', overviewRouter.routes());
router.use('/function', functionRouter.routes());
router.use('/alarmFunction', alarmFunction.routes());
router.use('/kakaoChat/alarm', alarmRouter.routes());
router.use('/kakaoChat/alba', albaRouter.routes());

export default router;