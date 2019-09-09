import * as Lazy from 'lazy.js'

import * as DBHelper from '../helpers/DBHelper'
import logger from '../util/logger'

interface AnyObject {
  [index: string]: any
}

export default abstract class MySqlDAO {
  protected targetDB: string;

  constructor(db: string, public table: string) {
    this.targetDB = db;
    this.table = table;
  }

  get(filter?: AnyObject, orderby?: AnyObject) {
    const query = DBHelper.generateSelectQuery(this.table, filter, orderby);

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => {
      return data.result;
    })
  }

  getOne(filter?: AnyObject, orderby?: AnyObject) {
    return this.get(filter, orderby)
    .then((data: any) => {
      return data.result[0] ? data.result[0] : null;
    })
  }
  
  exists(filter?: AnyObject) {
    const query = DBHelper.generateSelectQuery(this.table, filter, null, { len: 1 });

    return DBHelper.query(this.targetDB, query)
    .then((data: any) => {
      return data.result.length > 0 ? true : false;
    })
  }

  set(value: AnyObject, filter?: AnyObject) {
    const query = DBHelper.generateInsertStatement(this.table, value);

    return DBHelper.query(this.targetDB, query)
    .then(({ result }: any) => {
      return { didSucceed: result.insertId > 0, result };
    })
  }

  // filter에 담긴 문자열은 조건식임.
  // (예 'id>=5')
  update(filter: string, values: AnyObject) {
    const query = DBHelper.generateUpdateStatement(this.table, values, filter);

    //console.log('update stmt: ', query);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => {
      return { didSucceed: data.result.affectedRows > 0, result: data.result };
    })
  }

  upsert(values: AnyObject) {
    const query = DBHelper.generateUpsertStatement(this.table, values);

    //console.log('upsert stmt: ', query);
    return DBHelper.query(this.targetDB, query)
    .then((data: any) => {
      // TODO:
      //return { didSucceed: data.result.affectedRows > 0, result: data.result };
    })
  }
}