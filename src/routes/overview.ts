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
import { processMsg, delayedTelegramMsgTransporter} from './api';

import { config } from 'winston';

// dao
import singnalDAO from '../dao/signalDAO';
import nameDAO from '../dao/nameDAO';
import flagDAO from '../dao/flagDAO';
import { start } from 'repl';

const db_modules = [upsertData]
const msg_modules = [sendExternalMSG]  // 텔레그램 알림 모음 (내부 / 외부)
const router: Router = new Router();

router.get('/history', async (ctx, next) => {
  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;

  const signalDAO = new singnalDAO('real');
  const signalResult = await signalDAO.getAllSignalData();

  const paging = await getPaging(curPage, signalResult.length);
  const pageSignalResult = await signalDAO.getSpecifitSignalData(paging.no, paging.page_size);
  const tableType = 'real';
  const forum = 'overview'
  
  return ctx.render('history', {pageSignalResult, paging, forum, tableType, moment});
})

router.get('/alphahistory', async (ctx, next) => {
  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;

  const signalDAO = new singnalDAO('alpha');
  const signalResult = await signalDAO.getAllSignalData();

  const paging = await getPaging(curPage, signalResult.length);
  const pageSignalResult = await signalDAO.getSpecifitSignalData(paging.no, paging.page_size);
  const forum = 'overview'
  const tableType = 'alpha';

  return ctx.render('alphahistory', {pageSignalResult, paging, forum, tableType, moment});
})

router.get('/name', async (ctx, next) => {
  const forum = 'overview'
  const dao = new nameDAO();
  const nameList = await dao.getAllNameList();

  return ctx.render('name', {nameList, forum});
})

router.post('/telegramflag', async (ctx, next) => {
  const reqData = ctx.request.body.data;
  console.log(reqData);
  const tg = reqData['tg'];
  const flag = new flagDAO();
  const data = await flag.changeFlag(reqData['flag'], tg);
  return ctx.redirect('/');
})

router.post('/lastflag', async (ctx, next) => {
  const reqData = ctx.request.body.data;
  console.log(reqData);
  const flag = new flagDAO();
  const data = await flag.changeFlag(reqData['flag'], 'last');
  return ctx.redirect('/');
})

router.post('/symbolflag', async (ctx, next) => {
  const reqData = ctx.request.body.data;
  let symbol = reqData['symbol']
  symbol = symbol.replace('/', '_');
  console.log(symbol);
  const flag = new flagDAO();
  const data = await flag.changeSymbolFlag(reqData['flag'], symbol);
  return ctx.redirect('/');
})


router.post('/name/replace', async (ctx, next) => {
  const originName = ctx.request.body.originName;
  const replaceName = ctx.request.body.replaceName;
  if (!originName || ! replaceName) return ctx.redirect('/name');

  const dao = new nameDAO();
  const result = await dao.updateReplaceName(originName, replaceName);
  return ctx.redirect('/name');        
})

router.post('/send/real/specificSignal', async (ctx, next) => {
  logger.info('특정 컬럼 메시지 발송');
  const reqData = ctx.request.body.data;
  let result = reqData.split(','); // ['1', 'BTC/KRW']
  await sendSpecificSignal(result, 'real');
  return ctx.redirect('/overview/history');
})

router.post('/send/alpha/specificSignal', async (ctx, next) => {
  logger.info('특정 컬럼 메시지 발송');
  const reqData = ctx.request.body.data;
  let result = reqData.split(','); // ['1', 'BTC/KRW']
  await sendSpecificSignal(result, 'alpha');
  return ctx.redirect('/overview/alphahistory');
})

async function sendSpecificSignal(result, tableType) {
  const signalDAO = new singnalDAO(tableType);
  const signalResult = await signalDAO.getSpecificSignalColumn(result[0], result[1]);
  let values = signalResult[0];

  values['send_date'] = moment().format('YYYY-MM-DD HH:mm:ss');
  values['order_date'] = moment(values['order_date']).format('YYYY.MM.DD HH:mm:ss');

  let msg;
  try {
    msg = await processMsg(values, tableType);  // 메시지 문구 만들기 
  } catch(error) {
    logger.warn('[SendSpecificColumn] Msg Formating Error');
  }

  if (!msg) {
    return
  }

  for (let index in msg_modules) {
    try{
      msg_modules[index](msg, tableType);
      db_modules[index](values, tableType);
    } catch(error) {
      logger.warn('[MSG Transporters Error]', error);
    }
  }
}
export default router;   