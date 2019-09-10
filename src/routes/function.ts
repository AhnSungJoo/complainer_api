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

import { processMsg, delayedTelegramMsgTransporter } from './api';

// dao
import singnalDAO from '../dao/signalDAO';
import nameDAO from '../dao/nameDAO';
import { start } from 'repl';

const db_modules = [upsertData]
const msg_modules = [sendExternalMSG]  // 텔레그램 알림 모음 (내부 / 외부)
const router: Router = new Router();

router.get('/sendmsg', async (ctx, next) => {
  const forum = 'test'
  return ctx.render('sendmsg', {forum});
})

router.get('/test', async (ctx, next) => {
  const forum = 'test'
  return ctx.render('test', {forum});
})

router.post('/rangeSend', async (ctx, next) => {  
  const startDate = ctx.request.body.startDate;
  const endDate = ctx.request.body.endDate;
  const dao = new singnalDAO()
  const result:Array<any> = await dao.getDateSignalData(startDate, endDate);
  delayedTelegramMsgTransporter(result, 0)
  return ctx.body = {result: true};
});

export default router;