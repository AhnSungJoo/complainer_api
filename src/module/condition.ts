import logger from '../util/logger';
import * as config from 'config';

export async function ipAllowedCheck(ctx) {
  logger.info(`ip check`);
  //const trustedIps: Array<String> = config.get('ip-allowed');
  //test 용
  const trustedIps = [
    "124.53.181.155",
    "121.133.22.1",
    "39.7.230.144",
    "175.113.222.237",
    "121.134.203.253"
  ]; 
  logger.info(`ip: ${trustedIps}`);
  var requestIP = ctx.ip;
  logger.info(`ip-req: ${requestIP}`);
  if(trustedIps.indexOf(requestIP) >= 0) {
    return true;
  } else {
    return false;
  }
}
