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

import { config } from 'winston';

import {  sendAllSellMsg} from '../module/condition';

// dao
import singnalDAO from '../dao/signalDAO';
import userDAO from '../dao/complainUserDAO';

const router: Router = new Router();

router.get('/sendmsg', async (ctx, next) => {
  const forum = 'test'
  return ctx.render('sendmsg', {forum});
})
 
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


export default router;