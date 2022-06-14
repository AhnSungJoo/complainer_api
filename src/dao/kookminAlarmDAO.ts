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

  insertKookminApply(userId, msg) {
    const query: string = `insert into ${this.table} (kakao_id, contents) values ('${userId}', '${msg}')`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

}