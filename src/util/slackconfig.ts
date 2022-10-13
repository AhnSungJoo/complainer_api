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