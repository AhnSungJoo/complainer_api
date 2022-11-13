'use strict';

import * as Router from 'koa-router';
import * as moment from 'moment';
import * as settingConfig from 'config';
import * as cron from 'node-cron';
// import * as emoji from 'telegram-emoji-map';

import logger from '../util/logger';
import {sendInternalMSG, sendInternalErrorMSG} from '../module/internalMSG';
import {sendExternalMSG} from '../module/externalMSG';
import {sendErrorMSG} from '../module/errorMSG';

import {upsertData} from '../module/insertDB';
import {getPaging} from '../util/paging';

import { config } from 'winston'

// dao
import singnalDAO from '../dao/signalDAO';
import userDAO from '../dao/complainUserDAO';
import logDAO from '../dao/complainLogDAO';

// condition
import {ipAllowedCheck} from '../module/condition';
import {sendSlackWebHook} from '../util/slackbot';
import {sendKaKaoEventAPI} from '../util/kakaobot';
import complainUserDAO from '../dao/albaReviewDAO';
import signalDAO from '../dao/signalDAO';

const router: Router = new Router();

router.use( async function (ctx, next) {
  const ipFlag = await ipAllowedCheck(ctx);
  if(ipFlag) {
    return next();
  }
  else {
    logger.info(`not allowed user access ip: ${ctx.ip}`);
    return ctx.render('error', {message: "Not Allowed User"});
  }
})

router.get('/sendmsg', async (ctx, next) => {
  const forum = 'test'
  return ctx.render('sendmsg', {forum});
})


router.get('/sendKakaomsg', async (ctx, next) => {
  const forum = 'test'
  return ctx.render('sendKakaomsg', {forum});
})
 
// 특정 고객 포인트 변경(불편사항 퀄리티에 따라 변경)
router.post('/changePoint', async (ctx, next) => {  
  const targetNo = ctx.request.body.no; // 변경할 불편사항 접수번호 
  const userId = ctx.request.body.kakaoId; // 사용자 id
  const afterPoint = ctx.request.body.pointVal; // 변경할 포인트 
  const beforePoint = ctx.request.body.beforePoint; // 변경전 포인트
  let pointTotal = 0;
  pointTotal = afterPoint - beforePoint;
  let curPoint = 0;
  const complainerDAO = new userDAO();
  const prevPoint = await complainerDAO.getUserPoint(userId);
  const complainDAO = new singnalDAO('complainer');
  await complainDAO.updateComplainPoint(targetNo, userId, afterPoint); // 포인트를 변경할 불편사항 업데이트
  curPoint = prevPoint['point_total'] + pointTotal;
  await complainerDAO.changePointNotIncome(userId, curPoint); // 사용자의 총 포인트 변경

  return ctx.body = {result: true, msg: `포인트가 변경되었습니다. 사용자의 누적포인트: ${prevPoint['point_total']} -> ${curPoint}`};
});

// 특정 고객 포인트 차감(출금신청 후 포인트 차감)
router.post('/minusPoint', async (ctx, next) => {  
  const userId = ctx.request.body.kakaoId;
  const pointVal = ctx.request.body.pointVal;
  logger.info(`point : ${pointVal}`); 
  let curPoint = 0;
  const complainerDAO = new userDAO();
  const prevPoint = await complainerDAO.getUserPoint(userId);
  if(pointVal > prevPoint['point_total']) {
    return ctx.body = {result:false, msg:"차감할 포인트가 사용자의 포인트보다 많습니다."};
  }
  curPoint = prevPoint['point_total'] - pointVal;
  logger.info(`point2 : ${prevPoint}`);
  await complainerDAO.changePoint(userId, curPoint);  
  return ctx.body = {result: true, msg: `${userId}의 포인트가 ${pointVal}만큼 차감되어 현재 포인트는 ${curPoint}입니다. / 출금신청 초기화 완료됐습니다.`};
});

// 특정 고객 포인트 추가(접수된 불편 확인 후 포인트 추가)
router.post('/plusPoint', async (ctx, next) => {  
  const userId = ctx.request.body.kakaoId;
  const pointVal = ctx.request.body.pointVal;
  logger.info(`point : ${pointVal}`); 
  let curPoint = 0;
  const complainerDAO = new userDAO();
  const prevPoint = await complainerDAO.getUserPoint(userId);
  curPoint = Number(prevPoint['point_total']) + Number(pointVal);
  logger.info(`point2 : ${prevPoint}`);
  await complainerDAO.changePoint(userId, curPoint);  
  return ctx.body = {result: true, msg: `${userId}의 포인트가 ${pointVal}만큼 추가되어 현재 포인트는 ${curPoint}입니다. / 출금신청 초기화 완료됐습니다.`};
});


// /overview/outcome.ejs => 출금신청 완료
router.post('/changeflag', async (ctx, next) => {
  const kakaoId = ctx.request.body.kakaoId;
  const complainerDAO = new userDAO();
  const userId  = await complainerDAO.updateIncomeRequest(kakaoId, 0);
  return ctx.redirect('/overview/outcome');
})

router.post('/serachKakaoId', async (ctx, next) => {
  const refCode = ctx.request.body.data;
  const complainerDAO = new userDAO();
  const userId  = await complainerDAO.getUserIdUseRefCode(refCode);
  return ctx.body = {status: 'success', userId};
})

router.post('/sendKakaoMsgComplainer', async (ctx, next) => {

  const userId = ctx.request.body.kakaoId;
  const msg = ctx.request.body.msg;
  await sendKaKaoEventAPI("event_test", userId, msg, "complainer"); 
  return ctx.redirect('/function/sendKakaomsg');
})

router.post('/sendKakaoMsgKookmin', async (ctx, next) => {
  const userId = ctx.request.body.kakaoId;
  let msg = ctx.request.body.msg;

  await sendKaKaoEventAPI("kookmin_event", userId, msg, "kookmin");
  return ctx.redirect('/function/sendKakaomsg');
})

router.post('/devtest', async (ctx, next) => {
  /*
  const testVal = 'is it okay ?'
  await sendKaKaoEventAPI("event_test", "fdc236a66636a5f21bcdf3b4589ac2318b3373528cbdcb5c2362f3cc7a4c3f05c9", "33");
  */
  //await sendSlackWebHook('👩🏻 “프로불편러”에 프로필 정보 등록 완료!','complain');
  let today = moment().format('YYYY-MM-DD');
  const logsDAO = new logDAO();
  const complainDAO = new singnalDAO('complainer');
  const usersDAO = new userDAO();
  const todayLog = await logsDAO.getTodayAllData(today);
  const todayComlains = await complainDAO.getTodayComplain();
  const todayUsers = await usersDAO.getTodayComplain();
  let msg = `오늘의 불편 작성 📝 : ${todayComlains[0]['cnt']}
오늘의 프로필등록 👩🏻: ${todayUsers[0]['cnt']}
오늘 메뉴클릭 수 => 출금신청: ${todayLog[0]['request_income']}, 불편작성: ${todayLog[0]['register_complain']}, 추천인코드 등록: ${todayLog[0]['register_refCode']},`

  return ctx.body = {status: 'success'};
})

// 스케줄 봇 
const job = cron.schedule('55 59 23 * * *', async function() {
  logger.info('job 실행');
  let today = moment().format('YYYY-MM-DD');
  const logsDAO = new logDAO();
  const complainDAO = new singnalDAO('complainer');
  const usersDAO = new userDAO();
  const todayLog = await logsDAO.getTodayAllData(today);
  const todayComlains = await complainDAO.getTodayComplain();
  const todayUsers = await usersDAO.getTodayComplain();
  let msg = `오늘의 불편 작성 📝 : ${todayComlains[0]['cnt']}
오늘의 프로필등록 👩🏻: ${todayUsers[0]['cnt']}
오늘 메뉴클릭 수 => 출금신청: ${todayLog[0]['request_income']}, 불편작성: ${todayLog[0]['register_complain']}, 추천인코드 등록: ${todayLog[0]['register_refCode']},`
  try {
    await sendSlackWebHook(msg, 'complain');
  } catch(err) {
    logger.info(`chat err : ${err}`);
  }
});


export default router;