import MySqlDAO from './mysql_dao';
import * as DBHelper from '../helpers/DBHelper';
import logger from '../util/logger';
import * as moment from 'moment'

export default class complainUserDAO extends MySqlDAO {
  constructor() {
    super('real-mysql', 'kookmin_user'); 
  }

  getAllKookminAlarmData() {
    return this.get();
  }

  checkKookminUser(userId) {
    let query = `SELECT * FROM ${this.table} where kakao_id = '${userId}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getOtherKaKaoId(phoneNumber) {
    let query = `SELECT kakao_id FROM ${this.table} where user_phone_number like '%${phoneNumber}%'`;
    logger.info(`${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  insertKookminMoney(userId, userName, phoneNumber) {
    const query: string = `insert into ${this.table} (kakao_id, user_name, user_phone_number) values ('${userId}', '${userName}', '${phoneNumber}')`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
}