'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql");
const config = require("config");
class DBPool {
    constructor() {
        if (!DBPool.instance) {
            this.pool = {};
            const dbs = config.get('db');
            Object.keys(dbs).forEach((key) => {
                const dbInfo = dbs[key];
                this.pool[key] = mysql.createPool({
                    connectionLimit: 100,
                    host: dbInfo.host,
                    user: dbInfo.user,
                    password: dbInfo.password,
                    database: dbInfo.db
                });
            });
            DBPool.instance = this;
        }
        return DBPool.instance;
    }
    getConnection(targetDB, f) {
        if (this.pool[targetDB] === undefined)
            throw new Error(`Unsupported DB '${targetDB}'`);
        this.pool[targetDB].getConnection(f);
    }
    getMultiConnection() {
        return mysql.createConnection({
            host: config.get('db.mysql.host'),
            user: config.get('db.mysql.user'),
            password: config.get('db.mysql.password'),
            database: config.get('db.mysql.db'),
            multipleStatements: true
        });
    }
    doEscape(text) {
        return mysql.escape(text);
    }
}
const instance = new DBPool();
Object.freeze(instance);
exports.default = instance;
