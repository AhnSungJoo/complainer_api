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

  insertKookminMoney(userId, money) {
    const query: string = `insert into ${this.table} (kakao_id, money_amount, alarm_agree) values ('${userId}', '${money}', 0)`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateKookminDate(userId, receive_date) {
    const query: string = `UPDATE ${this.table} SET receive_date = '${receive_date}' WHERE kakao_id = '${userId}' and alarm_agree = 0`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateKookminReceive(userId, name, phoneNumber) {
    const query: string = `UPDATE ${this.table} SET user_name = '${name}', user_phone_number='${phoneNumber}' WHERE kakao_id = '${userId}' and alarm_agree = 0`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateKookminBorrow(userId, name, phoneNumber) {
    const query: string = `UPDATE ${this.table} SET other_user_name = '${name}', other_phone_number='${phoneNumber}' WHERE kakao_id = '${userId}' and alarm_agree = 0`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

}