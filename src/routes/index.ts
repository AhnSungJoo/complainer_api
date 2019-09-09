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

// dao
import singnalDAO from '../dao/signalDAO';
import nameDAO from '../dao/nameDAO';
import { start } from 'repl';

const db_modules = [upsertData]
const msg_modules = [sendExternalMSG]  // 텔레그램 알림 모음 (내부 / 외부)
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

// Dashboard
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
  const forum = 'home'
  return ctx.render('index', {totalScoreSet, keySet, forum});
})


// Overview
router.get('/history', async (ctx, next) => {
  console.log('history here')

  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;

  const signalDAO = new singnalDAO();
  const signalResult = await signalDAO.getAllSignalData();

  const paging = await getPaging(curPage, signalResult.length);
  const pageSignalResult = await signalDAO.getSpecifitSignalData(paging.no, paging.page_size);
  const forum = 'overview'
  return ctx.render('history', {pageSignalResult, paging, forum, moment});
})

router.get('/name', async (ctx, next) => {
  const forum = 'overview'
  const dao = new nameDAO();
  const nameList = await dao.getAllNameList();

  return ctx.render('name', {nameList, forum});
})

router.post('/name/replace', async (ctx, next) => {
  const originName = ctx.request.body.originName;
  const replaceName = ctx.request.body.replaceName;
  console.log(ctx.request.body.originName)
  console.log(originName, replaceName);
  if (!originName || ! replaceName) return ctx.redirect('/name');

  const dao = new nameDAO();
  const result = await dao.updateReplaceName(originName, replaceName);
  return ctx.redirect('/name');
})

// Test 
router.get('/test', async (ctx, next) => {
  const forum = 'test'
  return ctx.render('test', {forum});
})

router.get('/backtest', async (ctx, next) => {
  const forum = 'test'
  return ctx.render('backtest', {forum});
})

async function delayedTelegramMsgTransporter(result:Array<any>, index:number) {
  if (result.length === index) return 
  let msg = await processMsg(result[index]);  // 메시지 문구 만들기 

  for (let idx in msg_modules) {
    try{
      msg_modules[idx](msg);
    } catch(error) {
      logger.warn('[MSG Transporters Error]', error);
    }
  }

  setTimeout(()=>{
    delayedTelegramMsgTransporter(result, index + 1);
  }, 5000)
}

// 
router.post('/rangeSend', async (ctx, next) => {  
  const startDate = ctx.request.body.startDate;
  const endDate = ctx.request.body.endDate;
  const dao = new singnalDAO()
  const result:Array<any> = await dao.getDateSignalData(startDate, endDate);
  delayedTelegramMsgTransporter(result, 0)
  return ctx.body = {result: true};
});
// POST Data 받기 
router.post('/api/signal', async (ctx, next) => {  
  logger.info('Signal Process Start');
  logger.info('Request Data: ', ctx.request.body.data);
  let reqData = ctx.request.body.data;
  const mode = reqData['mode'];
  const params = settingConfig.get('params');
  const rangeTime = settingConfig.get('range_time_days');

  // let curTime = moment().format(); // api call 받은 시간을 DB에 저장 
  const signDAO = new singnalDAO();
  const namesDAO = new nameDAO();
  let values = {};
  logger.info('here');
  // body로 받은 데이터(json)를 각 컬럼명에 맞게 저장 
  for(let index in params) {
    try{
      values[params[index]] = reqData[params[index]];
    } catch(error) {
      logger.warn('[Json Params Error]', error);
    }
  }
  // values['order_date'] = curTime; // api call 받은 시간을 DB에 저장 


  let lastResult = await signDAO.getSpecificTotalScore(values['symbol']);
  let lastScore = lastResult[0]['total_score'];
  const lastOrd = lastResult[0]['ord'];
  values['ord'] = lastOrd + 1

  if (!lastScore || lastScore.length < 1) lastScore = 0;
  console.log('last: ', lastScore);

  if (values['side'] === 'BUY') {
    if (lastScore >= 5 && mode != 'silent') {
      logger.warn('total score가 5를 초과합니다.');
      sendErrorMSG('total_Score가 5를 초과했습니다. req_data: ' + JSON.stringify(reqData));
      values['valid_type'] = -1
  }
    values['total_score'] = lastScore + 1;
  } else if (values['side'] === 'SELL' && mode != 'silent') {
    if (lastScore <= 0) {
      logger.warn('total score가  음수가 됩니다.');
      sendErrorMSG('total_score가 음수가 됩니다. req_data: ' + JSON.stringify(reqData));
      values['valid_type'] = -1
    }
    values['total_score'] = lastScore - 1;
  }


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
    return;
  }

  let t1 = moment(values['order_date'], 'YYYY-MM-DD HH:mm:ss');
  let t2 = moment();

  let diffDays = moment.duration(t2.diff(t1)).asDays();
  if (diffDays > rangeTime) {
    logger.warn('신호의 날짜가 일정 주기를 넘어섭니다.');
    return;
  }

  // 메시지 관련 모듈 
  let msg = await processMsg(values);  // 메시지 문구 만들기 
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

// 메시지 포맷팅 함수
async function processMsg(values) {
  const namesDAO = new nameDAO();
  const data = await namesDAO.getReplaceName(values['algorithm_id']); // param: values.algortihm_id
  const replaceName = data['algorithm_name']
  let algorithmEmoji, sideEmoji, sideKorean, power;
  let symbol = values['symbol']
  let market = symbol.slice(symbol.indexOf('/') + 1, );
  if (values['algorithm_id'] === 'F03') {
    algorithmEmoji = '🦁';
  } else if (values['algorithm_id'] === 'F07') {
    algorithmEmoji = '🐨';
  } else if (values['algorithm_id'] === 'F08') {
    algorithmEmoji = '🐰';
  } else if (values['algorithm_id'] === 'F11') {
    algorithmEmoji = '🐶';
  } else if (values['algorithm_id'] === 'F12') {
    algorithmEmoji = '🦊';
  }

  if (values['side'] === 'BUY') {
    sideEmoji = '⬆️';
    sideKorean = '매수';
  }
  else if (values['side'] === 'SELL') {
    sideEmoji = '⬇️';
    sideKorean = '매도';
  }

  if (values['total_score'] === 1) {
    power = '🌕🌑🌑🌑🌑'
  } else if (values['total_score'] === 2) {
    power = '🌕🌕🌑🌑🌑'
  } else if (values['total_score'] === 3) {
    power = '🌕🌕🌕🌑🌑'
  } else if (values['total_score'] === 4) {
    power = '🌕🌕🌕🌕🌑'
  } else if (values['total_score'] === 5) {
    power = '🌕🌕🌕🌕🌕'
  } else if (values['total_score'] === 0) {
    power = '🌑🌑🌑🌑🌑'
  }
  let processPrice = comma(Number(values['price']))
  const signalDate = moment(values['order_date']).format('YYYY-MM-DD HH:mm:ss');
  // values['order_date'] = moment(values['order_date'], 'YYYY-MM-DD HH:mm:ss');
  // let msg = `${replaceName} : ${values['side']}`
  let msg = `${algorithmEmoji} 신호 발생 [${signalDate}]
[${values['symbol']}]  <${sideKorean}> ${sideEmoji} 
${processPrice} ${market} 
추세강도 ${power}`;

  return msg
}

function comma(num){
  let len, point, str; 
  num = num + ""; 
  point = num.length % 3 ;
  len = num.length; 
  str = num.substring(0, point); 
  while (point < len) { 
      if (str != "") str += ","; 
      str += num.substring(point, point + 3); 
      point += 3; 
  } 
  return str;
}
