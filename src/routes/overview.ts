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

router.get('/history', async (ctx, next) => {
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
  if (!originName || ! replaceName) return ctx.redirect('/name');

  const dao = new nameDAO();
  const result = await dao.updateReplaceName(originName, replaceName);
  return ctx.redirect('/name');
})

export default router;