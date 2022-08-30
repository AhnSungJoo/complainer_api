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

import { config } from 'winston'

// dao
import kookminDAO from '../dao/kookminAlarmDAO';
import kookminUserDAO from '../dao/kookminUserDAO';
// condition
import {ipAllowedCheck} from '../module/condition';

const router: Router = new Router();

// 알림 삭제하기
router.post('/deleteAlarm', async (ctx, next) => {
    const targetNo = ctx.request.body.no; // 변경할 불편사항 접수번호 
    let resutlJson;
    let koominDAO = new kookminDAO();
    let userResult = await koominDAO.deleteAlarmData(targetNo);
  
    return ctx.redirect('/overview/kookminAlarm');
})

// 양식 및 괄호 제거
async function refineMsg(msg) {
  msg = msg.trim();
  if(msg.indexOf('양식:') != -1) {
    msg = msg.replace("양식:", "");
  }
  if(msg.indexOf(',') != -1) {
    msg = msg.replace(/,/gi, "");
  }
  if(msg.indexOf('(') != -1) {
    msg = msg.replace("(", "");
  }
  if(msg.indexOf(')') != -1) {
    msg = msg.replace(")", "");
  }
  if(msg.indexOf('내정보') != -1) {
    msg = msg.replace("내정보", "");
  }
  if(msg.indexOf('상대정보') != -1) {
    msg = msg.replace("상대정보", "");
  }
  if(msg.indexOf('정보등록') != -1) {
    msg = msg.replace("정보등록", "");
  }
  if(msg.indexOf('번호') != -1) {
    msg = msg.replace("번호", "");
  }
  if(msg.indexOf(':') != -1) {
    msg = msg.replace(":", "");
  }

  return msg;
}

export default router;