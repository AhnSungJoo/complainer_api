import MySqlDAO from './mysql_dao';
import * as DBHelper from '../helpers/DBHelper';
import logger from '../util/logger';
import * as moment from 'moment'

export default class complainUserDAO extends MySqlDAO {
  constructor() {
    super('real-mysql', 'adsreward_user'); 
  }

  getAllKookminAlarmData() {
    return this.get();
  }

  checkExistUser(useId) {
    let query = `SELECT count(*) as cnt FROM ${this.table} where kakao_id = '${useId}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
  }

  getUserPoint(userId){
    let query = `SELECT point_total FROM ${this.table} where kakao_id = '${userId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
  }

  getUserAnswerCnt(userId){
    let query = `SELECT answer_cnt FROM ${this.table} where kakao_id = '${userId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
  }

  updateAdsUserPoint(userId, point, answer_cnt) {
    const query: string = `UPDATE ${this.table} SET point_total=${point}, answer_cnt=${answer_cnt} WHERE kakao_id= '${userId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }


  insertRewardUserAge(userId, age) {
    const query: string = `insert into ${this.table} (kakao_id, age) values ('${userId}', ${age})`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateRewardUserAge(userId, age) {
    const query: string = `UPDATE ${this.table} SET age=${age} WHERE kakao_id= '${userId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }


  insertRewardUserSex(userId, sex) {
    const query: string = `insert into ${this.table} (kakao_id, sex) values ('${userId}', ${sex})`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateRewardUserSex(userId, sex) {
    const query: string = `UPDATE ${this.table} SET sex=${sex} WHERE kakao_id= '${userId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  insertRewardUserJob(userId, job) {
    const query: string = `insert into ${this.table} (kakao_id, job) values ('${userId}', '${job}')`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateRewardUserJob(userId, job) {
    const query: string = `UPDATE ${this.table} SET job='${job}' WHERE kakao_id= '${userId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  insertRewardUserkeywords(userId, keywords) {
    const query: string = `insert into ${this.table} (kakao_id, input_keywords) values ('${userId}', '${keywords}')`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateRewardUserkeywords(userId, keywords) {
    const query: string = `UPDATE ${this.table} SET input_keywords='${keywords}' WHERE kakao_id= '${userId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  insertRewardUserTelno(userId, telno) {
    const query: string = `insert into ${this.table} (kakao_id, telno) values ('${userId}', '${telno}')`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateRewardUserTelno(userId, telno) {
    const query: string = `UPDATE ${this.table} SET telno='${telno}' WHERE kakao_id= '${userId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
}