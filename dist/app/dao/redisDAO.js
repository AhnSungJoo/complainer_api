"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const settingConfig = require("config");
const logger_1 = require("../util/logger");
const redisClient = redis.createClient({
    'host': '192.168.0.57',
    'port': 6379,
    'db': 10,
});
function redisConnect() {
    console.log('connect redis');
    redisClient.on("error", function (err) {
        logger_1.default.warn("redis connect error");
    });
}
function changeTelegramFlag(flag) {
    return __awaiter(this, void 0, void 0, function* () {
        yield redisConnect();
        console.log('change here');
        const key = settingConfig.get("redis-db-telegram-key");
        redisClient.set(key, flag, function (err, replies) {
            redisClient.quit();
        });
    });
}
exports.changeTelegramFlag = changeTelegramFlag;
function getTelegramFlag() {
    return __awaiter(this, void 0, void 0, function* () {
        yield redisConnect();
        console.log('get here');
        const key = settingConfig.get("redis-db-telegram-key");
        const result = yield redisClient.get(key, function (err, reply) {
            console.log(reply);
        });
        console.log(result);
    });
}
exports.getTelegramFlag = getTelegramFlag;
