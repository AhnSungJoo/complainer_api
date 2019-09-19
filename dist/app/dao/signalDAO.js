"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DBHelper = require("../helpers/DBHelper");
const mysql_dao_1 = require("./mysql_dao");
class singnalDAO extends mysql_dao_1.default {
    constructor() {
        const TARGET_DB = 'dev-mysql';
        const TARGET_TABLE = 'signal_history';
        super(TARGET_DB, TARGET_TABLE);
    }
    upsertSignalData(values) {
        return this.upsert(values);
    }
    getAllSignalData() {
        return this.get();
    }
    getSpecifitSignalData(no, page_size) {
        let query = `SELECT * FROM ${this.table} order by ord desc limit ${no}, ${page_size}`;
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
    getDateSignalData(start, end) {
        let query = `SELECT * FROM ${this.table} where order_date >= '${start}' and order_date <= '${end}' and valid_type = 0 order by ord`;
        console.log(query);
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
    getSpecificTotalScore(symbol) {
        let query = `SELECT total_score, ord FROM ${this.table} WHERE symbol='${symbol}' and valid_type = 0 order by ord desc limit 1`;
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
    getMaxOrd() {
        let query = `SELECT max(ord) as ord FROM ${this.table}`;
        console.log(query);
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result[0]);
    }
    getAllSymbol() {
        let query = `SELECT distinct(symbol) FROM ${this.table}`;
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
    checkColumn(algorithmId, orderDate, side, symbol) {
        let query = `SELECT count(*) as cnt FROM signal_history 
    WHERE algorithm_id = '${algorithmId}' and order_date = '${orderDate}' and side = '${side}' and symbol = '${symbol}'`;
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result[0]);
    }
    getLastSideEachAlgorithm(algorithmId, symbol) {
        let query = `SELECT side FROM ${this.table} where algorithm_id = '${algorithmId}' and symbol = '${symbol}' order by ord desc limit 1;`;
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
    getSpecificSignalColumn(ord, symbol) {
        let query = `SELECT * FROM ${this.table} where ord = '${ord}' and symbol = '${symbol}'`;
        console.log(query);
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
}
exports.default = singnalDAO;
