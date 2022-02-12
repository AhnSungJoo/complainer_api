import pool from '../util/db_pool';
import logger from '../util/logger';
import { MysqlError, PoolConnection } from 'mysql';

export const query = (db: string, qry) => {
  return new Promise((resolve, reject) => {
    pool.getConnection(db, (err: MysqlError, con: PoolConnection) => {
      if (err) {
        if (con)
          con.release();
        reject(err);
      }
      else {
        resolve(con);
      }
    });
  })
  .then((conn: any) => {
    return new Promise((resolve, reject) => {
      conn.query(qry, (err, results, fields) => {
        conn.release();
        if (err)
          reject(err);
        else {
          resolve({result: results, fields: fields});
        }
      })
    })
  })
}

export const queryOne = (db: string, qry) => {
  return query(db, qry)
  .then((value: any) => {
    const { result, field } = value;
    return { result: result[0], field };
  })
}

export const generateSelectQuery = (table: string, filter: any=null, orderby: any=null, limit: any=null) => {
  let stmt = `SELECT * FROM ${table}`;
  
  if (filter) {
    const filterNames = Object.keys(filter);
    if (filterNames.length > 0) {
      const temp = filterNames.map((name) => `${name}='${filter[name]}'`);
      stmt += ' WHERE ' + temp.join(' AND ');
    }
  }

  if (orderby) {
    const colNames = Object.keys(orderby);
    if (colNames.length > 0) {
      const temp = colNames.map((name) => `${name} ${orderby[name].toUpperCase()}`);
      stmt += ' ORDER BY ' + temp.join(',');
    }
  }

  if (limit) {
    const offset: string = limit.offset ? `${limit.offset}, ` : '';
    const len: string = limit.len ? limit.len : '';
    stmt += ` LIMIT ${offset} ${len}`;
  }

  return stmt + ';';
}

export const generateInsertStatement = (table, obj) => {
  let statement = `INSERT INTO ${table} (`;
  const keys = Object.keys(obj);
  statement += keys.join(',') + ') VALUES (';
  const values = keys.map(function(key) {
    // https://stackoverflow.com/questions/881194/how-do-i-escape-special-characters-in-mysql/881208#881208
    if (typeof obj[key] === 'string') {
      // 삽입될 값들은 작은 따옴표로 감싸지기 때문에 큰 따옴표에 대한 치환은 하지 않아도 된다.
      return obj[key].replace(/'/g, `''`);
    }
    else {
      return obj[key];
    }
  });
  statement += "'" + values.join("','") + "');";
  return statement;
}

export const generateInsertValueStatement = (table, obj) => {
  const keys = Object.keys(obj);
  let statement = '(';
  const values = keys.map(function(key) {
    if (typeof obj[key] === 'string') {
      return obj[key].replace(/'/g, `''`);
      // 삽입될 값들은 작은 따옴표로 감싸지기 때문에 큰 따옴표에 대한 치환은 하지 않아도 된다.
    }
    else {
      return obj[key];
    }
  });
  statement += `'` + values.join(`','`) + `')`;
  return statement;
}

function generateKeyValuePairStrings(obj: any): Array<any> {
  return Object.keys(obj).map(function(key) {
    if (typeof obj[key] === 'string') {
      let replaced = obj[key].replace(/'/g, `''`);
      // 여기서 작은 따옴표로 replaced를 감싸기 때문에 큰 따옴표에 대한 치환은 하지 않아도 된다.
      return `${key}='${replaced}'`;
    }
    else {
      return `${key}='${obj[key]}'`;
    }
  })
}

export const generateUpdateStatement = (table, obj: any, cond='') => {
  let statement = `UPDATE ${table} SET `;
  const keyValuePairStrings = generateKeyValuePairStrings(obj);

  statement += keyValuePairStrings.join(', ');
  if (cond.length > 0) {
    statement += ` WHERE ${cond};`;
  }
  
  return statement;
}

export const generateUpsertStatement = (table: string, obj: any) => {
  // INSERT INTO simulation_result (user_id, alg_id, chart, performance, return_values)
  // VALUES (1, 39, '[{x:1, y:0.23432}, {x:2, y:0.532}]', '', '{ "return_1w": 0.234, "return_1m": 0.53, "return_3m": 0.78 }')
  // ON DUPLICATE KEY UPDATE chart='[{x:2, y:0.23432}, {x:3, y:0.532}]', return_values='{ "return_1w": 0.999, "return_1m": 0.99, "return_3m": 0.99 }';

  let insertStmt = generateInsertStatement(table, obj);
  insertStmt = insertStmt.substring(0, insertStmt.length - 1); // 끝의 ;를 제거
  console.log('insertstmt', insertStmt)
  const keyValuePairStrings = generateKeyValuePairStrings(obj);
  return insertStmt + ` ON DUPLICATE KEY UPDATE ${keyValuePairStrings.join(', ')}`;
}

