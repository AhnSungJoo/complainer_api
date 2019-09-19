'use strict';

import * as Router from 'koa-router';
import * as moment from 'moment';
import * as settingConfig from 'config';
// import * as emoji from 'telegram-emoji-map';

import logger from '../util/logger';
import apiRouter from './api';
import {sendInternalMSG, sendInternalErrorMSG} from '../module/internalMSG';
import {sendExternalMSG} from '../module/externalMSG';
import {sendErrorMSG} from '../module/errorMSG';

import {upsertData} from '../module/insertDB';
import {getPaging} from '../util/paging';

import { config } from 'winston';

import { processMsg, delayedTelegramMsgTransporter, checkConditions} from './api';

// dao
import singnalDAO from '../dao/signalDAO';
import flagDAO from '../dao/flagDAO';
import nameDAO from '../dao/nameDAO';
import { start } from 'repl';

// condition
import {checkExistAlgo, checkSameColumn, checkTotalScore, checkLast2min, checkTelegramFlag, checkSameTrading, checkSymbolFlag, checkSendDateIsNull} from '../module/condition';

const db_modules = [upsertData]
const msg_modules = [sendInternalMSG]  // 텔레그램 알림 모음 (내부 / 외부) => Test 용 
const router: Router = new Router();

router.get('/sendmsg', async (ctx, next) => {
  const forum = 'test'
  return ctx.render('sendmsg', {forum});
})

router.get('/test', async (ctx, next) => {
  const forum = 'test'
  return ctx.render('test', {forum});
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
    sendErrorMSG('전략 ID가 참고하고 있는 ID가 아닙니다. req_data: ' + JSON.stringify(reqData), values['symbol']);
    return ctx.bodx = {result: false};
  }
  
  tableType = senderInfo[senderIdType]['table-type'];

  for (let idx = 0; idx < tableType.length; idx++) {
    console.log('test------------------')
    await checkConditions(values, reqData, tableType[idx], 'test');
  }

  logger.info('Signal Process End');
  return ctx.body = {result: true};
});

router.post('/rangeSend', async (ctx, next) => {  
  const startDate = ctx.request.body.startDate;
  const endDate = ctx.request.body.endDate;
  const dao = new singnalDAO('real')
  const result:Array<any> = await dao.getDateSignalData(startDate, endDate);
  delayedTelegramMsgTransporter(result, 0)
  return ctx.body = {result: true};
});

export default router;