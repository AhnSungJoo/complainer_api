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
  const signalDAO = new singnalDAO('complainer');
  await signalDAO.insertComplainContext();
  return ctx.body = "카카오api 확인";
})

router.get('/kakaoChat/myPoint', async (ctx, next) => {
  const userId = ctx.request.body.userRequest.user.id;
  const goMain = '처음으로';
  logger.info('userid: ', userId);
  logger.info('mypoint');
  const signalDAO = new singnalDAO('complainer');
  await signalDAO.insertComplainContext();
  const data = {
    'version': '2.0',
    'template': {
    'outputs': [{
      'simpleText': {
        'text': '테스트'
      }
    }],
    'quickReplies': [{
      'label': goMain,
      'action': 'message',
      'messageText': goMain
    }]
    }
  }
  ctx.response.json(data);
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

// json test data
/*

{
  "intent": {
    "id": "u8374czixdyo23gkpuw34lat",
    "name": "블록 이름"
  },
  "userRequest": {
    "timezone": "Asia/Seoul",
    "params": {
      "ignoreMe": "true"
    },
    "block": {
      "id": "u8374czixdyo23gkpuw34lat",
      "name": "블록 이름"
    },
    "utterance": "발화 내용",
    "lang": null,
    "user": {
      "id": "687813",
      "type": "accountId",
      "properties": {}
    }
  },
  "bot": {
    "id": "620cea77ca92880f0b4e73c8",
    "name": "봇 이름"
  },
  "action": {
    "name": "krrqubcc0i",
    "clientExtra": null,
    "params": {},
    "id": "vpfi1op5vzjoncdifqzs1p6b",
    "detailParams": {}
  }
}
*/

export default router;
