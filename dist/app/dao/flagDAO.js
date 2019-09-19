"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DBHelper = require("../helpers/DBHelper");
const mysql_dao_1 = require("./mysql_dao");
class c extends mysql_dao_1.default {
    constructor() {
        const TARGET_DB = 'dev-mysql';
        const TARGET_TABLE = 'flag_set';
        super(TARGET_DB, TARGET_TABLE);
    }
    changeFlag(flag, flagType) {
        let column = 'tg_flag';
        if (flagType === 'last') {
            column = 'last_2_min';
        }
        let query = `UPDATE ${this.table} SET ${column} = '${flag}' where id = 1`;
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
    changeSymbolFlag(flag, symbol) {
        let query = `UPDATE ${this.table} SET ${symbol} = '${flag}' where id = 1`;
        console.log(query);
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
    getFlag(flagType) {
        let column = 'tg_flag';
        if (flagType === 'last') {
            column = 'last_2_min';
        }
        let query = `SELECT ${column} as flag FROM ${this.table} where id = 1`;
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
    getSymbolFlag(symbol) {
        let query = `SELECT ${symbol} as flag FROM ${this.table} where id = 1`;
        console.log(query);
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
    getAllFlag() {
        let query = `SELECT * FROM ${this.table} where id = 1`;
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
}
exports.default = c;
