let baseUrl =  "https://hooks.slack.com/services/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" // 불편이봇 
let moneyUrl = "https://hooks.slack.com/services/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"; //얼마빌렸지 봇
export function returnURL(botType) {
  if(botType == "complain") {
    return baseUrl;
  }
  else if(botType == "money") {
    return moneyUrl;
  }
  
}

