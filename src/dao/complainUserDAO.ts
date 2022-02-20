import MySqlDAO from './mysql_dao';
import * as DBHelper from '../helpers/DBHelper';
import logger from '../util/logger';


export default class complainUserDAO extends MySqlDAO {
  constructor() {
    super('real-mysql', 'complain_user'); 
  }

  updateRef(uesrId: string, refCode: string) {
    const query: string = `UPDATE ${this.table} SET ref_code = '${refCode}' WHERE kakao_id = '${uesrId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }

  getRef(uesrId: string) {
    const query: string = `SELECT ref_code FROM ${this.table} WHERE kakao_id = '${uesrId}'`;
    logger.info(`query: ${query}`);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result[0]);
  }
}