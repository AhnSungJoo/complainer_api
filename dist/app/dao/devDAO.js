"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DBHelper = require("../helpers/DBHelper");
const mysql_dao_1 = require("./mysql_dao");
class singnalDAO extends mysql_dao_1.default {
    constructor() {
        const TARGET_DB = 'dev-mysql';
        const TARGET_TABLE = 'signal_data_test';
        super(TARGET_DB, TARGET_TABLE);
    }
    upsertSignalData(values) {
        return this.upsert(values);
    }
    getAllSignalData() {
        return this.get();
    }
    getSpecifitSignalData(no, page_size) {
        let query = `SELECT * FROM ${this.table} order by received_date desc limit ${no}, ${page_size}`;
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
    getSpecificTotalScore(symbol) {
        let query = `SELECT total_score FROM ${this.table} WHERE symbol='${symbol}' order by received_date desc limit 1`;
        console.log(query);
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
    getAllSymbol() {
        let query = `SELECT distinct(symbol) FROM ${this.table}`;
        console.log(query);
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
}
exports.default = singnalDAO;
