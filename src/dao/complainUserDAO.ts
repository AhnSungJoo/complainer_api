import MySqlDAO from './mysql_dao';

import * as DBHelper from '../helpers/DBHelper';

export default class complainUserDAO extends MySqlDAO {
  constructor() {
    super('real-mysql', 'complain_user'); 
  }

  updateRef(uesrId: string, refCode: string) {
    const query: string = `UPDATE ${this.table} SET ref_code = '${refCode}' WHERE id = ${uesrId}`;

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => data.result);
  }
}