import * as DBHelper from '../helpers/DBHelper';
import MySqlDAO from './mysql_dao';

import logger from '../util/Logger';
export default class RealDAO extends MySqlDAO {
  constructor() {
    const TARGET_DB: string = 'real-mysql';

    super(TARGET_DB, 'push_news_stock_score');
  }

  getScoreData(date: String, code: String): Promise<Array<any>> {
    let query = `SELECT data FROM push_news_stock_score WHERE code="${code}" and date="${date}"`;
    
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
}