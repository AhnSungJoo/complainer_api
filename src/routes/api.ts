'use strict';

import * as Router from 'koa-router';
import * as moment from 'moment';
import * as settingConfig from 'config';
// import * as emoji from 'telegram-emoji-map';

import logger from '../util/logger';
import apiRouter from './api';
import funcRouter from './function';
import overviewRouter from './overview';

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

// POST Data 받기 
router.post('/signal', async (ctx, next) => {  
  logger.info('Signal Process Start');
  logger.info('Client IP: ' + ctx.ip);
  logger.info('Request Data: ', ctx.request.body.data);

  let reqData = ctx.request.body.data;
  const mode = reqData['mode'];
  const params = settingConfig.get('params');
  const rangeTime = settingConfig.get('range_time_days');

  // let curTime = moment().format(); // api call 받은 시간을 DB에 저장 
  const signDAO = new singnalDAO();

  let values = {};

  // body로 받은 데이터(json)를 각 컬럼명에 맞게 저장 
  for(let index in params) {
    try{
      values[params[index]] = reqData[params[index]];
    } catch(error) {
      logger.warn('[Json Params Error]', error);
    }
  }

  let chekcAlgo = await checkExistAlgo(values['algorithm_id']);

  if (!chekcAlgo) {
    logger.warn('Target algorithm ID가 아닙니다.')
    sendErrorMSG('Target algorithm ID가 아닙니다.');
    return ctx.body = {result: false};
  }

  // values['order_date'] = curTime; // api call 받은 시간을 DB에 저장 

  // 이미 들어간 컬럼 있는지 확인
  // 지금은 중복된 데이터가 있으면 DB, MSG 모둘을 실행하지 않지만
  // 추후엔 기능 변화로 수정될 수 있음 
  const verifyFlag = await checkSameColumn(values);

  if (!verifyFlag) {
    logger.warn('중복된 컬럼입니다.')
    return;
  }

  let lastResult = await signDAO.getSpecificTotalScore(values['symbol']);
  let lastScore, lastOrd;

  if (!lastResult || lastResult.length < 1) {
    lastScore = 0;
    values['ord'] = 0;
  } else {
    lastScore = lastResult[0]['total_score'];
    lastOrd = lastResult[0]['ord'];
    values['ord'] = lastOrd + 1;
  }

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
    logger.warn('valid type 이 -1 혹은 mode가 silent 입니다.');
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


// 메시지 포맷팅 함수
export async function processMsg(values) {
  const namesDAO = new nameDAO();
  // const data = await namesDAO.getReplaceName(values['algorithm_id']); // param: values.algortihm_id
  // const replaceName = data['algorithm_name']
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
  } else {
    logger.warn('target algortihm_id가 아닙니다.');
    return false;
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

// 10000 => 10,000
export function comma(num){
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


// Signal Data가 이미 들어간 컬럼인지 확인 
export async function checkSameColumn(result) {
  const dao = new singnalDAO();
  const data = await dao.checkColumn(result['algorithm_id'], result['order_date'], result['side'], result['symbol'])

  if (data.cnt >= 1)
    return false
  else 
    return true
}


// 메시지를 일정 시간 지연해서 보내줌 
export async function delayedTelegramMsgTransporter(result:Array<any>, index:number) {
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

async function checkExistAlgo(algorithmId) {
  let cnt = 0;
  const namesDAO = new nameDAO();
  const algoList = await namesDAO.getAllNameList();

  for (let index in algoList) {
    if(algoList[index]['algorithm_id'] === algorithmId) cnt += 1;
  }

  if (cnt === 0) {
    return false;
  }
  return true;
}

export default router;
