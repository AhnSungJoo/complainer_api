import MySqlDAO from './mysql_dao';
import * as DBHelper from '../helpers/DBHelper';
import logger from '../util/logger';
import * as moment from 'moment'

export default class complainUserDAO extends MySqlDAO {
  constructor() {
    super('real-mysql', 'kookmin_alarm'); 
  }

  getAllComplainerData() {
    return this.get();
  }

  getAllComplainerUser() {
    let query = `SELECT * FROM ${this.table} order by no desc;`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
  
  updateRef(uesrId: string, refCode: string) {
    const query: string = `UPDATE ${this.table} SET ref_code = '${refCode}' WHERE kakao_id = '${uesrId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getRef(uesrId: string) {
    const query: string = `SELECT ref_code FROM ${this.table} WHERE kakao_id = '${uesrId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
  }

  getIncomingUser() {
    const query: string = `SELECT * FROM ${this.table} WHERE income_request = 1`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getSpecificUserAllData(no, page_size) {
    let query = `SELECT * FROM ${this.table} order by no desc limit ${no}, ${page_size}`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getSpecificUserData(no, page_size) {
    let query = `SELECT * FROM ${this.table} WHERE income_request = 1 order by last_income_request desc limit ${no}, ${page_size}`;

    const nowDate: string = moment().format('YYYY-MM-DD HH:mm:ss');
    logger.info(`query: ${nowDate}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getUserPoint(userId){
    let query = `SELECT point_total FROM ${this.table} where kakao_id = '${userId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
  }

  getUserIdUseRefCode(refCode){
    let query = `SELECT kakao_id FROM ${this.table} where ref_code = '${refCode}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
  }

  changePoint(uesrId, chgPoint) {
    const query: string = `UPDATE ${this.table} SET point_total = ${chgPoint}, income_request=0 WHERE kakao_id = '${uesrId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

}