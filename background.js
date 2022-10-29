chrome.runtime.onInstalled.addListener(() => {
    console.debug('ChessBlocker: installed');
    chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
    if (message.type == 'limit') {
        chrome.tabs.create({
            url: 'chesscom_daily_limit_page.html'
        });
    }
    else if (message.type == 'allow-liveChallenge-link') {
        console.debug('allowing liveChallenge');
        chrome.declarativeNetRequest.updateEnabledRulesets({
            disableRulesetIds: ["liveChallenge_link"]
        }).then(senderResponse);
    }
    else if (message.type == 'disallow-liveChallenge-link') {
        console.debug('disallowing liveChallenge');
        chrome.declarativeNetRequest.updateEnabledRulesets({
            enableRulesetIds: ["liveChallenge_link"]
        });
    }
});
