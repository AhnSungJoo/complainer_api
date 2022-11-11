import MySqlDAO from './mysql_dao';
import * as DBHelper from '../helpers/DBHelper';
import logger from '../util/logger';
import * as moment from 'moment'

export default class complainUserDAO extends MySqlDAO {
  constructor() {
    super('real-mysql', 'complainer_log'); 
  }

  getAllComplainerData() {
    return this.get();
  }
  updateReqIncome(today) {
    const query: string = `UPDATE ${this.table} SET request_income = request_income + 1 WHERE log_date = '${today}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
  updateRegComplain(today) {
    const query: string = `UPDATE ${this.table} SET register_complain = register_complain + 1 WHERE log_date = '${today}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
  updateRegRefCode(today) {
    const query: string = `UPDATE ${this.table} SET register_refCode = register_refCode + 1 WHERE log_date = '${today}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  insertNewData(today) {
    const query: string = `insert into ${this.table} (log_date) values ('${today}')`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getTodayComplainlog(today) {
    let query = `SELECT count(*) as cnt FROM ${this.table} WHERE log_date = '${today}'`; 
    //logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
  
}