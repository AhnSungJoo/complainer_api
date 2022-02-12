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
export default router;   