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
import adsDAO from '../dao/adsRewardDAO';

// condition
import {ipAllowedCheck} from '../module/condition';

// module 
import {sendKaKaoEventAPI} from '../util/kakaobot';

const router: Router = new Router();

// 키워드 등록 시작
router.post('/registerKeyword', async (ctx, next) => {
    logger.info('start to register keyword');
    const userId = ctx.request.body.userRequest.user.id;
    let fromUserMsg = ctx.request.body.userRequest.utterance;;
    let toUserMsg = ``;
    const adsRewardDAO = new adsDAO();
    const existUser = await adsRewardDAO.checkExistUser(userId);
    logger.info(`userid: ${fromUserMsg}`);
    let userMsg = `💁🏻‍♂️ 관심 키워드 번호를 아래 채팅창에 모두 입력해주세요:)
✓ 숫자 2개 이상 입력    
✓ 숫자간 구별 부호 필수 : 쉼표(,)
▶︎ 예시 - 1, 2, 5`
      ctx.body = {
        "version": "2.0",
        "template": {
          "outputs": [
            {
              "basicCard": {
                "description": userMsg,
                "thumbnail": {
                  "imageUrl": "https://i.ibb.co/Qdrnz6b/001-1.png"
                }
            }
          }
          ]
        }
    }
})
  

// 기본정보입력 - 나이
router.post('/inputAge', async (ctx, next) => {
    logger.info('inputInfo AGe');
    const userId = ctx.request.body.userRequest.user.id;
    let fromUserMsg = ctx.request.body.userRequest.utterance;;
    let toUserMsg = ``;
    const adsRewardDAO = new adsDAO();
    const existUser = await adsRewardDAO.checkExistUser(userId);
    logger.info(`userid: ${fromUserMsg}`);

    if(fromUserMsg.trim().indexOf('프로필 등록') != -1) {
        logger.info('here');
        ctx.body = {
            "version": "2.0",
            "template": {
                "outputs": [
                    {
                        "simpleText": {
                            "text": '연령대를 선택해주세요. (등록 1/4)'
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
                    "messageText": "40대 이상",
                    "action": "message",
                    "label": "40대 이상"
                }
                ]
            }
        };
    }
    else if (fromUserMsg.trim().indexOf('대') != -1) {
        let age = fromUserMsg.substring(0,2);
        logger.info(`age right? ${age}`);
        if(existUser['cnt'] == 0) {
          await adsRewardDAO.insertRewardUserAge(userId, age);
        } else {
          await adsRewardDAO.updateRewardUserAge(userId, age);
        }
        ctx.body = {
          "version": "2.0",
          "template": {
              "outputs": [
                  {
                      "simpleText": {
                          "text": '💁🏻‍♂️ 성별을 선택해주세요. (등록 2/4)'
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
  router.post('/inputSex', async (ctx, next) => {
    logger.info('inputInfo Sex');
    const userId = ctx.request.body.userRequest.user.id;
    let fromUserMsg = ctx.request.body.userRequest.utterance;;
    let toUserMsg = ``;
    const adsRewardDAO = new adsDAO();
    // 불편테이블 추가
    const existUser = await adsRewardDAO.checkExistUser(userId);
    logger.info(`userid: ${userId}`);
  
    if(fromUserMsg.trim().indexOf('성별') != -1) {
      ctx.body = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": '💁🏻‍♂️ 성별을 선택해주세요. (등록 2/4)'
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
        await adsRewardDAO.insertRewardUserSex(userId, sex);
      } else {
        await adsRewardDAO.updateRewardUserSex(userId, sex);
      }
      ctx.body = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": '💁🏻‍♂️ 직업을 선택해주세요. (등록 3/4)'
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
              },
              {
                "messageText": "기타",
                "action": "message",
                "label": "기타"
              }             
            ]
        }
      };
    }
  })
  
  // 기본정보입력 - 직업
  router.post('/inputJob', async (ctx, next) => {
    logger.info('inputInfo Job');
    const userId = ctx.request.body.userRequest.user.id;
    let fromUserMsg = ctx.request.body.userRequest.utterance;;
    let toUserMsg = ``;
    const adsRewardDAO = new adsDAO();
    // 불편테이블 추가
    const existUser = await adsRewardDAO.checkExistUser(userId);
    logger.info(`userid: ${userId}`);
  
    if(fromUserMsg.trim().indexOf('직업') != -1) {
      ctx.body = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": '💁🏻‍♂️ 직업을 선택해주세요. (등록 3/4)'
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
              },
              {
                "messageText": "기타",
                "action": "message",
                "label": "기타"
              }           
            ]
        }
      };
    } else if (fromUserMsg.trim().indexOf('직장인') != -1 || fromUserMsg.trim().indexOf('사업가') != -1 ||
    fromUserMsg.trim().indexOf('학생') != -1 || fromUserMsg.trim().indexOf('주부') != -1 ||
    fromUserMsg.trim().indexOf('무직') != -1 || fromUserMsg.trim().indexOf('기타') != -1) {
      const job = fromUserMsg.trim();
      logger.info(`job right? ${job}`);
      
      if(existUser['cnt'] == 0) {
        await adsRewardDAO.insertRewardUserJob(userId, job);
      } else {
        await adsRewardDAO.updateRewardUserJob(userId, job);
      }
      let userMsg = `💁🏻‍♂️ 입력한 키워드와 관련된 광고 소식을 받아 보길 원하시면, 핸드폰 번호를 입력해주세요.(4/4)`;
      ctx.body = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": userMsg
                    }
                }
            ]
        }
    }
    }
  })
 
  
  // 풀백함수를 이용 키워드, 번호 입력받기 
  router.post('/fullback', async (ctx, next) => {
    logger.info('inputInfo Job');
    const userId = ctx.request.body.userRequest.user.id;
    let fromUserMsg = ctx.request.body.userRequest.utterance;;
    let toUserMsg = ``;
    const adsRewardDAO = new adsDAO();
    // 불편테이블 추가
    const existUser = await adsRewardDAO.checkExistUser(userId);
    if(fromUserMsg.trim().indexOf(',') != -1) {
        // 키워드 입력
        if(existUser['cnt'] == 0) {
            await adsRewardDAO.insertRewardUserkeywords(userId, fromUserMsg);
            ctx.body = {
              "version": "2.0",
              "template": {
                  "outputs": [
                      {
                          "simpleText": {
                              "text": '💁🏻‍♂️ 연령대를 선택해주세요. (등록 1/4)'
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
                      "messageText": "40대 이상",
                      "action": "message",
                      "label": "40대 이상"
                  }
                  ]
              }
          };
          } else {
            await adsRewardDAO.updateRewardUserkeywords(userId, fromUserMsg);
            let userMsg = `✅ 고객님의 관심 키워드 등록이 완료 되었습니다.
            (현재 ‘스타트업 서비스’ 관련 광고 소식만 받아볼 수 있으며, 향후 다양한 키워드로 늘려나갈 예정입니다)`;
                      ctx.body = {
                        "version": "2.0",
                        "template": {
                            "outputs": [
                                {
                                    "simpleText": {
                                        "text": userMsg
                                    }
                                }
                            ]
                        }
                    }
          } 
          
    } else if(fromUserMsg.trim().indexOf('01') != -1) {
        // 키워드 입력
        if(existUser['cnt'] == 0) {
            await adsRewardDAO.insertRewardUserTelno(userId, fromUserMsg);
          } else {
            await adsRewardDAO.updateRewardUserTelno(userId, fromUserMsg);
          }
          let userMsg = `✅ 고객님의 관심 키워드 등록이 완료 되었습니다.
(현재 ‘스타트업 서비스’ 관련 광고 소식만 받아볼 수 있으며, 향후 다양한 키워드로 늘려나갈 예정입니다)`;
          ctx.body = {
            "version": "2.0",
            "template": {
                "outputs": [
                    {
                        "simpleText": {
                            "text": userMsg
                        }
                    }
                ]
            }
        }
    }
    else {
        ctx.body = {
            "version": "2.0",
            "template": {
              "outputs": [
                {
                  "basicCard": {
                    "description": '',
                    "thumbnail": {
                      "imageUrl": "https://i.ibb.co/ZG48Hhc/002-12.png"
                    }
                }
              }
              ]
            }
        }
    }
  })


// 오늘의 광고 보기
router.post('/viewAds', async (ctx, next) => {
    logger.info('start to register keyword');
    const userId = ctx.request.body.userRequest.user.id;
    let fromUserMsg = ctx.request.body.userRequest.utterance;;
    let toUserMsg = ``;
    const adsRewardDAO = new adsDAO();
    const existUser = await adsRewardDAO.checkExistUser(userId);
    logger.info(`userid: ${fromUserMsg}`);

    // 키워드 등록 대상 
    if(existUser['cnt'] == 0) {
        toUserMsg = `🙋🏻‍♀️고객님의 관심 키워드를 등록해주세요
키워드를 등록하신 후, 서비스를 이용하실 수 있습니다:)`;
      ctx.body = {
      "version": "2.0",
      "template": {
      "outputs": [
        {
          "basicCard": {
            "description": toUserMsg,
            "thumbnail": {
              "imageUrl": "https://i.ibb.co/McTyzyy/register-Keyword.png"
            }
        }
      }
      ]
      }
      };
    } else {
        toUserMsg =  `‍[오늘의 광고]
"원하지 않은 광고의 잦은 노출! 너무 피곤해요ㅜㅜ"
그렇다면 지금 바로 '애즈머니' 채널을 추가하세요!`;
        quizAnswer(userId);
        ctx.body = {
          "version": "2.0",
          "template": {
            "outputs": [
              {
                "basicCard": {
                  "description": toUserMsg,
                  "thumbnail": {
                    "imageUrl": "https://i.ibb.co/QMhz3LR/find-Keyword.png"
                  },
                  "buttons": [
                    {
                      "action": "webLink",
                      "label": "광고보기",
                      "webLinkUrl": "https://pf.kakao.com/_kBtBxj"
                    }
                  ]
                }
              }
        ]
      }
      };
    }   


})

// 오늘의 광고 보기
router.post('/quizAnswer', async (ctx, next) => {
  const userId = ctx.request.body.userRequest.user.id;
  const adsRewardDAO = new adsDAO();
  let toUserMsg = ``;
  const prevPoint = await adsRewardDAO.getUserPoint(userId);
  const prevAnsCnt = await adsRewardDAO.getUserAnswerCnt(userId);
  const prevUpdate = await adsRewardDAO.getUserPointDate(userId);
  let today = moment().format('YYYY-MM-DD');
  let pointDate = moment(prevUpdate['point_update_date']).format('YYYY-MM-DD');
  const flag = prevPoint['point_total'] == 0 && prevAnsCnt['answer_cnt'] == 0;
  logger.info(`${today == pointDate}, ${flag}`);
  if(today == pointDate && !flag) {
    toUserMsg = `이미 정답을 맞추셨습니다. 다음 광고를 기대해주세요!`
  } else {
    let tempTotalPoint = prevPoint['point_total'] + 100;
    await adsRewardDAO.updateAdsUserPoint(userId, tempTotalPoint, prevAnsCnt['answer_cnt']+1);
    toUserMsg = `정답이니다! 현재 고객님의 포인트는 ${tempTotalPoint}입니다.`
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
}
})



// 포인트 조회 및 적립금 출금 
router.post('/getPoint', async (ctx, next) => {
  const userId = ctx.request.body.userRequest.user.id;
  const adsRewardDAO = new adsDAO();
  let toUserMsg = ``;
  const prevPoint = await adsRewardDAO.getUserPoint(userId);
  const existUser = await adsRewardDAO.checkExistUser(userId);

  // 키워드 등록 대상 
  if(existUser['cnt'] == 0) {
      toUserMsg = `🙋🏻‍♀️고객님의 관심 키워드를 등록해주세요
키워드를 등록하신 후, 서비스를 이용하실 수 있습니다:)`;
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
  }
} else {
  
  if(prevPoint['point_total'] < 1000 ) {
    toUserMsg = `💲누적 적립 캐시 : ${prevPoint['point_total']}원
1,000원 부터 현금출금이 가능합니다:)`
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
}
  } else {
    toUserMsg = `💲누적 적립 캐시 : ${prevPoint['point_total']}원
출금을 원하시면, 아래 "출금하기" 버튼을 클릭해주세요.`
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
            "messageText": "출금하기",
            "action": "message",
            "label": "출금하기"
          }
        ]
    }
  }
  }
}
})


// 적립금 출금
router.post('/requestIncome', async (ctx, next) => {
  const userId = ctx.request.body.userRequest.user.id;
  const adsRewardDAO = new adsDAO();
  let toUserMsg = `출금신청이 완료됐습니다.
상담직원 연결로 전환 후 "출금"이라고 메시지를 보내주세요. 😀`;
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
  }
})


function quizAnswer(userId) {
  let msg = `Quiz) 오늘의 광고 속 브랜드 이름은 무엇일까요?`;
  setTimeout(function() {
    sendKaKaoEventAPI("adsmoney_quiz", userId, msg, "adsmoney"); 
  }, 30000);
}

  
export default router;