"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_pool_1 = require("../util/db_pool");
exports.query = (db, qry) => {
    return new Promise((resolve, reject) => {
        db_pool_1.default.getConnection(db, (err, con) => {
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
        .then((conn) => {
        return new Promise((resolve, reject) => {
            conn.query(qry, (err, results, fields) => {
                conn.release();
                if (err)
                    reject(err);
                else {
                    resolve({ result: results, fields: fields });
                }
            });
        });
    });
};
exports.queryOne = (db, qry) => {
    return exports.query(db, qry)
        .then((value) => {
        const { result, field } = value;
        return { result: result[0], field };
    });
};
exports.generateSelectQuery = (table, filter = null, orderby = null, limit = null) => {
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
        const offset = limit.offset ? `${limit.offset}, ` : '';
        const len = limit.len ? limit.len : '';
        stmt += ` LIMIT ${offset} ${len}`;
    }
    return stmt + ';';
};
exports.generateInsertStatement = (table, obj) => {
    let statement = `INSERT INTO ${table} (`;
    const keys = Object.keys(obj);
    statement += keys.join(',') + ') VALUES (';
    const values = keys.map(function (key) {
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
};
exports.generateInsertValueStatement = (table, obj) => {
    const keys = Object.keys(obj);
    let statement = '(';
    const values = keys.map(function (key) {
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
};
function generateKeyValuePairStrings(obj) {
    return Object.keys(obj).map(function (key) {
        if (typeof obj[key] === 'string') {
            let replaced = obj[key].replace(/'/g, `''`);
            // 여기서 작은 따옴표로 replaced를 감싸기 때문에 큰 따옴표에 대한 치환은 하지 않아도 된다.
            return `${key}='${replaced}'`;
        }
        else {
            return `${key}='${obj[key]}'`;
        }
    });
}
exports.generateUpdateStatement = (table, obj, cond = '') => {
    let statement = `UPDATE ${table} SET `;
    const keyValuePairStrings = generateKeyValuePairStrings(obj);
    statement += keyValuePairStrings.join(', ');
    if (cond.length > 0) {
        statement += ` WHERE ${cond};`;
    }
    return statement;
};
exports.generateUpsertStatement = (table, obj) => {
    // INSERT INTO simulation_result (user_id, alg_id, chart, performance, return_values)
    // VALUES (1, 39, '[{x:1, y:0.23432}, {x:2, y:0.532}]', '', '{ "return_1w": 0.234, "return_1m": 0.53, "return_3m": 0.78 }')
    // ON DUPLICATE KEY UPDATE chart='[{x:2, y:0.23432}, {x:3, y:0.532}]', return_values='{ "return_1w": 0.999, "return_1m": 0.99, "return_3m": 0.99 }';
    let insertStmt = exports.generateInsertStatement(table, obj);
    insertStmt = insertStmt.substring(0, insertStmt.length - 1); // 끝의 ;를 제거
    console.log('insertstmt', insertStmt);
    const keyValuePairStrings = generateKeyValuePairStrings(obj);
    return insertStmt + ` ON DUPLICATE KEY UPDATE ${keyValuePairStrings.join(', ')}`;
};
