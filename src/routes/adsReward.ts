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

const router: Router = new Router();
// 기본정보입력 - 나이
router.post('/inputAge', async (ctx, next) => {
    logger.info('inputInfo AGe');
    const userId = ctx.request.body.userRequest.user.id;
    let fromUserMsg = ctx.request.body.userRequest.utterance;;
    let toUserMsg = ``;
    const adsRewardDAO = new adsDAO();
    const existUser = await adsRewardDAO.checkExistUser(userId);
    logger.info(`userid: ${userId}`);
    let resutlJson;
    if(fromUserMsg.trim().indexOf('프로필 등록') != -1) {
        resutlJson = {
            "version": "2.0",
            "template": {
                "outputs": [
                    {
                        "simpleText": {
                            "text": '연령대를 선택해주세요. (등록 1/5)'
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
        } else if (fromUserMsg.trim().indexOf('대') != -1) {
            let age = fromUserMsg.substring(0,2);
            logger.info(`age right? ${age}`);
            if(existUser['cnt'] == 0) {
                await adsRewardDAO.insertRewardUserAge(userId, age);
            } else {
                await adsRewardDAO.updateRewardUserAge(userId, age);
            }
            logger.info('why not wokring?');
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
                        "text": '성별을 선택해주세요. (등록 2/5)'
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
                        "text": '직업을 선택해주세요. (등록 3/5)'
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
                        "text": '직업을 선택해주세요. (등록 3/5)'
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
      let userMsg = `원하는 키워드를 입력해주세요. (등록 4/5)
1. 패션
2. 화장품
3. 디지털/가전
4. 가구
5. 출산/육아
6. 식품
7. 스포츠
8. 생활/건강
9. 여가
정보를 제공받기를 원하시는 번호들을 입력해주세요.
예시) 패션, 화장품 선택시 구분자 ,를 넣어 "1,2"를 입력 `
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
          } else {
            await adsRewardDAO.updateRewardUserkeywords(userId, fromUserMsg);
          }
          let userMsg = `정보 메시지 발송을 위해 휴대폰번호를 입력해주세요.`;
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
    if(fromUserMsg.trim().indexOf('01') != -1) {
        // 키워드 입력
        if(existUser['cnt'] == 0) {
            await adsRewardDAO.insertRewardUserTelno(userId, fromUserMsg);
          } else {
            await adsRewardDAO.updateRewardUserTelno(userId, fromUserMsg);
          }
          let userMsg = `✔️ 프로필 정보 등록 완료!
등록하신 키워드 기반의 정보성 광고를 보내드립니다.
본인이 원하는 정보를 확인하고 리워드도 받아가세요!`;
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
  
export default router;