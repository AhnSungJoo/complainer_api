'use strict';

import * as Router from 'koa-router'
import * as moment from 'moment'

import logger from '../util/logger'

import singnalDAO from '../dao/signalDAO';

// const real_dao = new realDAO();

export async function upsertData(values, talbeType) {
  const signDAO = new singnalDAO(talbeType);
  const result = await signDAO.upsertSignalData(values);
}


