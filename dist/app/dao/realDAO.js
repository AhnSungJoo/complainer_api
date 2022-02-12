"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DBHelper = require("../helpers/DBHelper");
const mysql_dao_1 = require("./mysql_dao");
class RealDAO extends mysql_dao_1.default {
    constructor() {
        const TARGET_DB = 'real-mysql';
        super(TARGET_DB, 'push_news_stock_score');
    }
    getScoreData(date, code) {
        let query = `SELECT data FROM push_news_stock_score WHERE code="${code}" and date="${date}"`;
        return DBHelper.query(this.targetDB, query)
            .then((data) => data.result);
    }
}
exports.default = RealDAO;
