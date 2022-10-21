import MySqlDAO from './mysql_dao';
import * as DBHelper from '../helpers/DBHelper';
import logger from '../util/logger';
import * as moment from 'moment'

export default class complainUserDAO extends MySqlDAO {
  constructor() {
    super('real-mysql', 'kookmin_alarm'); 
  }

  getAllKookminAlarmData() {
    return this.get();
  }

  deleteAlarmData(no) {
    const query: string = `DELETE FROM ${this.table} WHERE no = '${no}'`;
    logger.info(`${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getAllKookminAlarmDataDate() {
    let query = `SELECT * FROM ${this.table} order by register_date desc`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  insertKookminMoney(userId, money) {
    const query: string = `insert into ${this.table} (kakao_id, money_amount, alarm_agree) values ('${userId}', '${money}', 0)`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateKookminDate(userId, receive_date) {
    const query: string = `UPDATE ${this.table} SET receive_date = '${receive_date}' WHERE kakao_id = '${userId}' and alarm_agree = 0 and receive_date is NULL`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateKookminReceive(userId, name) {
    const query: string = `UPDATE ${this.table} SET user_name = '${name}' WHERE kakao_id = '${userId}' and alarm_agree = 0 and user_name is NULL`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateKookminBorrow(userId, phoneNumber) {
    const query: string = `UPDATE ${this.table} SET other_phone_number='${phoneNumber}' WHERE kakao_id = '${userId}' and alarm_agree = 0 and other_user_name is NULL`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateKaKaoUserId(userId, kakaoId) {
    const query: string = `UPDATE ${this.table} SET kakao_user_id = '${kakaoId}' WHERE kakao_id = '${userId}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
  updateOtherKaKaoId(userId, phoneNumber) {
    const query: string = `UPDATE ${this.table} SET other_kakao_id = '${userId}' WHERE other_phone_number like '%${phoneNumber}%'`;
    logger.info(`${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getBorrowInfo(userId){
    let query = `SELECT other_user_name, receive_date, money_amount, other_phone_number FROM ${this.table} where kakao_id = '${userId}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getBorrowPersonData(userId){ // 빌려준 정보 확인
    let query = `SELECT user_name, receive_date, money_amount FROM ${this.table} where other_kakao_id = '${userId}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getSpecificKookminAlarmData(no, page_size) {
    let query = `SELECT * FROM ${this.table} order by register_date desc limit ${no}, ${page_size}`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getBorrowInfoId(phoneNumber) {
    let query = `SELECT * FROM ${this.table} where other_phone_number like '%${phoneNumber}%'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

}