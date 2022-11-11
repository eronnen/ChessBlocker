function dayOfWeekAsString(dayIndex) {
    return ["Sunday", "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dayIndex] || '';
}

function set_message() {
    const currentDate = new Date();
    const messageElement = document.getElementById('games_played_message');
    messageElement.innerHTML = 'You played <div class="loader"></div> games today!';

    chrome.storage.sync.get({
        dayStartTimeHours: 3,
        dayStartTimeMinutes: 30,
        lichess_username: '',
        lichess_gamesPerDay: {
            0: 10,
            1: 10,
            2: 10,
            3: 10,
            4: 10,
            5: 10,
            6: 10,
        }
    }).then((items) => {
        if (!items.lichess_username) {
            return Promise.resolve(0);
        }

        const dayStart = getDayStart(currentDate, items.dayStartTimeHours, items.dayStartTimeMinutes);
        const numberOfGamesPromise = getLichessGamesNumber(items.lichess_username, dayStart);

        const currentWeekday = getActualWeekDayByDate(new Date(), items.dayStartTimeHours, items.dayStartTimeMinutes);
        document.getElementById('games_allowed_message').innerHTML = `${items.lichess_gamesPerDay[currentWeekday]} games were allowed today (${dayOfWeekAsString(currentWeekday)})`;

        return numberOfGamesPromise; 
    }).then((numberOfGames) => {
        messageElement.innerHTML = `You played ${numberOfGames} games today!`;
    }).catch((e) => {
        messageElement.innerHTML = `You played enough games today! (error getting exact number: ${e})`;
    });
}

document.addEventListener('DOMContentLoaded', set_message);