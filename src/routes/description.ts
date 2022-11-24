'use strict';

import * as Router from 'koa-router';
import * as moment from 'moment';
import * as settingConfig from 'config';
import * as cron from 'node-cron';
// import * as emoji from 'telegram-emoji-map';

import logger from '../util/logger';
import {sendInternalMSG, sendInternalErrorMSG} from '../module/internalMSG';
import {sendExternalMSG} from '../module/externalMSG';
import {sendErrorMSG} from '../module/errorMSG';

import {upsertData} from '../module/insertDB';
import {getPaging} from '../util/paging';

import { config } from 'winston'

// dao
import singnalDAO from '../dao/signalDAO';
import userDAO from '../dao/complainUserDAO';
import logDAO from '../dao/complainLogDAO';

// condition
import {ipAllowedCheck} from '../module/condition';
import {sendSlackWebHook} from '../util/slackbot';
import {sendKaKaoEventAPI} from '../util/kakaobot';
import complainUserDAO from '../dao/albaReviewDAO';
import signalDAO from '../dao/signalDAO';

const router: Router = new Router();

router.get('/incomeManual', async (ctx, next) => {
  const forum = 'manual'
  return ctx.render('incomeManual', {forum});
})

export default router;