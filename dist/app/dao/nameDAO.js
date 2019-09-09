"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DBHelper = require("../helpers/DBHelper");
const mysql_dao_1 = require("./mysql_dao");
class singnalDAO extends mysql_dao_1.default {
    constructor() {
        const TARGET_DB = 'dev-mysql';
        const TARGET_TABLE = 'signal_algorithm_replace_name';
        super(TARGET_DB, TARGET_TABLE);
    }
    getAllNameList() {
        return this.get();
    }
    getReplaceName(algorithm_id) {
        let query = `SELECT algorithm_name FROM ${this.table} WHERE algorithm_id='${algorithm_id}'`;
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result[0]);
    }
    updateReplaceName(originName, replaceName) {
        let query = `UPDATE ${this.table} SET algorithm_name = '${replaceName}' WHERE algorithm_name = '${originName}'`;
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
}
exports.default = singnalDAO;
