import * as DBHelper from '../helpers/DBHelper';
import MySqlDAO from './mysql_dao';

import logger from '../util/Logger';
export default class c extends MySqlDAO {
  constructor() {
    const TARGET_DB: string = 'dev-mysql';
    const TARGET_TABLE: string = 'flag_set';
    super(TARGET_DB, TARGET_TABLE);
  }
  changeFlag(flag, flagType) {
    let column = 'tg_flag'
    if (flagType === 'last') {
      column = 'last_2_min'
    }
    let query = `UPDATE ${this.table} SET ${column} = '${flag}' where id = 1`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getFlag(flagType) {
    let column = 'tg_flag'
    if (flagType === 'last') {
      column = 'last_2_min'
    }
    let query = `SELECT ${column} as flag FROM ${this.table} where id = 1`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getAllFlag() {
    let query = `SELECT * FROM ${this.table} where id = 1`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
}    