let baseUrl = "https://hooks.slack.com/services/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"; // 프로불편러 Url
let moneyUrl = "https://hooks.slack.com/services/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"; // 얼마빌렸지 url
/** 위 URL 변경시 config  git으로 넘기면 슬랙 관리자센터에서 Url이 변경돼 403에러가 남 => 반드시 원격서버에서 수정할 것 */
export function returnURL(botType) {
  if(botType == "complain") {
    return baseUrl;
  }
  else if(botType == "money") {
    return moneyUrl;
  }   
}