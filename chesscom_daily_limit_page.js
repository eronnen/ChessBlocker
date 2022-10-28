function set_message() {
    chrome.storage.sync.get({
        chesscom_games_played_today: -1,
        options_chesscom_gamesPerDay: 10
    }).then((items) => {
        if (items.games_played_today < 0) {
            return;
        }

        document.getElementById('games_played_message').innerHTML = `You played ${items.chesscom_games_played_today} games today!`
        document.getElementById('games_allowed_message').innerHTML = `${items.options_chesscom_gamesPerDay} games were allowed today`
    });
}

document.addEventListener('DOMContentLoaded', set_message);