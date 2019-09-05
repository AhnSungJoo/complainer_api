import * as DBHelper from '../helpers/DBHelper';
import MySqlDAO from './mysql_dao';

import logger from '../util/Logger';
export default class singnalDAO extends MySqlDAO {
  constructor() {
    const TARGET_DB: string = 'dev-mysql';
    const TARGET_TABLE: string = 'signal_algorithm_replace_name';
    super(TARGET_DB, TARGET_TABLE);
  }
  getAllNameList() {
    return this.get();
  }
  getReplaceName(algorithm_id) {
    let query = `SELECT algorithm_name FROM ${this.table} WHERE algorithm_id='${algorithm_id}'`;
  
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
  }
  
  updateReplaceName(originName:string, replaceName:string){
    let query = `UPDATE ${this.table} SET algorithm_name = '${replaceName}' WHERE algorithm_name = '${originName}'`;
    console.log(query);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
}
