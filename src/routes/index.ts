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

router.use( async (ctx, next) => {
  try {
    await next()
  } catch(err) {
    console.log(err.status)
    ctx.status = err.status || 500;
    // ctx.body = err.message;
    return ctx.render('error');
  }
})

// Dashboard
router.get('/', async (ctx, next) => {
  logger.info('index here');

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

// 중요: cors는 /api에만 적용될거라 index router 뒤에 와야 한다.
router.use('/api', apiRouter.routes());
router.use('/overview', overviewRouter.routes());
router.use('/function', funcRouter.routes());

export default router;
