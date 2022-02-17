'use strict';

import * as Router from 'koa-router'
import * as moment from 'moment'

import logger from '../util/logger'

import signalDAO from '../dao/signalDAO';

// const real_dao = new realDAO();

export async function upsertData(values, talbeType) {
  const comDAO = new signalDAO(talbeType);
  const result = await comDAO.upsertSignalData(values);
}


