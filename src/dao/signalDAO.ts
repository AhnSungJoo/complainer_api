import * as DBHelper from '../helpers/DBHelper';
import MySqlDAO from './mysql_dao';

import logger from '../util/Logger';
export default class singnalDAO extends MySqlDAO {
  constructor() {
    const TARGET_DB: string = 'dev-mysql';
    const TARGET_TABLE: string = 'signal_history';
    super(TARGET_DB, TARGET_TABLE);
  }
  upsertSignalData(values) {
    return this.upsert(values);
  }

  getAllSignalData() {
    return this.get();
  }

  getSpecifitSignalData(no, page_size) {
    let query = `SELECT * FROM ${this.table} order by ord desc limit ${no}, ${page_size}`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getDateSignalData(start, end) {
    let query = `SELECT * FROM ${this.table} where order_date >= '${start}' and order_date <= '${end}' order by ord`;
    console.log(query)
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getSpecificTotalScore(symbol: string) {
    let query = `SELECT total_score, ord FROM ${this.table} WHERE symbol='${symbol}' and valid_type = 0 order by ord desc limit 1`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getMaxOrd() {
    let query = `SELECT max(ord) as ord FROM ${this.table}`;
    console.log(query)
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
}

  getAllSymbol() {
    let query = `SELECT distinct(symbol) FROM ${this.table}`;
  
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
  
  checkColumn(algorithmId, orderDate, side, symbol) {
    let query = `SELECT count(*) as cnt FROM signal_history 
    WHERE algorithm_id = '${algorithmId}' and order_date = '${orderDate}' and side = '${side}' and symbol = '${symbol}'`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
  }

  getLastSideEachAlgorithm(algorithmId, symbol) {
    let query = `SELECT side FROM ${this.table} where algorithm_id = '${algorithmId}' and symbol = '${symbol}' order by ord desc limit 1;`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);

  }
}
