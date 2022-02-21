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
import complainUserDAO from '../dao/complainUserDAO';
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

// 불편접수
router.post('/kakaoChat/registerComplain', async (ctx, next) => {
  logger.info('register complain');
  const userId = ctx.request.body.userRequest.user.id;
  let fromUserMsg = ctx.request.body.userRequest.utterance;;
  let toUserMsg = '';
  logger.info(`${fromUserMsg}`);
  logger.info(`userid: ${userId}`);
  /*
  if(fromUserMsg.trim().indexOf('불편제보') != -1) {
    const complainerDAO = new signalDAO('complainer');
    const existUser = await complainerDAO.checkExistUser(userId);
    const  existUserInfo = await complainerDAO.checkExistUserInfo(userId);
    logger.info(`existUser: ${existUser['cnt']}`);
    logger.info(`existUser: ${existUserInfo['cnt']}`);
    if(existUser['cnt'] == 0 || existUserInfo['cnt'] != 0) {
      logger.info('here??');
      ctx.body = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": '안녕하세요 불편러님!\n현재 불편러님은 등록하신 프로필 정보가 없습니다. 아래의 말풍선을 클릭 후 해당하는 값을 입력해주세요.'
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
      logger.info('heree??');
      ctx.body = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": `불편 제보\n불편을 적어주신 후 마지막에 접수라고 적어주셔야 정상적으로 포인트가 적립됩니다. 불편사항을 상세히 적어주신 불편러께는 확인 후 추가로 500포인트를 더 적립해드립니다!`
                    }
                }
            ]
        }
      };
    }
  } 
  else 
  
  */
 if(fromUserMsg.trim().indexOf('접수') != -1) {
    logger.info("register complain");
    try {
      const complainerDAO = new signalDAO('complainer');
      const existUser = await complainerDAO.checkExistUser(userId);
      const  existUserInfo = await complainerDAO.checkExistUserInfo(userId);
      logger.info(`existUser: ${existUser['cnt']}`);
      logger.info(`existUser: ${existUserInfo['cnt']}`);
      if(existUser['cnt'] == 0 || existUserInfo['cnt'] != 0) {
        logger.info('here??');
        ctx.body = {
          "version": "2.0",
          "template": {
              "outputs": [
                  {
                      "simpleText": {
                          "text": '안녕하세요 불편러님!\n현재 불편러님은 등록하신 프로필 정보가 없습니다. 아래의 말풍선을 클릭 후 해당하는 값을 입력해주세요.'
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
        // 불편테이블 추가
        await complainerDAO.insertComplainContext(fromUserMsg, userId, complainPoint);
        let temptotalPoint = 0;
        let prevPoint = await complainerDAO.getUserPoint(userId);
        logger.info(`prevPoint: ${prevPoint['point_total']}`);
        temptotalPoint = prevPoint['point_total'] + complainPoint;
        logger.info(`new point : ${temptotalPoint}`);
        await complainerDAO.updateComplainUserData(userId, temptotalPoint)
        const totalPoint = await complainerDAO.getUserPoint(userId);
        toUserMsg  = `네, 접수되었습니다. 500 포인트가 적립되어서 현재 적립금은 ${totalPoint['point_total']} 원 입니다. 감사합니다. 불편제보를 계속하시려면 아래 불편제보를 눌러주세요!`;
        ctx.body = {
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
                  "messageText": "처음으로",
                  "action": "message",
                  "label": "처음으로"
                }
              ]
          }
        };
      }
    } catch(err) {
      logger.warn("DB insert error");
      toUserMsg = '포인트 적립에 실패했습니다. 다시 접수해주세요.';
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
    }
  }
  else {    
    logger.info('fullback function?');
    const complainerDAO = new signalDAO('complainer');
    const existUser = await complainerDAO.checkExistUser(userId);
    const  existUserInfo = await complainerDAO.checkExistUserInfo(userId);
    if(existUser['cnt'] == 0 || existUserInfo['cnt'] != 0) {
      ctx.body = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": '안녕하세요 불편러님!\n현재 불편러님은 등록하신 프로필 정보가 없습니다. 아래의 말풍선을 클릭 후 해당하는 값을 입력해주세요.'
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
     ctx.body = {
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
                "messageText": "입금신청",
                "action": "message",
                "label": "입금신청"
              },
              {
                "messageText": "친구에게 채널 공유하기",
                "action": "message",
                "label": "친구에게 채널 공유하기"
              }
            ]
        }
      };
    }
  }        
})

// 포인트조회
router.post('/kakaoChat/myPoint', async (ctx, next) => {
  logger.info('welcome');
  const userId = ctx.request.body.userRequest.user.id;
  let toUserMsg = ``;
  logger.info(`userid: ${userId}`);
  logger.info('mypoint');
  const complainerDAO = new signalDAO('complainer');
  // 불편테이블 추가
  const totalPoint = await complainerDAO.getUserPoint(userId);
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

// 입금신청
router.post('/kakaoChat/reqIncome', async (ctx, next) => {
  logger.info('reqIncome');
  const userId = ctx.request.body.userRequest.user.id;
  let toUserMsg = ``;
  logger.info(`userid: ${userId}`);
  const complainerDAO = new signalDAO('complainer');
  // 불편테이블 추가
  const totalPoint = await complainerDAO.getUserPoint(userId);
  const existUser = await complainerDAO.checkExistUser(userId);
  if(totalPoint == '' || existUser['cnt'] == 0) {
    toUserMsg = '현재 불편러님은 보유하신 포인트가 없습니다. 새로운 불편을 접수하신 후 입금신청 부탁드립니다.';
  }
  else {
    try {
      const incomeSatus = await complainerDAO.checkIncomeStatus(userId);
      if(incomeSatus['status'] == 1) {
        toUserMsg = `이미 입금신청이 완료됐습니다. 5영업일 이내 입금이 완료됩니다.`;
      }
      else {
        await complainerDAO.updateComplainUserIncome(userId);
        toUserMsg = `입금신청이 완료됐습니다. 5영업일 이내 입금이 완료됩니다.`;
      }

    } catch(err) {
      toUserMsg = `입금신청이 실패했습니다. 다시 시도해주세요.`;
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
                      "text": '해당하는 연령대를 선택해주세요'
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
                      "text": '해당하는 성별을 선택해주세요'
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
                      "text": '해당하는 성별을 선택해주세요'
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
                      "text": '해당하는 직업을 선택해주세요'
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
                      "text": '해당하는 직업을 선택해주세요'
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
              "messageText": "입금신청",
              "action": "message",
              "label": "입금신청"
            },
            {
              "messageText": "친구에게 채널 공유하기",
              "action": "message",
              "label": "친구에게 채널 공유하기"
            }
          ]
      }
    };
  }
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

// 친구에게 공유하기 skill (추천인 코드 조회 포함)
router.post('/kakaoChat/myRefCode', async (ctx, next) => {
  logger.info('welcome');
  const userId = ctx.request.body.userRequest.user.id;
  let toUserMsg = ``;
  logger.info(`userid: ${userId}`);
  logger.info('mypoint');
  const complainerDAO = new complainUserDAO();
  // 불편테이블 추가
  const refCode = await complainerDAO.getRef(userId);
  if(refCode['ref_code'] == '') {
    toUserMsg = '등록된 프로필이 없습니다. 프로필을 먼저 등록해주세요';
  }
  else {
    toUserMsg = `안녕하세요 '프로불편러'입니다. \n저희는 당신이 일상속에서 어떤 불편을 마주하는지 듣고 싶습니다.
당신의 제보로 세상을 조금 더 편하게 바꾸어 보세요.
소중한 제보는 최소 500원에서 최대 2000원까지 보상해드립니다.(기술적으로 해결할 수 있는 불편함대상. 스팸제외.)
http://pf.kakao.com/_SxgChb/chat (추천인코드: ${refCode['ref_code']})\n
친구가 불편러님의 추천인 코드를 입력하면 추가로 500포인트를 지급합니다.`
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

export default router;
