'use strict';

import { EventEmitter } from 'events';
import * as Router from 'koa-router';
import * as cors from 'koa2-cors';

import * as moment from 'moment';

import logger from '../util/logger';

import Util from '../util/Util';

const router: Router = new Router();

router.use(cors())

router.get('/', (ctx, next) => {
  ctx.body = 'api';
})

export default router;
