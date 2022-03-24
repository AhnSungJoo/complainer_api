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

router.get('/test', async (ctx, next) => {
  const forum = 'test'
  return ctx.render('test', {forum});
})

router.get('/updateData', async (ctx, next) => {
  const forum = 'update'
  return ctx.render('updateData', {forum});
})

// POST TEST 
router.post('/signal/test', async (ctx, next) => {  
  logger.info('[TEST]Signal test Start');
  logger.info('Client IP: ' + ctx.ip);
  logger.info('Request Data: ', ctx.request.body.data);

  let reqData = ctx.request.body.data;
  const params = settingConfig.get('params');
  const senderId = reqData['sender_id'];

  let values = {};

  // body로 받은 데이터(json)를 각 컬럼명에 맞게 저장 
  for(let index in params) {
    try{
      values[params[index]] = reqData[params[index]];
    } catch(error) {
      logger.warn('[Json Params Error]', error);
    }
  }

  // 심볼별 table 분리
  const senderSet = settingConfig.get('sender-id-set');
  const senderInfo = settingConfig.get('sender-id-info');
  let tableType;
  let senderIdType = 'none';

  for (let key in senderSet) {
    if (senderSet[key].includes(senderId)) {
      senderIdType = key; // multy, real, alpha
    }
  }

  if(senderIdType === 'none') {
    logger.warn('전략 ID가 참고하고 있는 ID가 아닙니다. req_data: ' + JSON.stringify(reqData));
    sendErrorMSG('전략 ID가 참고하고 있는 ID가 아닙니다. req_data: ' + JSON.stringify(reqData), 'none');
    return ctx.bodx = {result: false};
  }
  
  tableType = senderInfo[senderIdType]['table-type'];

  for (let idx = 0; idx < tableType.length; idx++) {
    console.log('test------------------')
  }

  logger.info('Signal Process End');
  return ctx.body = {result: true};
});

// update
router.post('/update', async (ctx, next) => {
  logger.info('Update Data Start!'); 
  const tableType = ctx.request.query.table; 
  const startDate = ctx.request.body.startDate;
  const endDate = ctx.request.body.endDate;
  const symbol = ctx.request.body.symbol;

  await updateData(tableType, startDate, endDate, symbol);
  return ctx.body = {result: true};
});

// 일정 범위 메시지 보내기
router.post('/rangeSend', async (ctx, next) => {  
  const startDate = ctx.request.body.startDate;
  const endDate = ctx.request.body.endDate;
  const dao = new singnalDAO('real')
  const result:Array<any> = await dao.getDateSignalData(startDate, endDate);

  return ctx.body = {result: true};
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

async function updateData(tableType, startDate, endDate, symbol) {
  logger.info('table type: ', tableType, ' start: ', startDate, ' end: ', endDate, ' symbol: ', symbol);
  const dao = new singnalDAO(tableType);
  const dataSet = await dao.getDataUseUpdate(startDate, endDate, symbol);
  let total_score, ord_cnt = 0, idx = 0;
  let buyList = [];

  for(let tempData of dataSet) {
    logger.info(idx + ' 번째 data : ' , tempData);
    let side = tempData['side']
    let totalScore = tempData['total_score'];
    let algorithmId = tempData['algorithm_id'];
    const orderDate= moment(tempData['order_date']).format('YYYY-MM-DD HH:mm:ss');

    if (idx === 0) {
      logger.info('첫 번째 data');
      total_score = totalScore;
      buyList.splice(1,0,algorithmId);
    }
    else {
      if (side === 'BUY')  {
        total_score += 1;
        buyList.splice(1,0,algorithmId);
      } else if (side === 'SELL') {
        total_score -= 1;
        const tidx = buyList.indexOf(algorithmId);
        buyList.splice(tidx, 1);
      }
    }

    await dao.updateDataOrdTotalScoreBuyList(total_score, ord_cnt, buyList.toString(), orderDate, side, algorithmId);
    ord_cnt += 1;
    idx += 1;
  }
}

export default router;