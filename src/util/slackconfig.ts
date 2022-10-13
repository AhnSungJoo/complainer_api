let baseUrl = "https://hooks.slack.com/services/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";
let moneyUrl = "https://hooks.slack.com/services/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";

export function returnURL(botType) {
  if(botType == "complain") {
    return baseUrl;
  }
  else if(botType == "money") {
    return moneyUrl;
  }
    
}
https://hooks.slack.com/services/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