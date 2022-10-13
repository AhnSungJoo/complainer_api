let baseUrl = "https://hooks.slack.com/services/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";

//https://hooks.slack.com/services/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
//let baseUrl =  "https://hooks.slack.com/services/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" // 불편이봇 
let moneyUrl = "https://hooks.slack.com/services/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";
//let moneyUrl = "https://hooks.slack.com/services/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"; //얼마빌렸지 봇

export function returnURL(botType) {
  if(botType == "complain") {
    return baseUrl;
  }
  else if(botType == "money") {
    return moneyUrl;
  }
    
}

