'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const moment = require("moment");
const winston = require("winston");
const winston_1 = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const { combine, timestamp, label, printf } = winston_1.format;
const myFormat = printf(({ level, message, timestamp }) => {
    const dt = moment(timestamp).format('HH:mm:ss.SSS');
    //return `${dt} ${level}: ${message}`;
    return `[${dt}] ${level.toUpperCase()} ${message}`;
});
var LoggerType;
(function (LoggerType) {
    LoggerType[LoggerType["BALANCER"] = 0] = "BALANCER";
    LoggerType[LoggerType["SOCKET_SERVER"] = 1] = "SOCKET_SERVER";
    LoggerType[LoggerType["CRAWLER"] = 2] = "CRAWLER";
    LoggerType[LoggerType["TRADER"] = 3] = "TRADER";
})(LoggerType = exports.LoggerType || (exports.LoggerType = {}));
;
class Logger {
    constructor() {
        this.errorLogger = null;
        this.trLogger = null;
        if (!Logger.instance) {
            this.props = {};
            this.props.inited = false;
            const loggerOptions = {
                //format: customMsgFormat
                format: combine(timestamp(), myFormat),
                exitOnError: false
            };
            this.outLogger = winston.createLogger(loggerOptions);
            // this.errorLogger = new (winston.Logger)();
            Logger.instance = this;
        }
        return Logger.instance;
    }
    init(name) {
        console.log('logger initialization!!!');
        if (!name) {
            throw new Error('Logger must be provided a name.');
        }
        let transport = null;
        transport = new winston.transports.Console({});
        this.outLogger.add(transport);
        transport = new DailyRotateFile({
            dirname: 'logs',
            filename: `${name}-out-%DATE%.log`,
            datePattern: 'YYYYMMDD',
            maxFiles: 10,
            // Maximum size of the file after which it will rotate. This can be a number of bytes, or units of kb, mb, and gb. If using the units, add 'k', 'm', or 'g' as the suffix. The units need to directly follow the number. (default: null)
            maxSize: '1gb',
            json: false,
        });
        this.outLogger.add(transport);
        this.props.inited = true;
    }
    // error(...args: Array<any>) {
    //   if (this.props.inited === false)
    //     throw new Error('Logger: Must be initialized before use');
    //   const text = util.format.apply(this, args as any);
    //   this.errorLogger.error(text);
    // }
    warn(...args) {
        if (this.props.inited === false)
            throw new Error('Logger: Must be initialized before use');
        const text = util.format.apply(this, args);
        this.outLogger.warn(text);
    }
    out(...args) {
        this.info(...args);
    }
    info(...args) {
        if (this.props.inited === false)
            throw new Error('Logger: Must be initialized before use');
        const text = util.format.apply(this, args);
        this.outLogger.info(text);
    }
    debug(...args) {
        if (this.props.inited === false)
            throw new Error('Logger: Must be initialized before use');
        const text = util.format.apply(this, args);
        this.outLogger.debug(text);
    }
}
Logger.instance = null;
const instance = new Logger();
Object.freeze(instance);
exports.default = instance;
