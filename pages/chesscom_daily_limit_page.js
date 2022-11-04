function dayOfWeekAsString(dayIndex) {
    return ["Sunday", "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayIndex] || '';
}

function set_message() {
    chrome.storage.sync.get({
        chesscom_games_played_today: -1,
        dayStartTimeHours: 3,
        dayStartTimeMinutes: 30,
        chesscom_gamesPerDay: {
            0: 10,
            1: 10,
            2: 10,
            3: 10,
            4: 10,
            5: 10,
            6: 10,
        }
    }).then((items) => {
        if (items.chesscom_games_played_today < 0) {
            return;
        }

        document.getElementById('games_played_message').innerHTML = `You played ${items.chesscom_games_played_today} games today!`;

        const currentWeekday = getActualWeekDayByDate(new Date(), items.dayStartTimeHours, items.dayStartTimeMinutes);
        document.getElementById('games_allowed_message').innerHTML = `${items.chesscom_gamesPerDay[currentWeekday]} games were allowed today (${dayOfWeekAsString(currentWeekday)})`;
    });
}

document.addEventListener('DOMContentLoaded', set_message);