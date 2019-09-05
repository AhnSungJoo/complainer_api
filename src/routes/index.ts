'use strict';

import * as Router from 'koa-router';
import * as moment from 'moment';
import * as settingConfig from 'config';

import logger from '../util/logger';
import apiRouter from './api';
import {sendInternalMSG} from '../module/internalMSG';
import {sendExternalMSG} from '../module/externalMSG';
import {upsertData} from '../module/insertDB';
import {getPaging} from '../util/paging';

import { config } from 'winston';

// dao
import singnalDAO from '../dao/devDAO';

const db_modules = [upsertData]
const msg_modules = [sendInternalMSG, sendExternalMSG]  // 텔레그램 알림 모음 (내부 / 외부)
const router: Router = new Router();

router.use( async (ctx, next) => {
  try {
    await next()
  } catch(err) {
    console.log(err.status)
    ctx.status = err.status || 500;
    ctx.body = err.message;
  }
})

router.get('/', async (ctx, next) => {
  console.log('index here')

  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;

  const signalDAO = new singnalDAO();
  let symbolList = await signalDAO.getAllSymbol();
  let totalScoreSet = {}
  for (let index in symbolList) {
    totalScoreSet[symbolList[index]['symbol']] = await signalDAO.getSpecificTotalScore(symbolList[index]['symbol'])
  }
  let keySet = Object.keys(totalScoreSet)
  console.log(keySet[0])
  console.log(totalScoreSet['XRP/BTC'][0]['total_score'])
  return ctx.render('index', {totalScoreSet, keySet});
})


router.get('/history', async (ctx, next) => {
  console.log('history here')

  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;

  const signalDAO = new singnalDAO();
  const signalResult = await signalDAO.getAllSignalData();
  
  const paging = await getPaging(curPage, signalResult.length);
  const pageSignalResult = await signalDAO.getSpecifitSignalData(paging.no, paging.page_size);

  return ctx.render('history', {pageSignalResult, paging, moment});
})

router.get('/view', (ctx, next) => {
  return ctx.render('view');
})

router.get('/test', (ctx, next) => {
  return ctx.render('test');
})

router.post('/api/signal', async (ctx, next) => {  
  logger.info('Signal Process Start');
  let reqData = ctx.request.body.data;
  const params = settingConfig.get('params');
  let curTime = moment().format(); // api call 받은 시간을 DB에 저장 
  const signDAO = new singnalDAO();
  let values = {};

  // body로 받은 데이터(json)를 각 컬럼명에 맞게 저장 
  for(let index in params) {
    try{
      values[params[index]] = reqData[index];
    } catch(error) {
      logger.warn('[Json Params Error]', error);
    }
  }
  values['received_date'] = curTime; // api call 받은 시간을 DB에 저장 

  let lastScore: number = await signDAO.getSpecificTotalScore(values['symbol']);
  lastScore = lastScore[0].total_score;

  if (values['side'] === 'buy') values['total_score'] = lastScore + 1;
  else if (values['side'] === 'sell') values['total_score'] = lastScore - 1;

  // DB 관련 모듈
  for (let index in db_modules) {
    try{
      db_modules[index](values);
    } catch(error) {
      logger.warn('[DB Transporters Error]', error);
    }
  }

  // 메시지 관련 모듈 
  let msg = processMsg(values);  // 메시지 문구 만들기 
  for (let index in msg_modules) {
    try{
      msg_modules[index](msg);
    } catch(error) {
      logger.warn('[MSG Transporters Error]', error);
    }
  }

  logger.info('Signal Process End');
  return ctx.redirect('/');
});

router.get('/api/signal', (ctx, next) => {
  return ctx.render('signal');
})

// 중요: cors는 /api에만 적용될거라 index router 뒤에 와야 한다.
router.use('/api', apiRouter.routes());

export default router;

function processMsg(values) {
  let msg = `${values.side} 신호 발생 \n- INFO - \nAlgorithm ID: ${values.algorithm_id}, Symbol: ${values.symbol} \nQty : ${values.qty}, Price: ${values.price}`;
  return msg
}