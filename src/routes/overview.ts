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
import userDAO from '../dao/complainUserDAO';
import nameDAO from '../dao/nameDAO';
import flagDAO from '../dao/flagDAO';
import { start } from 'repl';
import signalDAO from '../dao/signalDAO';

const db_modules = [upsertData]
const msg_modules = [sendExternalMSG]  // 텔레그램 알림 모음 (내부 / 외부)
const router: Router = new Router();

router.get('/complain', async (ctx, next) => {
  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;

  const complainDAO = new singnalDAO('complainer');
  const userResult = await complainDAO.getAllComplainData();

  const paging = await getPaging(curPage, userResult.length);
  const pageSignalResult = await complainDAO.getSpecificComplainData(paging.no, paging.page_size);
  const tableType = 'real';
  const forum = 'overview'
  console.log(pageSignalResult);
  return ctx.render('complain', {pageSignalResult, paging, forum, tableType, moment});
})

router.get('/complainer', async (ctx, next) => {
  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;

  const complainerDAO = new userDAO();
  const userResult = await complainerDAO.getAllComplainerData();
  console.log(userResult);
  const paging = await getPaging(curPage, userResult.length);
  const pageSignalResult = await complainerDAO.getSpecificUserAllData(paging.no, paging.page_size);
  const tableType = 'real';
  const forum = 'overview'
  console.log(pageSignalResult);
  return ctx.render('complainer', {pageSignalResult, paging, forum, tableType, moment});
})


router.get('/outcome', async (ctx, next) => {
  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;

  const complainerDAO = new userDAO();
  const userResult = await complainerDAO.getIncomingUser();

  const paging = await getPaging(curPage, userResult.length);
  const pageSignalResult = await complainerDAO.getSpecificUserData(paging.no, paging.page_size);
  const tableType = 'real';
  const forum = 'overview'
  console.log(pageSignalResult);
  return ctx.render('outcome', {pageSignalResult, paging, forum, tableType, moment});
})


export default router;   