import MySqlDAO from './mysql_dao';
import * as DBHelper from '../helpers/DBHelper';
import logger from '../util/logger';
import * as moment from 'moment'

export default class complainUserDAO extends MySqlDAO {
  constructor() {
    super('real-mysql', 'complain_user'); 
  }

  getAllComplainerData() {
    return this.get();
  }

  getAllComplainerUser() {
    let query = `SELECT * FROM ${this.table} order by no desc;`;
    //logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getAllComplainerUserUseWhereClause(whereQuery) {
    let query = `SELECT * FROM ${this.table} A ${whereQuery} order by no desc;`;
    //logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
  
  updateRef(uesrId: string, refCode: string) {
    const query: string = `UPDATE ${this.table} SET ref_code = '${refCode}' WHERE kakao_id = '${uesrId}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateIncomeRequest(uesrId: string, requestFlag: Number) {
    const query: string = `UPDATE ${this.table} SET income_request = ${requestFlag} WHERE kakao_id = '${uesrId}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getRef(uesrId: string) {
    const query: string = `SELECT ref_code FROM ${this.table} WHERE kakao_id = '${uesrId}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
  }

  getIncomingUser() {
    const query: string = `SELECT * FROM ${this.table} WHERE income_request = 1`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getSpecificUserAllData(no, page_size) { // join 사용
    let query = `SELECT A.no, A.kakao_id, A.age, A.sex, A.job, A.ref_code, A.join_date,
    (SELECT COUNT(*) FROM complainer B WHERE B.kakao_id = A.kakao_id) AS cnt
FROM ${this.table} A order by A.no desc limit ${no}, ${page_size};`

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getSpecificUserAllDataUseWhere(no, page_size, whereClause) { 
    let query = `SELECT A.no, A.kakao_id, A.age, A.sex, A.job, A.ref_code, A.join_date,
    (SELECT COUNT(*) FROM complainer B WHERE B.kakao_id = A.kakao_id) AS cnt
FROM ${this.table} A ${whereClause} order by A.no desc limit ${no}, ${page_size};`

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getSpecificUseData(kakao_id) {
      let query = `SELECT A.no, A.kakao_id, A.age, A.sex, A.job, A.ref_code, A.join_date,
      (SELECT COUNT(*) FROM complainer B WHERE B.kakao_id = A.kakao_id) AS cnt
  FROM ${this.table} A WHERE kakao_id = '${kakao_id}';`

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

  changeOnlyPoint(uesrId, chgPoint) {
    const query: string = `UPDATE ${this.table} SET point_total = ${chgPoint} WHERE kakao_id = '${uesrId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  changePointNotIncome(uesrId, chgPoint) {
    const query: string = `UPDATE ${this.table} SET point_total = ${chgPoint} WHERE kakao_id = '${uesrId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getTotalComplain() {
    let query = `SELECT count(*) as cnt FROM ${this.table}`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getTodayComplain() {
    let query = `SELECT count(*) as cnt FROM ${this.table} WHERE join_date > curdate()`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getUsersAgeInfo() {
    let query = `SELECT count(age) as cnt FROM ${this.table} group by age order by age;`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
  getUsersSexInfo() {
    let query = `SELECT count(sex) as cnt FROM ${this.table} group by sex order by sex;`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
  getUsersJobInfo() {
    let query = `SELECT count(job) as cnt FROM ${this.table} group by job order by job;`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

}