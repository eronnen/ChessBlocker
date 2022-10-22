let DEFAULT_CONFIG = {
    "chesscom" : {
        "username": "",
        "games_per_day": 10,
    },

    "day_restart_time": new Date(1970, 0, 1, 3, 0, 0),
};

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set(DEFAULT_CONFIG);
    console.log('Configuring default values');
});