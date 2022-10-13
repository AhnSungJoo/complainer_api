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