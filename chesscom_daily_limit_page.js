function dayOfWeekAsString(dayIndex) {
    return ["Sunday", "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayIndex] || '';
}

function set_message() {
    chrome.storage.sync.get({
        chesscom_games_played_today: -1,
        options_dayStartTimeHours: 3,
        options_dayStartTimeMinutes: 30,
        options_chesscom_gamesPerDay: {
            0: 10,
            1: 10,
            2: 10,
            3: 10,
            4: 10,
            5: 10,
            6: 10,
        }
    }).then((items) => {
        if (items.games_played_today < 0) {
            return;
        }

        document.getElementById('games_played_message').innerHTML = `You played ${items.chesscom_games_played_today} games today!`

        
        // TODO: avoid code duplication
        let currentDate = new Date();
        if ((   currentDate.getHours() < items.options_dayStartTimeHours || (currentDate.getHours() == items.options_dayStartTimeHours && currentDate.getMinutes() < options_dayStartTimeMinutes)) &&
                items.options_dayStartTimeHours < 7) {
            // late night hours before limit - consider as previous day still
            currentDate.setDate(currentDate.getDate() - 1);
        }

        document.getElementById('games_allowed_message').innerHTML = `${items.options_chesscom_gamesPerDay[currentDate.getDay()]} games were allowed today (${dayOfWeekAsString(currentDate.getDay())})`
    });
}

document.addEventListener('DOMContentLoaded', set_message);