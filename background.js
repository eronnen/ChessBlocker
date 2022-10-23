chrome.runtime.onInstalled.addListener(() => {
    console.debug('ChessBlocker: installed');
    chrome.runtime.openOptionsPage();
});