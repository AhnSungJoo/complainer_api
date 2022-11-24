import * as Router from 'koa-router';
import * as moment from 'moment';
import * as settingConfig from 'config';
// import * as emoji from 'telegram-emoji-map';

import logger from '../util/logger';
import overviewRouter from './overview';
import functionRouter from './function';
import descriptionRouter from './description';
import alarmFunction from './alarmFunction';
import alarmRouter from './alarm';
import albaRouter from './alba';
//import CodeGenerator from 'node-code-generator';


import {sendInternalMSG, sendInternalErrorMSG} from '../module/internalMSG';
import {sendExternalMSG} from '../module/externalMSG';
import {sendSlackWebHook} from '../util/slackbot';
import {sendErrorMSG} from '../module/errorMSG';

import {upsertData} from '../module/insertDB';
import {getPaging} from '../util/paging';

import { config } from 'winston';

// dao
import signalDAO from '../dao/signalDAO';
import complainUserDAO from '../dao/complainUserDAO';
import logDAO from '../dao/complainLogDAO';
import flagDAO from '../dao/flagDAO';
import nameDAO from '../dao/nameDAO';
import { start } from 'repl';

const router: Router = new Router();

let complainPoint = 500;

// Dashboard
router.get('/', async (ctx, next) => {
  logger.info('index here');
  const userDAO = new complainUserDAO();
  const complainDAO = new signalDAO('complainer');
  //  누적 불편작성, 프로필 등록, 불편 작성 유저 수
  const userTotal = await userDAO.getTotalComplain();
  const complainTotal = await complainDAO.getTotalComplain();
  const complainerWriterTotal = await complainDAO.getTotalComplainWriter();

  // 프로필 등록한 유저 정보 통계 
  const ageCnt = await userDAO.getUsersAgeInfo();
  const sexCnt = await userDAO.getUsersSexInfo();
  const jobCnt = await userDAO.getUsersJobInfo();
  const todayComlains = await complainDAO.getTodayComplain();
  const todayUsers = await userDAO.getTodayComplain();

  // ejs로 넘길 값 전처리
  const complainCnt = todayComlains[0]['cnt'] ? todayComlains[0]['cnt'] : 0;
  const profileCnt = todayUsers[0]['cnt'] ? todayUsers[0]['cnt'] : 0;
  const userTotals = userTotal[0]['cnt'];
  const complainTotals = complainTotal[0]['cnt'];
  const complainerWriterTotals = complainerWriterTotal[0]['cnt']

  return ctx.render('index', {ageCnt, sexCnt, jobCnt, complainCnt, profileCnt, userTotals, complainTotals, complainerWriterTotals});
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
  if(fromUserMsg.trim().indexOf('불편제보') != -1 || fromUserMsg.trim().indexOf('불편 작성하기') != -1 ) {
    logger.info('불편제보');
    await writeLog('complain');
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
                          "text": '👩🏻 불편을 제보하시기 전, 고객님의 간단한 프로필 정보를 등록해주세요.'
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
        toUserMsg = `✍🏻 작성방법\n\n1️⃣ 일상에서 느꼈던 소소한 불편 경험 또는 이런거 있으면 더 편할 것 같은데! 하는 아이디어 작성하기\n\n2️⃣ 작성된 내용 끝에 “접수” 입력하기\n예시) “————불편해요. 접수”\n\n3️⃣ 최대 4배 적립 받는 방법😍
- 더 많은 사람들이 공감할 수 있는 불편
- 불편한 상황을 이해할 수 있는 설명
- 해당 불편을 어떻게 해결했는지 경험
- 불편에 대해 원하는 해결 방법 제안\n
☝🏻위 4가지 항목 중 하나라도 자세하게 작성해 주시면 4배 적립 보장!\n
💝첫 불편 제보는 기본 적립금 2배!`;
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
    let exceptMsg = fromUserMsg.trim().replace('접수', '');
    if(userId == '211ead65277e1ea39ecf3f0c92b43a0dfa06c6f2577244119f32b819f05d90dde1'
    || userId == '691a172fbe68794e192d810325d8c1d778f70b4a2a42ec122169938bc92797f7bd'
    || userId == 'd3620bbdda9ef6a900a1d0089213f60ddbb05d8c3b238cf8861c55a9012f6f5895') {
      resutlJson = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": '불편 제보 어뷰징으로 사용이 제한된 계정입니다. 상담직원 연결을 통해 문의 바랍니다.\n서비스 이용에 불편을 드려 죄송합니다.'
                    }
                }
            ]
        }
      };
    } else if(exceptMsg.length == 0) {
      resutlJson = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": `불편 내용을 입력해주세요. 😀`
                    }
                }
            ]
        }
      };
    } else {
      try {
        const complainerDAO = new signalDAO('complainer');
        let checkCountUser = await complainerDAO.getSpecipcComplainerCount(userId);
        const existUser = await complainerDAO.checkExistUser(userId);
        const  existUserInfo = await complainerDAO.checkExistUserInfo(userId);
        if(existUser['cnt'] == 0 || existUserInfo['cnt'] != 0) { //프로필 미등록 고객
          resutlJson = {
            "version": "2.0",
            "template": {
                "outputs": [
                    {
                        "simpleText": {
                            "text": '👩🏻 불편을 제보하시기 전, 고객님의 간단한 프로필 정보를 등록해주세요.'
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
        } else { // 프로필 등록 고객
          let tempTotalPoint = 0;
          let prevPoint = await complainerDAO.getUserPoint(userId);
          // 불편테이블 추가
          fromUserMsg = await filterUserMsg(fromUserMsg); // 특수문자 필터링
          if(checkCountUser[0]['cnt'] == 0) {
            tempTotalPoint = prevPoint['point_total'] + (complainPoint * 2); // 두 배 적립
            await complainerDAO.insertComplainContext(fromUserMsg, userId, complainPoint * 2);
          } else {
            tempTotalPoint = prevPoint['point_total'] + complainPoint;
            await complainerDAO.insertComplainContext(fromUserMsg, userId, complainPoint);
          }
          
          await complainerDAO.updateComplainUserData(userId, tempTotalPoint);
          const totalPoint = await complainerDAO.getUserPoint(userId);
          const totalPointComma = totalPoint['point_total'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
          if(checkCountUser[0]['cnt'] == 0) {
            await sendSlackWebHook(` ✔️ 첫 불편 접수 완료! ${fromUserMsg}`, 'complain');
            toUserMsg  = `✔️불편 접수 완료!
  첫 불편 제보에 감사드리며, 기본 적립금의 2배 지급해드렸습니다.
  💰현재 누적 적립금 : "${totalPointComma}"원
            
  🙅‍어뷰징 또는 다음 불편 규정에 따르지 않는 경우, 적립금은 회수될 수 있으니 참고 부탁드립니다.
  - 너무 사적인 내용
  - 특정 서비스에 특화된 불편
  - 정부 정책 관련 불편`;
          } else { // 첫 불편접수
            await sendSlackWebHook(` ✔️ 불편 접수 완료! ${fromUserMsg}`, 'complain');
            toUserMsg  = `✔️불편 접수 완료! 
  💰현재 누적 적립금 : "${totalPointComma}"원
            
  🙅‍어뷰징 또는 다음 불편 규정에 따르지 않는 경우, 적립금은 회수될 수 있으니 참고 부탁드립니다.
  - 너무 사적인 내용
  - 특정 서비스에 특화된 불편
  - 정부 정책 관련 불편`;
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
                ],
                "quickReplies": [
                  {
                    "messageText": "💰 출금 신청하기",
                    "action": "message",
                    "label": "💰 출금 신청하기"
                  },
                  {
                    "messageText": "🎃 친구초대 이벤트",
                    "action": "message",
                    "label": "🎃 친구초대 이벤트"
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
  }
  else if(fromUserMsg.trim().indexOf('추천인코드') != -1){
    const firstIdx = fromUserMsg.trim().indexOf('추천인코드') + 6;
    logger.info(`firt: ${firstIdx}`);
    const  refCode  = fromUserMsg.trim().substring(firstIdx, firstIdx+6); 
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
                          "text": '👩🏻 추천인 등록을 위해서, 고객님의 간단한 프로필 정보를 등록해주세요.'
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
  else if(fromUserMsg.trim().indexOf('헬스장') != -1 || fromUserMsg.trim().indexOf('캠핑') != -1 ||
  fromUserMsg.trim().indexOf('자취') != -1 || fromUserMsg.trim().indexOf('대중교통') != -1){ // 불편 키워드 응답
    logger.info(`키워드 입력 !`);
    try{
    let keyword = "";
    let privateMSg = "";
    if(fromUserMsg.trim().indexOf('헬스장') != -1) {
      keyword = "헬스장";
      privateMSg = `"헬스장에서 한 기구를 오래 쓰시는 분들이 있는데 언제 끝날지 모르니까 기다리다가 결국 못한 경우가 종종 생겨서 기분이 별로였습니다. 사용시간 제한했으면 좋겠어요!"`
    } else if(fromUserMsg.trim().indexOf('캠핑') != -1) {
      keyword = "캠핑";
      privateMSg = `"캠핑을 자주 하지는 않아서 구매 하긴 그렇고 좀 저렴하게 용품을 대여할 수 있는 커뮤니티가 있었으면 좋겠네요!"`;
    } else if(fromUserMsg.trim().indexOf('자취') != -1) {
      keyword = "자취";
      privateMSg = `"혼자 사니까 저녁은 라면으로 대충 때운 적이 많아요. 1인 가구가 좀 저렴하지만 건강하게 균형잡힌 식사를 할 수 있으면 좋겠어요!"`
    } else if(fromUserMsg.trim().indexOf('대중교통') != -1) {
      keyword = "대중교통";
      privateMSg = `"오늘 역대급으로 배차간격 길고, 기다리는 사람 줄도 길었고 결국 제 출퇴근시간은 엉망진창이 되어버렸어요. 개선된 것도 없고 이런 불편을 최소화할 방법이 없을까요?"`;
    }
    logger.info(`private : ${privateMSg}`);
    let publicMsg = `👩🏻"${keyword}" 키워드와 관련하여
어떤 불편을 경험하셨나요? 혹은
어떤 게 있었으면 더 편했을까요?

👥 실제 접수된 불편 
${privateMSg}`
    logger.info(`public : ${publicMsg}`);

    resutlJson = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": publicMsg
                  }
              }
          ],
          "quickReplies": [
            {
              "messageText": "📝불편 작성하기",
              "action": "message",
              "label": "📝불편 작성하기"
            },
            {
              "messageText": "헬스장",
              "action": "message",
              "label": "헬스장"
            },
            {
              "messageText": "캠핑",
              "action": "message",
              "label": "캠핑"
            },
            {
              "messageText": "대중교통",
              "action": "message",
              "label": "대중교통"
            },
            {
              "messageText": "자취",
              "action": "message",
              "label": "자취"
            }
          ]
      }
  };

    } catch(err) {
      resutlJson = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": `키워드 검색 중 오류가 발생했습니다.`
                    }
                }
            ]
        }
      };
    }
  }  
  else if(fromUserMsg.trim().indexOf('1인가구') != -1 || fromUserMsg.trim().indexOf('중고거래') != -1 ||
  fromUserMsg.trim().indexOf('날씨') != -1 || fromUserMsg.trim().indexOf('반려동물') != -1 || fromUserMsg.trim().indexOf('아이디어') != -1){ 
    try{
      let keyword = "";
      let privateMSg = "";
      if(fromUserMsg.trim().indexOf('1인가구') != -1) {
        keyword = "1인가구";
        privateMSg = `"자취를 하다 보면 여러 집을 이사 다니는데요. 부동산어플은 집값이 떨어질까 봐 좋은 얘기밖에 없어서 실질적으로 도움이 되지 않아요. 소음, 악취같이 실거주자가 작성하는 부동산계의 프로불편러 어플이 있었으면 좋겠습니다."`
      } else if(fromUserMsg.trim().indexOf('중고거래') != -1) {
        keyword = "중고거래";
        privateMSg = `"안 쓰는 물건이나 중고 물품을 사고파는 당근마켓 같은 환경이 잘되어 있지만 해당 물품의 가치를 모르는 경우 싼값에 팔거나 구석에 방치되어 있을 수 있어요. 해당 물품을 올려 관련 전문가들에게 확인받을 수 있는 것도 좋겠지만, 신청자의 집에 방문해 값이 나갈 것 같은 물건을 찾아주고 적당한 값을 매겨주는 서비스가 있으면 좋을 것 같습니다!"`;
      } else if(fromUserMsg.trim().indexOf('날씨') != -1) {
        keyword = "날씨";
        privateMSg = `"비가 오는 날만 가르쳐주는 예보어플이 있으면 좋겠어요. 겨울이 아니면 저는 일기예보를 잘 안봅니다. 대부분이 맑은 날이라서 아 그렇구나하고 넘어가다가 우산을 미쳐 준비 못하는 경우가 많습니다."`
      } else if(fromUserMsg.trim().indexOf('반려동물') != -1) {
        keyword = "반려동물";
        privateMSg = `"강아지랑 밖에서 산책할 때 강아지의 대변 종류에 따라 줍기 힘든 경우가 많아요. 그 외에도 냄새가 나서 손으로 직접 만지기 싫어지기도 합니다. 간편한 방법으로 손쉽게 강아지의 대변을 처리할 수 있는 기계가 없어서 불편해요."`;
      }
      else if(fromUserMsg.trim().indexOf('아이디어') != -1) {
        keyword = "아이디어";
        privateMSg = `"본인이 생각해도 기발한 아이디어거나 너무 재밌는 시나리오가 떠올랐는데 직접 하기에는 귀찮고 그냥 넘어가기엔 아까울 때 이용할 수 있는 대중화된 곳 있으면 좋겠어요."`;
      }
      logger.info(`private : ${privateMSg}`);
      let publicMsg = `👥 실제 접수된 불편 
${privateMSg}

👩🏻"${keyword}" 키워드와 관련하여 어떤 불편을 경험하셨나요? 혹은 어떤 게 있었으면 더 편했을까요?`
      logger.info(`public : ${publicMsg}`);
      resutlJson = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": publicMsg
                    }
                }
            ],
            "quickReplies": [
              {
                "messageText": "📝불편 작성하기",
                "action": "message",
                "label": "📝불편 작성하기"
              },
              {
                "messageText": "1인가구",
                "action": "message",
                "label": "1인가구"
              },
              {
                "messageText": "중고거래",
                "action": "message",
                "label": "중고거래"
              },
              {
                "messageText": "날씨",
                "action": "message",
                "label": "날씨"
              },
              {
                "messageText": "반려동물",
                "action": "message",
                "label": "반려동물"
              },
              {
                "messageText": "아이디어",
                "action": "message",
                "label": "아이디어"
              }
            ]
        }
    };
  
      } catch(err) {
        resutlJson = {
          "version": "2.0",
          "template": {
              "outputs": [
                  {
                      "simpleText": {
                          "text": `키워드 검색 중 오류가 발생했습니다. "🔔 이번달 인기키워드" 메뉴를 다시 클릭해주세요!`
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
                        "text": '👩🏻 불편을 제보하시기 전, 고객님의 간단한 프로필 정보를 등록해주세요.'
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
                        "text": `혹시 불편 작성중이셨나요? 작성 내용 마지막에 "접수"를 입력해주셔야 불편이 정상적으로 접수됩니다.`
                    }
                }
            ],
            "quickReplies": [
              {
                "messageText": "📝불편 작성하기",
                "action": "message",
                "label": "📝불편 작성하기"
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
  const totalPointComma = totalPoint['point_total'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
                      "text": '👩🏻 불편을 제보하시기 전, 고객님의 간단한 프로필 정보를 등록해주세요.'
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
    toUserMsg = `💰현재 누적 적립금 : ${totalPointComma}원
📍5,000원 부터 출금신청 가능하니,
  여러분의 불편이나 제안을 편하게 
  작성해주세요.`;
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
  try {
    await writeLog('income');
  } catch(err) {
    logger.info(`erro : ${err}`);
  }
  
  const userId = ctx.request.body.userRequest.user.id;
  let toUserMsg = ``;
  logger.info(`userid: ${userId}`);
  const complainerDAO = new signalDAO('complainer');
  // 불편테이블 추가
  const totalPoint = await complainerDAO.getUserPoint(userId);
  const existUser = await complainerDAO.checkExistUser(userId);
  if(existUser['cnt'] == 0) {
    let resutlJson = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": '👩🏻 출금 신청하기 위해서 고객님의 간단한 프로필 정보를 등록해주세요.'
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
    ctx.body = resutlJson;
  } else {
    const totalPointComma = totalPoint['point_total'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    logger.info(`totalPoint: ${Number(totalPoint['point_total'])}`);
    if(totalPoint == '' || existUser['cnt'] == 0) {
      toUserMsg =`💰현재 누적 적립금 : “${totalPoint['point_total']}원"\n
  📍2,000원 부터 적립금 출금신청이 가능하니, 여러분의 불편이나 제안을 편하게 작성해주세요.`;
    }
    else if(Number(totalPoint['point_total']) < 2000) {
      toUserMsg = `💰현재 누적 적립금 : "${totalPointComma}원"\n
  📍2,000원 부터 적립금 출금신청이 가능하니, 여러분의 불편이나 제안을 편하게 작성해주세요.`;
    }
    else {
      try {
        const incomeSatus = await complainerDAO.checkIncomeStatus(userId);
        if(incomeSatus['status'] == 1) {
          toUserMsg = `이미 출금신청이 접수되었습니다. 
  영업일 기준 3일 이내 출금될 예정입니다.`;
        }
        else {
          await complainerDAO.updateComplainUserIncome(userId);
          toUserMsg = `👩🏻 출금신청이 접수되었습니다.
  💰 출금 예정 금액 : “${totalPointComma}”원\n
  ✔️ 본인 확인을 위해 아래 “상담직원 연결”메뉴를 누르신 후 메시지를 보내주세요.`;
        await sendSlackWebHook(`💰 “프로불편러”에 출금신청 완료!`, 'complain');
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
  }
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
                      "text": '👩🏻 불편을 제보하시기 전, 고객님의 간단한 프로필 정보를 등록해주세요.'
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
                      "text": '연령대를 선택해주세요. (등록 1/3)'
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
                      "text": '성별을 선택해주세요. (등록 2/3)'
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
                      "text": '성별을 선택해주세요. (등록 2/3)'
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
                      "text": '직업을 선택해주세요. (등록 3/3)'
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
                      "text": '직업을 선택해주세요. (등록 3/3)'
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
      await complainerDAO.insertComplainUserJob(userId, job);
    } else {
      await complainerDAO.updateComplainUserJob(userId, job);
    }
    const refCode = await generateRefCode();
    const complainerUserDAO = new complainUserDAO();
    await complainerUserDAO.updateRef(userId, refCode);
    const userData = await complainerDAO.getUserinfo(userId);
    let sex = '';
    if(userData['sex'] == '1') {
      sex = "남자";
    } else {
      sex = "여자";
    }
    await sendSlackWebHook(`👩🏻 “프로불편러”에 프로필 정보 등록 완료!`, 'complain');
    let completeMsg = `✔️ 프로필 정보 등록 완료!
지금 제보하면 기본 적립금이 2배 ❗️
하단 챗봇 메뉴 “📝불편 작성하기”를 통해
여러분의 일상속 불편을 제보해주세요!

제보할 내용이 당장 떠오르지 않는다면,
프로불편러 ${userData['age']}대 ${sex}
“인기 키워드” 살펴보기👇`
    ctx.body = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": completeMsg
                  }
              }
          ],
          "quickReplies": [
            {
              "messageText": "📝불편 작성하기",
              "action": "message",
              "label": "📝불편 작성하기"
            },
            {
              "messageText": "헬스장",
              "action": "message",
              "label": "헬스장"
            },
            {
              "messageText": "캠핑",
              "action": "message",
              "label": "캠핑"
            },
            {
              "messageText": "대중교통",
              "action": "message",
              "label": "대중교통"
            },
            {
              "messageText": "자취",
              "action": "message",
              "label": "자취"
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
    toUserMsg = `현재 프로필을 등록하신 분들께 추천인 코드를 발급해 드리고 있습니다.
번거롭게 해드려 죄송하지만, 하단 챗봇 메뉴 [📝 불편 작성하기] 를 통해 프로필을 등록하신 후, 이용해 주세요!🙏`
    resutlJson = {
      "version": "2.0",
      "data": {
        "msg": toUserMsg
      }
    };
  } else {
    const refCode = await complainerDAO.getRef(userId);
    if(existUser['cnt'] == 0 || existUserInfo['cnt'] != 0) { // 프로필 등록이 안돼있는경우
        toUserMsg = `현재 프로필을 등록하신 분들께 추천인 코드를 발급해 드리고 있습니다.
번거롭게 해드려 죄송하지만, 하단 챗봇 메뉴 [📝 불편 작성하기] 를 통해 프로필을 등록하신 후, 이용해 주세요!🙏`
    } else {
      toUserMsg = `친구에게 “프로불편러” 소개하고 혜택 받아가세요! 🙌

초대받은 친구가 ‘채널추가 & 코드입력’ 하면 1,000원 적립해 드려요.
      
🔐 추천인코드=${refCode['ref_code']}
🤳 채널링크: https://bit.ly/3STFEYl`
    }
   // 응답 데이터 사용방법 
   // 아래 json key 값에 data 파라미터 사용 
   // 카카오톡 챗봇 관리자센터에서 webhack.msg 로 받을 수 있음 
  resutlJson = {
    "version": "2.0",
    "data": {
      "msg": toUserMsg
    }
  };
}
  ctx.body = resutlJson;
})

// 추천인코드 입력
router.post('/kakaoChat/registerRefcode', async (ctx, next) => {
  logger.info('registerRefCode');
  await writeLog('refCode');
  const userId = ctx.request.body.userRequest.user.id;
  let fromUserMsg = ctx.request.body.userRequest.utterance;
  let resutlJson;
  if(fromUserMsg.trim().indexOf('추천인코드 등록') != -1 || fromUserMsg.trim().indexOf('추천인코드등록') != -1 ) {
    const complainerDAO = new signalDAO('complainer');
    const existUser = await complainerDAO.checkExistUser(userId);
    if(existUser['cnt'] == 0) {
      resutlJson = {
        "version": "2.0",
        "template": {
            "outputs": [
                {
                    "simpleText": {
                        "text": '👩🏻 추천인코드 등록을 위해서 고객님의 간단한 프로필 정보를 등록해주세요.'
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
      resutlJson = {
      "version": "2.0",
      "template": {
          "outputs": [
              {
                  "simpleText": {
                      "text": `📍추천인 코드 등록 방법📍
1. 공유받은 메세지 전체 복사하기
2. 입력창에 공백없이 “추천인코드=코드”
   입력하기
예) 추천인코드=AAA555`
                  }
              }
          ]
      }
    };
  }
  } else if (fromUserMsg.trim().indexOf('추천인코드') != -1){
    const firstIdx = fromUserMsg.trim().indexOf('추천인코드') + 6;
    logger.info(`firt: ${firstIdx}`);
    const  refCode  = fromUserMsg.trim().substring(firstIdx,firstIdx+5);
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
        await sendSlackWebHook(`📍 추천인코드 등록 : ${refCode}`, 'complain');
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
                      "text": '👩🏻 불편을 제보하시기 전, 고객님의 간단한 프로필 정보를 등록해주세요.'
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


// 인기 키워드 확인하기 
router.post('/kakaoChat/mostKeyWords', async (ctx, next) => {
  logger.info('mostKeyWords');
  let resutlJson;

  resutlJson = {
    "version": "2.0",
    "template": {
        "outputs": [
            {
                "simpleText": {
                    "text": '👦🏻 무슨 불편을 접수해야 할지 모르시겠나요 ?\n아래 키워드를 눌러 실제 접수된 불편내용을 확인해보세요!'
                }
            }
        ],
        "quickReplies": [
          {
            "messageText": "1인가구",
            "action": "message",
            "label": "1인가구"
          },
          {
            "messageText": "중고거래",
            "action": "message",
            "label": "중고거래"
          },
          {
            "messageText": "날씨",
            "action": "message",
            "label": "날씨"
          },
          {
            "messageText": "반려동물",
            "action": "message",
            "label": "반려동물"
          },
          {
            "messageText": "아이디어",
            "action": "message",
            "label": "아이디어"
          }
        ]
    }
  };
  ctx.body = resutlJson;

})


// 추천인 코드  생성
async function generateRefCode() {
  try {
  let CodeGenerator = require('node-code-generator');
  // DB던 어디던 기존의 모든 추천인코드를 일단 한번에 다 가져오고, 그 목록을 code generator에게 넘겨주고 그 generator가 알아서 중복되지 않는 코드를 생성하게 함.
  return new complainUserDAO().get()
  .then(async userSet => {
    // 딱 코드들만 들어가있는 배열이 필요.
    // 예 [ 'ABCDFEF', 'DVCFDSE', … ]
    //let idSet: any = userSet.map(c => c.kako_id);
    //logger.info(`userdata: ${userSet}`);
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
}catch(err) {
    logger.info(err);
  }
}

// 접수된 불편 내역 중 DB insert 오류 발생시키는 특수문자 제외 Change quote(') to double quote(")
async function filterUserMsg(userMsg) {
  let filteredMsg = userMsg;
  if(filteredMsg.trim().indexOf(`'`) != -1) {
    filteredMsg = userMsg.replace(/[']/g, `"`);
  }
  return filteredMsg;
}


async function writeLog(event_type) {
  let today = moment().format('YYYY-MM-DD');
  const complainLogDAO = new logDAO();
  let cnt = await complainLogDAO.getTodayComplainlog(today);
  if(cnt[0]['cnt'] == 0) {
    await complainLogDAO.insertNewData(today);
  }
  if(event_type == 'income') {
    await complainLogDAO.updateReqIncome(today);
  } else if(event_type == 'complain') {
    await complainLogDAO.updateRegComplain(today);
  } else if(event_type == 'refCode') {
    await complainLogDAO.updateRegRefCode(today);
  }
}
// 중요: cors는 /api에만 적용될거라 index router 뒤에 와야 한다.
router.use('/overview', overviewRouter.routes());
router.use('/function', functionRouter.routes());
router.use('/descripiton', descriptionRouter.routes());
router.use('/alarmFunction', alarmFunction.routes());
router.use('/kakaoChat/alarm', alarmRouter.routes());
router.use('/kakaoChat/alba', albaRouter.routes());

export default router;