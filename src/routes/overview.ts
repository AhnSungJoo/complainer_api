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
import * as koaIpFilter from 'koa-ip-filter'

// dao
import singnalDAO from '../dao/signalDAO';
import userDAO from '../dao/complainUserDAO';
import kookminDAO from '../dao/kookminAlarmDAO';

// condition
import {ipAllowedCheck} from '../module/condition';
import complainUserDAO from '../dao/kookminUserDAO';
import { start } from 'repl';

const db_modules = [upsertData]
const msg_modules = [sendExternalMSG]  // 텔레그램 알림 모음 (내부 / 외부)
const router: Router = new Router();

/*
router.use( async function (ctx, next) {
  const ipFlag = await ipAllowedCheck(ctx);

  if(ipFlag) {
    return next();
  }
  else {
    logger.info(`not allowed user access ip: ${ctx.ip}`);
    return ctx.render('error', {message: "Not Allowed User"});
  }
})
*/
router.get('/complain', async (ctx, next) => {
  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;

  const complainDAO = new singnalDAO('complainer');
  const userResult = await complainDAO.getAllComplainData();

  const paging = await getPaging(curPage, userResult.length);
  const pageSignalResult = await complainDAO.getSpecificComplainData(paging.no, paging.page_size);
  const tableType = 'real';
  const forum = 'overview'
  const pageType = 'normal';
  // console.log(pageSignalResult);
  return ctx.render('complain', {pageSignalResult, paging, forum, tableType, moment, pageType});
})

router.get('/complainer', async (ctx, next) => {
  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;

  const complainerDAO = new userDAO();
  const userResult = await complainerDAO.getAllComplainerUser();

  const paging = await getPaging(curPage, userResult.length);
  const pageSignalResult = await complainerDAO.getSpecificUserAllData(paging.no, paging.page_size);
  const tableType = 'real';
  const forum = 'overview';
  const pageType = 'normal';

  return ctx.render('complainer', {pageSignalResult, paging, forum, tableType, moment, pageType});
})

router.get('/complainerSearch', async (ctx, next) => {
  const userId = ctx.request.body.userId || ctx.request.query.userId;
  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;
  const complainDAO = new singnalDAO('complainer');
  const userResult = await complainDAO.getSpecipcComplainerData(userId);

  const paging = await getPaging(curPage, userResult.length);
  const pageSignalResult = await complainDAO.getSpecificUserAllDataSearch(paging.no, paging.page_size, userId);
  const tableType = 'real';
  const forum = 'overview'
  const pageType = 'search';

  return ctx.render('complain', {pageSignalResult, paging, forum, tableType, moment, pageType, userId});
})

router.get('/complainUserSearchUsingRefCode', async (ctx, next) => {
  const refCode = ctx.request.body.refCode || ctx.request.query.refCode;
  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;
  const complainDAO = new userDAO();
  const userResult = await complainDAO.getSpecipcComplainerDataUsingRefCode(refCode);

  const paging = await getPaging(curPage, userResult.length);
  const pageSignalResult = await complainDAO.getSpecificUserAllDataSearchUsingRefCode(paging.no, paging.page_size, refCode);
  const tableType = 'real';
  const forum = 'overview'
  const pageType = 'search';

  return ctx.render('complain', {pageSignalResult, paging, forum, tableType, moment, pageType, refCode});
})

router.get('/specificComplainerSearch', async (ctx, next) => {
  let curPage = ctx.request.query.page;
  let age = ctx.request.query.age;
  let sex = ctx.request.query.sex;
  let job = ctx.request.query.job;
  let startDate = ctx.request.query.startDate;
  let endDate = ctx.request.query.endDate;

  let whereQuery = `WHERE`;
  let queryCnt = 0;
  if (!curPage) curPage = 1;
  if(age != -1) {
    if(age == 40) {
      whereQuery += ` B.age>='${age}'`;  
    } else {
      whereQuery += ` B.age='${age}'`;
    }
    queryCnt++;
  }
  if(sex != -1) {
    if(queryCnt == 0) {
      whereQuery += ` B.sex='${sex}'`;
    } else {
      whereQuery += ` and B.sex='${sex}'`;
    }
    queryCnt++;
  }
  if(job != -1) {
    if(queryCnt == 0) {
      whereQuery += ` B.job='${job}'`;
    } else {
      whereQuery += ` and B.job='${job}'`;
    }
    queryCnt++;
  }
  if(startDate) {
    if(queryCnt == 0) {
      whereQuery += ` A.complain_date>='${startDate}'`;
    } else {
      whereQuery += ` and A.complain_date>='${startDate}'`;
    }
    queryCnt++;
  }
  if(endDate) {
    if(queryCnt == 0) {
      whereQuery += ` A.complain_date<='${endDate}'`;
    } else {
      whereQuery += ` and A.complain_date<='${endDate}'`;
    }
    queryCnt++;
  }
  if(queryCnt == 0) {
    whereQuery = '';
  }
  const complainDAO = new singnalDAO('complainer');
  const userResult = await complainDAO.getSpecipcAllComplaineData(whereQuery);
  let cnt = userResult.length;

  const paging = await getPaging(curPage, userResult.length);
  const pageSignalResult = await complainDAO.getSpecipcAllComplaineDataUsePaging(whereQuery, paging.no, paging.page_size);
  const tableType = 'real';
  const forum = 'overview'
  const pageType = 'specific';

  return ctx.render('complain', {pageSignalResult, paging, forum, tableType, moment, pageType, age, sex, job, startDate, endDate, cnt});
})

router.get('/complainUserSearch', async (ctx, next) => {
  const userId = ctx.request.body.userId || ctx.request.query.userId;
  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;
  const complainDAO = new userDAO();
  const userResult = await complainDAO.getSpecificUseData(userId);

  const paging = await getPaging(curPage, userResult.length);
  const pageSignalResult = userResult;
  const tableType = 'real';
  const forum = 'overview'
  const pageType = 'search';

  return ctx.render('complainer', {pageSignalResult, paging, forum, tableType, moment, pageType, userId});
})

router.get('/specificComplainUserSearch', async (ctx, next) => {
  let userId = '';
  let curPage = ctx.request.query.page;
  let age = ctx.request.query.age;
  let sex = ctx.request.query.sex;
  let job = ctx.request.query.job;
  let startDate = ctx.request.query.startDate;
  let endDate = ctx.request.query.endDate;

  let whereQuery = `WHERE`;
  let queryCnt = 0;
  if (!curPage) curPage = 1;
  if(age != -1) {
    if(age == 40) {
      whereQuery += ` A.age>='${age}'`;  
    } else {
      whereQuery += ` A.age='${age}'`;
    }
    queryCnt++;
  }
  if(sex != -1) {
    if(queryCnt == 0) {
      whereQuery += ` A.sex='${sex}'`;
    } else {
      whereQuery += ` and A.sex='${sex}'`;
    }
    queryCnt++;
  }
  if(job != -1) {
    if(queryCnt == 0) {
      whereQuery += ` A.job='${job}'`;
    } else {
      whereQuery += ` and A.job='${job}'`;
    }
    queryCnt++;
  }
  if(startDate) {
    if(queryCnt == 0) {
      whereQuery += ` A.join_date>='${startDate}'`;
    } else {
      whereQuery += ` and A.join_date>='${startDate}'`;
    }
    queryCnt++;
  }
  if(endDate) {
    if(queryCnt == 0) {
      whereQuery += ` A.join_date<='${endDate}'`;
    } else {
      whereQuery += ` and A.join_date<='${endDate}'`;
    }
    queryCnt++;
  }
  if(queryCnt == 0) {
    whereQuery = '';
  }
  const complainerDAO = new userDAO();
  const userResult = await complainerDAO.getAllComplainerUserUseWhereClause(whereQuery);

  const paging = await getPaging(curPage, userResult.length);
  const pageSignalResult = await complainerDAO.getSpecificUserAllDataUseWhere(paging.no, paging.page_size, whereQuery);
  const tableType = 'real';
  const forum = 'overview';
  const pageType = 'specific';

  return ctx.render('complainer', {pageSignalResult, paging, forum, tableType, moment,  age, sex, job, startDate, endDate, pageType});
})

router.get('/contextSearch', async (ctx, next) => {
  const keywords = ctx.request.body.keywords || ctx.request.query.keywords;
  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;
  const complainDAO = new singnalDAO('complainer');
  const keywordsResult = await complainDAO.getSpecipcKeywordsData(keywords);

  const paging = await getPaging(curPage, keywordsResult.length);
  const pageSignalResult = await complainDAO.getSpecificKeywordsAllDataSearch(paging.no, paging.page_size, keywords);
  const tableType = 'real';
  const forum = 'overview'
  const pageType = 'keywords';

  return ctx.render('complain', {pageSignalResult, paging, forum, tableType, moment, pageType, keywords});
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
  // console.log(pageSignalResult);
  return ctx.render('outcome', {pageSignalResult, paging, forum, tableType, moment});
})

router.get('/kookminAlarm', async (ctx, next) => {
  let curPage = ctx.request.query.page;
  if (!curPage) curPage = 1;

  const kookDAO = new kookminDAO();
  const userResult = await kookDAO.getAllKookminAlarmDataDate();

  const paging = await getPaging(curPage, userResult.length);
  const pageSignalResult = await kookDAO.getSpecificKookminAlarmData(paging.no, paging.page_size);
  const tableType = 'real';
  const forum = 'overview'
  const pageType = 'normal';

  return ctx.render('kookminAlarm', {pageSignalResult, paging, forum, tableType, moment, pageType});
})

export default router;   