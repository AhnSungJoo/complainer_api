import MySqlDAO from './mysql_dao';
import * as DBHelper from '../helpers/DBHelper';
import logger from '../util/logger';
import * as moment from 'moment'

export default class complainUserDAO extends MySqlDAO {
  constructor() {
    super('real-mysql', 'alba_review'); 
  }
  insertAlbaReview(userId, address) {
    const query: string = `insert into ${this.table} (kakao_id, alba_address) values ('${userId}', '${address}')`;
    logger.info(`${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateAlbaCompany(userId, companyName) {
    const query: string = `UPDATE ${this.table} SET alba_company = '${companyName}' WHERE kakao_id = '${userId}' and register_complete = 0`;
    logger.info(`${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
  
  updateAlbaReview(userId, review_content) {
    const query: string = `UPDATE ${this.table} SET alba_ = '${review_content}', register_complete = 1 WHERE kakao_id = '${userId}' and register_complete = 0`;
    logger.info(`${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
  
  
}