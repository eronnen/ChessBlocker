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
        getChesscomMonthGames(items.chesscom_username, dayStart)
            .then((response) => response.json())
            .then((responseJson) => {
                let numberOfGames = 0;
                if (responseJson['games']) {
                    numberOfGames = (responseJson["games"].filter((g) => g['end_time'] * 1000 > dayStart)).length; 
                }
                document.getElementById('chesscom_games').innerHTML = `${numberOfGames} Games`;
            });
    }

    if (items.lichess_username) {
        getLichessGames(items.lichess_username, dayStart)
            .then(async (response) => {
                let numberOfGames = 0; 
                for await (const gameJsonText of readLichessGamesResponseLines(response)) {
                    //assume every line is a game without parsing...
                    numberOfGames++;
                }

                document.getElementById('lichess_games').innerHTML = `${numberOfGames} Games`;
            });
    }
}

updateTodayGames();
