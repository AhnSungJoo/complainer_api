'use strict';

import * as mysql from 'mysql';
import * as config from 'config';


class DBPool {
  private static instance: DBPool;
  private pool: {
    [index: string]: mysql.Pool
  };
  
  constructor() {
    if (!DBPool.instance) {
      this.pool = {};

      const dbs: any = config.get('db');
      
     Object.keys(dbs).forEach((key: string) => {
        const dbInfo: any = dbs[key];
        this.pool[key] = mysql.createPool({
          connectionLimit: 100,
          host: dbInfo.host,
          user: dbInfo.user,
          password: dbInfo.password,
          database: dbInfo.db
        });
      })
      
      DBPool.instance = this;
    }

    return DBPool.instance;
  }

  getConnection(targetDB: string, f): void {
    if (this.pool[targetDB] === undefined)
      throw new Error(`Unsupported DB '${targetDB}'`);

    this.pool[targetDB].getConnection(f);
  }

  getMultiConnection(): mysql.Connection {
    return mysql.createConnection({
      host: config.get('db.mysql.host'),
      user: config.get('db.mysql.user'),
      password: config.get('db.mysql.password'),
      database: config.get('db.mysql.db'),
      multipleStatements: true
    });
  }

  doEscape(text: string): string {
    return mysql.escape(text);
  }
}

const instance = new DBPool();
Object.freeze(instance);

export default instance;