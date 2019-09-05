'use strict';

import * as Router from 'koa-router'
import * as moment from 'moment'

import logger from '../util/logger'
import apiRouter from '../routes/api'

import realDAO from '../dao/realDAO';
import singnalDAO from '../dao/signalDAO';

// const real_dao = new realDAO();

export async function upsertData(values) {
  const signDAO = new singnalDAO();
  const result = await signDAO.upsertSignalData(values);
}


