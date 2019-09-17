import * as moment from 'moment';
import * as settingConfig from 'config';

// dao
import singnalDAO from '../dao/signalDAO';
import flagDAO from '../dao/flagDAO';
import nameDAO from '../dao/nameDAO';

import logger from '../util/logger';

import {sendErrorMSG} from './errorMSG';


// 알고리즘 ID가 target id인지 확인 
// fasle인 경우 DB 저장 X
export async function checkExistAlgo(algorithmId, reqData) {
  logger.info('알고리즘 ID가 target id인지 확인합니다.');
  let cnt = 0;
  const namesDAO = new nameDAO();
  const algoList = await namesDAO.getAllNameList();

  for (let index in algoList) {
    if(algoList[index]['algorithm_id'] === algorithmId) cnt += 1;
  }

  if (cnt === 0) {
    logger.warn('Target algorithm ID가 아닙니다.')
    sendErrorMSG('Target algorithm ID가 아닙니다.' + JSON.stringify(reqData));
    return false;
  }

  return true;
}

// Signal Data가 이미 들어간 컬럼인지 확인 
// fasle인 경우 DB 저장 X
export async function checkSameColumn(result, reqData) {
  logger.info('중복되는 signal data인지 확인합니다.');
  const dao = new singnalDAO();
  const data = await dao.checkColumn(result['algorithm_id'], result['order_date'], result['side'], result['symbol'])

  if (data.cnt >= 1) {
    logger.warn('중복된 컬럼입니다.')
    sendErrorMSG('중복된 컬럼입니다.' + JSON.stringify(reqData));
    return false
  }

  else {
    return true
  }
}

// 2분 이내에 발생한 신호인지 확인
// fasle인 경우 DB 저장 X
export async function checkLast2min(values, reqData) {
  logger.info('2분 이내에 발생한 Signal인지 확인합니다.')
  const rangeTime = settingConfig.get('range_time_min');
  const flag = new flagDAO();
  const flagData = await flag.getFlag('last');
  const lastFlag = flagData[0]['flag'];

  let t1 = moment(values['order_date'], 'YYYY-MM-DD HH:mm:ss');
  let t2 = moment();

  let diffDays = moment.duration(t2.diff(t1)).asMinutes();
  console.log(diffDays);

  if (diffDays > rangeTime && lastFlag === 'on') {
    logger.warn('신호의 날짜가 일정 주기를 넘어섭니다.');
    sendErrorMSG('2분이 지난 Signal Data가 들어왔습니다. req_data: ' + JSON.stringify(reqData));
    return false;
  }
  return true;
}

// 각 전략별 심볼의 최신 total_score, ord 를 가져온다.
// checkTotalScore에서 사용
export async function getTotalScore(values) {
  logger.info('특정 symbol별 가장 최근의 total_score, ord를 가져옵니다.');
  const signDAO = new singnalDAO();
  let lastResult = await signDAO.getSpecificTotalScore(values['symbol']);
  let lastScore, lastOrd;

  if (!lastResult || lastResult.length < 1) { // 보통 처음 컬럼이 들어가는 경우 
    lastScore = 0;
    lastOrd = 0;
  } else { // lastResult 가 존재하는 경우 => 컬럼이 있는경우
    lastScore = lastResult[0]['total_score'];
    lastOrd = lastResult[0]['ord'];
    lastOrd = lastOrd + 1;
  }
  return {lastScore, lastOrd};
}

// 종목점수가 5가 넘어가거니 0 아래로 떨어지는 지 확인
// 5를 넘거나 0을 넘으면 ord, valid_type 을 -1로 변경
// 텔레그램 메시지 발송 X
export async function checkTotalScore(values, mode, reqData) {
  logger.info('total score가 5가 넘거나 0 아래로 떨어지는지 확인합니다.');
  const result = await getTotalScore(values);
  const lastScore = result['lastScore'];
  const lastOrd = result['lastOrd'];
  values['ord'] = lastOrd;

  if (values['side'] === 'BUY') {
    if (lastScore >= 5 && mode != 'silent') {
      logger.warn('total score가 5를 초과합니다.');
      sendErrorMSG('total_Score가 5를 초과했습니다. req_data: ' + JSON.stringify(reqData));
      values['valid_type'] = -1
      values['ord'] = -1
    }
    values['total_score'] = lastScore + 1;
  } else if (values['side'] === 'SELL' && mode != 'silent') {
    if (lastScore <= 0) {
      logger.warn('total score가  음수가 됩니다.');
      sendErrorMSG('total_score가 음수가 됩니다. req_data: ' + JSON.stringify(reqData));
      values['valid_type'] = -1
      values['ord'] = -1
    }
    values['total_score'] = lastScore - 1;
  }

  return values;
}

// 동일 전략의 동일 매매 신호가 왔는지 확인
// ex) 3번 전략 매수 신호 후 매도가 안된 상태에서 다시 매수 신호가 온 경우 
// ord, valid_type 을 -1로 변경 후 텔레그램 메시지 발송 X 
export async function checkSameTrading(values, reqData) {
  logger.info('동일 전략 동일 매매인지 확인합니다.');
  const signDAO = new singnalDAO();
  const data = await signDAO.getLastSideEachAlgorithm(values['algorithm_id'], values['symbol']);

  if (!data || data.length < 1) {
    logger.info('[checkSameTrading] 해당 전략 & 심볼에 side가 없습니다. => 처음 들어온 전략 ');

    // 특정 전략의 심볼의 첫 신호가 SELL 이 들어온 경우 
    if (values['side'] === 'SELL') {
      logger.warn('BUY 신호가 없는데 SELL 신호가 발생했습니다.');
      sendErrorMSG('BUY 신호가 없는데 SELL 신호가 발생했습니다. req_data: ' + JSON.stringify(reqData));
      values['valid_type'] = -1
      values['ord'] = -1
    }
    return values;
  }

  // BUY 신호 다음 BUY가 들어오거나 / SELL 신호 다음 SELL 신호가 들어온 경우 
  if (data[0]['side'] === values['side']) {
    logger.warn('동일 전략에 동일 매매 신호가 발생했습니다.');
    sendErrorMSG('동일 전략에 동일 매매 신호가 발생했습니다. req_data: ' + JSON.stringify(reqData));
    values['valid_type'] = -1
    values['ord'] = -1
  }

  return values;
}

// 텔레그램 메시지 발송이 켜져 있는지 (On) 꺼져 있는지 (Off) 확인
// 꺼져있다면 어떤 경우든 텔레그램 메시지를 발송하지 않음 
export async function checkTelegramFlag() {
  const flag = new flagDAO();
  const tgFlag = await flag.getFlag('tg');

  if (tgFlag[0]['flag'] === 'off') {
    logger.warn('현재 텔레그램 신호가 꺼져있는 상태입니다.');
    return false;
  }
  return true;
}

