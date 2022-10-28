chrome.runtime.onInstalled.addListener(() => {
    console.debug('ChessBlocker: installed');
    chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((m) => {
    if (m.type == 'limit') {
        chrome.tabs.create({
            url: 'chesscom_daily_limit_page.html'
        });
    }
});