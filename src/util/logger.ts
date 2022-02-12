'use strict';

import * as util from 'util';
import * as moment from 'moment';
import * as winston from 'winston';
import { Logger as WinstonLogger, format } from 'winston';
import { ConsoleTransportOptions } from 'winston/lib/winston/transports';

import * as DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
  const dt = moment(timestamp).format('HH:mm:ss.SSS');
  //return `${dt} ${level}: ${message}`;
  return `[${dt}] ${level.toUpperCase()} ${message}`;
});

export enum LoggerType { BALANCER, SOCKET_SERVER, CRAWLER, TRADER };

class Logger {
  private static instance: Logger | null = null;
  private props: any;

  private outLogger: WinstonLogger | null;
  private errorLogger: WinstonLogger | null = null;
  private trLogger: WinstonLogger | null = null;

  constructor() {
    if (!Logger.instance) {
      this.props = {};
      this.props.inited = false;

      const loggerOptions: winston.LoggerOptions = {
        //format: customMsgFormat
        format: combine(
          timestamp(),
          myFormat
        ),
        exitOnError: false
      };
      this.outLogger = winston.createLogger(loggerOptions);
      // this.errorLogger = new (winston.Logger)();

      Logger.instance = this;
    }

    return Logger.instance;
  }

  init(name: string) {
    console.log('logger initialization!!!');
    if (!name) {
      throw new Error('Logger must be provided a name.');
    }

    let transport = null;

    transport = new winston.transports.Console({
    } as ConsoleTransportOptions);
    this.outLogger.add(transport);

    transport = new DailyRotateFile({
      dirname: 'logs',
      filename: `${name}-out-%DATE%.log`,
      datePattern: 'YYYYMMDD',
      maxFiles: 10,
      // Maximum size of the file after which it will rotate. This can be a number of bytes, or units of kb, mb, and gb. If using the units, add 'k', 'm', or 'g' as the suffix. The units need to directly follow the number. (default: null)
      maxSize: '1gb',
      json: false,
      //handleExceptions: true
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

  warn(...args: Array<any>) {
    if (this.props.inited === false)
      throw new Error('Logger: Must be initialized before use');
    const text = util.format.apply(this, args as any);
    this.outLogger.warn(text);
  }

  out(...args: Array<any>) {
    this.info(...args);
  }

  info(...args: Array<any>) {
    if (this.props.inited === false)
      throw new Error('Logger: Must be initialized before use');
    const text = util.format.apply(this, args as any);
    this.outLogger.info(text);
  }

  debug(...args: Array<any>) {
    if (this.props.inited === false)
      throw new Error('Logger: Must be initialized before use');
    const text = util.format.apply(this, args as any);
    this.outLogger.debug(text);
  }
}

const instance = new Logger();
Object.freeze(instance);

export default instance;