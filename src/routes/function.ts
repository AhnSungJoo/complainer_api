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

import { processMsg, delayedTelegramMsgTransporter} from './api';

// dao
import singnalDAO from '../dao/signalDAO';
import flagDAO from '../dao/flagDAO';
import nameDAO from '../dao/nameDAO';
import { start } from 'repl';

// condition
import {checkExistAlgo, checkSameColumn, checkTotalScore, checkLast2min, checkTelegramFlag, checkSameTrading} from '../module/condition';

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
  const mode = reqData['mode'];
  const params = settingConfig.get('params');
  let values = {};

  // body로 받은 데이터(json)를 각 컬럼명에 맞게 저장 
  for(let index in params) {
    try{
      values[params[index]] = reqData[params[index]];
    } catch(error) {
      logger.warn('[Json Params Error]', error);
    }
  }

  logger.info('condition check');
  // 알고리즘 ID 가 target id 인지 확인 
  const checkAlgo = await checkExistAlgo(values['algorithm_id'], reqData); 
  // 이미 들어간 컬럼 있는지 확인
  const verifyFlag = await checkSameColumn(values, reqData);
  // 2분 이내에 발생된 신호인지 확인 => db에 넣지 않고 dev에 에러메시지 발생
  const lastFlag = await checkLast2min(values, reqData);

  // total_score, ord를 업데이트 하고 total_score가 valid한지 확인한다.
  values = await checkTotalScore(values, mode, reqData);
  // 동일 전략 동일 매매 확인 => values['valid_type'] = -1이 됨 
  values = await checkSameTrading(values, reqData);

  if (!lastFlag || !checkAlgo || !verifyFlag) { // 이 3가지 case는 false인 경우 db에도 넣지 않는다.
    logger.warn('조건에 어긋나 DB에 저장하지 않고 종료합니다.')
    sendErrorMSG('조건에 어긋나 DB에 저장하지 않고 종료합니다.');
    return;
  }
  logger.info('DB start');
  // DB 관련 모듈
  for (let index in db_modules) {
    try{
      db_modules[index](values);
    } catch(error) {
      logger.warn('[DB Transporters Error]', error);
    }
  }
  logger.info('db success');

  if (values['valid_type'] === -1 || mode === 'silent' ) { 
    logger.warn('valid type 이 -1 혹은 mode가 silent 입니다.(메시지 발송 X)');
    return;
  }

  // 텔레그램 신호 on / off 확인 
  const tgFlag = await checkTelegramFlag();
  if (!tgFlag) {
    logger.info("텔레그램 메시지 발송 기능이 'Off' 상태입니다.");
    return;
  }

  logger.info('msg start');
  // 메시지 관련 모듈 
  let msg;
  try {
    msg = await processMsg(values);  // 메시지 문구 만들기 
  } catch(error) {
    logger.warn('Msg Formating Error');
  }

  if (!msg) {
    return
  }
  for (let index in msg_modules) {
    try{
      msg_modules[index](msg);
    } catch(error) {
      logger.warn('[MSG Transporters Error]', error);
    }
  }

  logger.info('Signal Process End');
  return ctx.body = {result: true};
});

router.post('/rangeSend', async (ctx, next) => {  
  const startDate = ctx.request.body.startDate;
  const endDate = ctx.request.body.endDate;
  const dao = new singnalDAO()
  const result:Array<any> = await dao.getDateSignalData(startDate, endDate);
  delayedTelegramMsgTransporter(result, 0)
  return ctx.body = {result: true};
});

export default router;