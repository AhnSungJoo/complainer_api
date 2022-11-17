'use strict';

import * as mysql from 'mysql';
import * as config from 'config';
import { loggers } from 'winston';
import logger from '../util/logger';

class DBPool {
  private static instance: DBPool;
  private pool: {
    [index: string]: mysql.Pool
  };
  
  constructor() {
    if (!DBPool.instance) {
      this.pool = {};
      const procName = process.env.name || config.get('name');
      logger.init(procName); // 로그 파일명에 이름을 붙이기 위해
      const dbs: any = process.env.db || config.get('db');
      const dbInfo: any = dbs['mysql'];
      logger.info(`${JSON.stringify(dbInfo)}`);
      mysql.createPool({
        connectionLimit: 100,
        host: dbInfo.host,
        user: dbInfo.user,
        password: dbInfo.password,
        database: dbInfo.db
      });
      /*
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
      */
      
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