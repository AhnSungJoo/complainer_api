'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Router = require("koa-router");
const externalMSG_1 = require("../module/externalMSG");
const insertDB_1 = require("../module/insertDB");
const api_1 = require("./api");
// dao
const signalDAO_1 = require("../dao/signalDAO");
const db_modules = [insertDB_1.upsertData];
const msg_modules = [externalMSG_1.sendExternalMSG]; // 텔레그램 알림 모음 (내부 / 외부)
const router = new Router();
router.get('/sendmsg', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    const forum = 'test';
    return ctx.render('sendmsg', { forum });
}));
router.get('/test', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    const forum = 'test';
    return ctx.render('test', { forum });
}));
router.post('/rangeSend', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    const startDate = ctx.request.body.startDate;
    const endDate = ctx.request.body.endDate;
    const dao = new signalDAO_1.default();
    const result = yield dao.getDateSignalData(startDate, endDate);
    api_1.delayedTelegramMsgTransporter(result, 0);
    return ctx.body = { result: true };
}));
exports.default = router;
