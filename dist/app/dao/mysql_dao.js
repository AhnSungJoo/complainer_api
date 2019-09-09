"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DBHelper = require("../helpers/DBHelper");
class MySqlDAO {
    constructor(db, table) {
        this.table = table;
        this.targetDB = db;
        this.table = table;
    }
    get(filter, orderby) {
        const query = DBHelper.generateSelectQuery(this.table, filter, orderby);
        return DBHelper.query(this.targetDB, query)
            .then((data) => {
            return data.result;
        });
    }
    getOne(filter, orderby) {
        return this.get(filter, orderby)
            .then((data) => {
            return data.result[0] ? data.result[0] : null;
        });
    }
    exists(filter) {
        const query = DBHelper.generateSelectQuery(this.table, filter, null, { len: 1 });
        return DBHelper.query(this.targetDB, query)
            .then((data) => {
            return data.result.length > 0 ? true : false;
        });
    }
    set(value, filter) {
        const query = DBHelper.generateInsertStatement(this.table, value);
        return DBHelper.query(this.targetDB, query)
            .then(({ result }) => {
            return { didSucceed: result.insertId > 0, result };
        });
    }
    // filter에 담긴 문자열은 조건식임.
    // (예 'id>=5')
    update(filter, values) {
        const query = DBHelper.generateUpdateStatement(this.table, values, filter);
        //console.log('update stmt: ', query);
        return DBHelper.query(this.targetDB, query)
            .then((data) => {
            return { didSucceed: data.result.affectedRows > 0, result: data.result };
        });
    }
    upsert(values) {
        const query = DBHelper.generateUpsertStatement(this.table, values);
        //console.log('upsert stmt: ', query);
        return DBHelper.query(this.targetDB, query)
            .then((data) => {
            // TODO:
            //return { didSucceed: data.result.affectedRows > 0, result: data.result };
        });
    }
}
exports.default = MySqlDAO;
