'use strict';

import * as Router from 'koa-router';
import * as moment from 'moment';
import * as settingConfig from 'config';
// import * as emoji from 'telegram-emoji-map';

import logger from '../util/logger';
import overviewRouter from './overview';

import {sendInternalMSG, sendInternalErrorMSG} from '../module/internalMSG';
import {sendExternalMSG} from '../module/externalMSG';
import {sendErrorMSG} from '../module/errorMSG';

import {upsertData} from '../module/insertDB';
import {getPaging} from '../util/paging';

import { config } from 'winston';

// dao
import singnalDAO from '../dao/signalDAO';
import flagDAO from '../dao/flagDAO';
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
    return ctx.render('error', {message: 'Not Found'});
  }
})

// Dashboard
router.get('/', async (ctx, next) => {
  logger.info('index here');

  return ctx.render('index');
})

router.get('/ping', async (ctx, next) => {
  return ctx.body = "OK";
})

router.get('/umji', async (ctx, next) => {
  return ctx.body = "엄지 힘내!";
})

router.get('/kkoChat/v1', async (ctx, next) => {
  return ctx.body = "카카오api 확인";
})

async function getTableInfo(tabelType) {
  const signalDAO = new singnalDAO(tabelType);
  let symbolList = await signalDAO.getAllSymbol(); 
  let totalScoreSet = {}

  for (let index in symbolList) {
    totalScoreSet[symbolList[index]['symbol']] = await signalDAO.getSpecificTotalScore(symbolList[index]['symbol'])
  }
  return totalScoreSet;
}

// 중요: cors는 /api에만 적용될거라 index router 뒤에 와야 한다.
router.use('/overview', overviewRouter.routes());



export default router;
