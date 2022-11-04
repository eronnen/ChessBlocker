chrome.runtime.onInstalled.addListener(() => {
    console.debug('ChessBlocker: installed');
    chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
    if (message.type == 'limit') {
        chrome.tabs.create({
            url: `/pages/${message.website}_daily_limit_page.html`
        });
    }
    else if (message.type == 'allow-new-game-link') {
        console.debug('allowing new game links');
        chrome.declarativeNetRequest.updateEnabledRulesets({
            disableRulesetIds: [message.website + "_new_game_link"]
        }).then(senderResponse);
    }
    else if (message.type == 'disallow-new-game-link') {
        console.debug('disallowing new game links');
        chrome.declarativeNetRequest.updateEnabledRulesets({
            enableRulesetIds: [message.website + "_new_game_link"]
        });
    }
});
