document.getElementById('settingsButton').addEventListener('click', (event) => {
    chrome.runtime.openOptionsPage();
});

async function updateTodayGames() {
    const items = await chrome.storage.sync.get({
        dayStartTimeHours: 3,
        dayStartTimeMinutes: 30,
        chesscom_username: '',
        lichess_username: '',
    });

    const currentDate = new Date();
    const dayStart = getDayStart(currentDate, items.dayStartTimeHours, items.dayStartTimeMinutes);

    //chess.com
    if (items.chesscom_username) {
        const chesscomGamesElement = document.getElementById('chesscom_games');
        chesscomGamesElement.innerHTML = '<div class="loader"></div>&nbsp;Games';
        getChesscomMonthGames(items.chesscom_username, dayStart)
            .then((response) => response.json())
            .then((responseJson) => {
                let numberOfGames = 0;
                if (responseJson['games']) {
                    numberOfGames = (responseJson["games"].filter((g) => g['end_time'] * 1000 > dayStart)).length; 
                }
                chesscomGamesElement.innerHTML = `<span style="font-weight: bold;">${numberOfGames}</span> Games`;
            })
            .catch(() => {
                chesscomGamesElement.innerHTML = '<span style="font-weight: bold;">(Error)</span>';
            });
    }

    if (items.lichess_username) {
        const lichessGamesElement = document.getElementById('lichess_games');
        lichessGamesElement.innerHTML = '<div class="loader"></div>&nbsp;Games';
        getLichessGamesNumber(items.lichess_username, dayStart)
            .then((numberOfGames) => {
                lichessGamesElement.innerHTML = `<span style="font-weight: bold;">${numberOfGames}</span> Games`;
            })
            .catch(() => {
                lichessGamesElement.innerHTML = '<span style="font-weight: bold;">(Error)</span>';
            });
    }
}

updateTodayGames();
