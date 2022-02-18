import * as DBHelper from '../helpers/DBHelper';
import MySqlDAO from './mysql_dao';
import logger from '../util/logger';

export default class signalDAO extends MySqlDAO {
  constructor(tableType) {
    const TARGET_DB: string = 'real-mysql';
    let TARGET_TABLE: string
    if (tableType === 'complainer') {
      TARGET_TABLE = 'complainer'
    } 

    super(TARGET_DB, TARGET_TABLE);
  }
  upsertSignalData(values) {
    return this.upsert(values);
  }

  getAllSignalData() {
    return this.get();
  }

  insertComplainContext(complain_text, userId, point) {
    const query: string = `insert into complainer (kakao_id, complain_context, send_point) values ('${userId}', '${complain_text}', ${point})`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getUserPoint(userId){
    let query = `SELECT point_total FROM complain_user where kakao_id = '${userId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
  }

  checkExistUser(userId) {
    let query = `SELECT count(*) FROM complain_user where kakao_id = '${userId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]); 
  }

  insertComplainUserData(userId, point) {
    const query: string = `insert into complain_user (kakao_id, point_total) values ('${userId}', ${point})`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  updateComplainUserData(userId, point) {
    const query: string = `UPDATE complain_user SET point_total=${point} WHERE kakao_id= '${userId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getDataUseUpdate(start, end, symbol) {
    let query = `SELECT * FROM ${this.table} where order_date >= '${start}' and order_date <= '${end}' and valid_type = 0 and symbol = '${symbol}' order by order_date`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
  updateDataOrdTotalScoreBuyList(total_score, ord, buy_list, order_date, side, algorithm_id) {
    
    let query = `UPDATE ${this.table} SET total_score = ${total_score}, ord = ${ord}, buy_list = '${buy_list}' 
    WHERE algorithm_id = '${algorithm_id}' and side ='${side}' and order_date = '${order_date}'`

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getSpecifitSignalData(no, page_size) {
    let query = `SELECT * FROM ${this.table} order by ord desc limit ${no}, ${page_size}`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getDateSignalData(start, end) {
    let query = `SELECT * FROM ${this.table} where order_date >= '${start}' and order_date <= '${end}' and valid_type = 0 order by ord`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getSpecificTotalScore(symbol: string) {
    let query = `SELECT total_score, ord FROM ${this.table} WHERE symbol='${symbol}' and valid_type = 0 order by ord desc limit 1`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getSendDateIsNull(symbol: string) {
    let query = `SELECT count(*) as cnt FROM ${this.table} WHERE symbol='${symbol}' and send_date is null and valid_type = 0`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
  }

  getMaxOrd() {
    let query = `SELECT max(ord) as ord FROM ${this.table}`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
}

  getAllSymbol() {
    let query = `SELECT distinct(symbol) FROM ${this.table}`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
  
  checkColumn(algorithmId, orderDate, side, symbol) {
    let query = `SELECT count(*) as cnt FROM ${this.table} 
    WHERE algorithm_id = '${algorithmId}' and order_date = '${orderDate}' and side = '${side}' and symbol = '${symbol}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
  }

  getLastSideEachAlgorithm(algorithmId, symbol) {
    let query = `SELECT side FROM ${this.table} where algorithm_id = '${algorithmId}' and symbol = '${symbol}' order by ord desc limit 1;`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getLastBuyListEachSymbol(symbol) {
    let query = `SELECT buy_list FROM ${this.table} where symbol = '${symbol}' order by ord desc limit 1;`;
    console.log(query);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getSpecificSignalColumn(ord, symbol) {
    let query = `SELECT * FROM ${this.table} where ord = '${ord}' and symbol = '${symbol}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
}
