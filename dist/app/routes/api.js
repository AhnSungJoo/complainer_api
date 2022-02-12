'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const Router = require("koa-router");
const cors = require("koa2-cors");
const router = new Router();
router.use(cors());
router.get('/', (ctx, next) => {
    ctx.body = 'api';
});
exports.default = router;
