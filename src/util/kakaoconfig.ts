const complainerBotId = "620cea77ca92880f0b4e73c8"; // 프로불편러 botid (운영)
const kookmintBotId = "62a886bf38e0d06d4c8ad184"; // 얼마빌렸지 botid (운영)
const complaienrRestApiKey = "78adf05032b45d191d4e69e5fc584ac5"; // 프로불편러 devlopers rest api key
const kookmintRestApiKey = "522f72646e207cb85a5816f70f20b50e"; // 얼마빌렸지 devlopers rest api key


// bot 이벤트 블록 호출 API를 호출하여 Event API 전송
// request body sample
/*
{
  "event": {
    "name": "bot_test_event", // 챗봇 관리자센터에서 설정한 이벤트 이름
    "data": {
      "text": "Hello World"
    }
  },
  "user": [ // EventAPI 전송할 user Id 
    {"type": "botUserKey", "id": "12345"}, // type: 유저 아이디 타입 (값 중 하나)  appUserId / plusfriendUserKey / botUserKey
    {"type": "botUserKey", "id": "12346"}
  ],
  "params":{ // 챗봇 관리자센터에서 설정하지 않았으면 상관없음
    "foo":"bar"
  }
}
*/

export function returnbase(flag) {
  let botId = ''
  if(flag == 'complainer') {
    botId = complainerBotId;
  } else if(flag == 'kookmin') {
    botId = kookmintBotId;
  }
  let apiUrl =  `https://bot-api.kakao.com/v2/bots/${botId}/talk`;
  return apiUrl;
}

export function returnApiKey(flag) {
  let restApiKey = '';
  if(flag == 'complainer') {
    restApiKey = complaienrRestApiKey;
  } else if(flag == 'kookmin') {
    restApiKey = kookmintRestApiKey;
  }
  return restApiKey;
}