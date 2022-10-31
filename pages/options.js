let chesscomOldUsername = ''; 

function restore_day_limits(value) {
    console.debug('restore day limit: ' + value)
    chrome.storage.sync.get({
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
        document.getElementById('chesscom.gamesPerDay').value = items.chesscom_gamesPerDay[0];
        document.getElementById('chesscom.gamesPerDayMonday').value = items.chesscom_gamesPerDay[1];
        document.getElementById('chesscom.gamesPerDayTuesday').value = items.chesscom_gamesPerDay[2];
        document.getElementById('chesscom.gamesPerDayWednesday').value = items.chesscom_gamesPerDay[3];
        document.getElementById('chesscom.gamesPerDayThursday').value = items.chesscom_gamesPerDay[4];
        document.getElementById('chesscom.gamesPerDayFriday').value = items.chesscom_gamesPerDay[5];
        document.getElementById('chesscom.gamesPerDaySaturday').value = items.chesscom_gamesPerDay[6];
        document.getElementById('chesscom.gamesPerDaySunday').value = items.chesscom_gamesPerDay[0];

        if (value == 'dayOfWeek') {
            document.getElementById('li.chesscom.gamesPerDay').hidden = true;
            document.getElementById('li.chesscom.gamesPerDayMonday').hidden = false;
            document.getElementById('li.chesscom.gamesPerDayTuesday').hidden = false;
            document.getElementById('li.chesscom.gamesPerDayWednesday').hidden = false;
            document.getElementById('li.chesscom.gamesPerDayThursday').hidden = false;
            document.getElementById('li.chesscom.gamesPerDayFriday').hidden = false;
            document.getElementById('li.chesscom.gamesPerDaySaturday').hidden = false;
            document.getElementById('li.chesscom.gamesPerDaySunday').hidden = false;
        }
        else {
            document.getElementById('li.chesscom.gamesPerDay').hidden = false;
            document.getElementById('li.chesscom.gamesPerDayMonday').hidden = true;
            document.getElementById('li.chesscom.gamesPerDayTuesday').hidden = true;
            document.getElementById('li.chesscom.gamesPerDayWednesday').hidden = true;
            document.getElementById('li.chesscom.gamesPerDayThursday').hidden = true;
            document.getElementById('li.chesscom.gamesPerDayFriday').hidden = true;
            document.getElementById('li.chesscom.gamesPerDaySaturday').hidden = true;
            document.getElementById('li.chesscom.gamesPerDaySunday').hidden = true;
        }
    });
}

function restore_options() {
    chrome.storage.sync.get({
        dayStartTimeHours: 3,
        dayStartTimeMinutes: 30,
        chesscom_username: '',
        chesscom_limitByWeekday: false
    }).then((items) => {
        chesscomOldUsername = items.chesscom_username;
        document.getElementById('dayStartTime').value = `${items.dayStartTimeHours.toString().padStart(2,0)}:${items.dayStartTimeMinutes.toString().padStart(2,0)}`;
        document.getElementById('chesscom.username').value = items.chesscom_username;
        if (items.chesscom_limitByWeekday) {
            document.getElementById('chesscom.limitByWeekDay').value = 'dayOfWeek';
        }
        else {
            document.getElementById('chesscom.limitByWeekDay').value = 'day';
        }
        restore_day_limits(document.getElementById('chesscom.limitByWeekDay').value);
    });
}

function save_options() {
    const dayStartTime = document.getElementById('dayStartTime').value;
    const dayStartTimeHours = dayStartTime.match(/(\d{2}):(\d{2})/)[1]; 
    const dayStartTimeMinutes = dayStartTime.match(/(\d{2}):(\d{2})/)[2]; 
    let chesscomUsername = document.getElementById('chesscom.username').value;
    const limitByWeekDay = document.getElementById('chesscom.limitByWeekDay').value == 'dayOfWeek';
    const chesscomGamesPerDay = {
        1: document.getElementById('chesscom.gamesPerDayMonday').value,
        2: document.getElementById('chesscom.gamesPerDayTuesday').value,
        3: document.getElementById('chesscom.gamesPerDayWednesday').value,
        4: document.getElementById('chesscom.gamesPerDayThursday').value,
        5: document.getElementById('chesscom.gamesPerDayFriday').value,
        6: document.getElementById('chesscom.gamesPerDaySaturday').value,
        0: document.getElementById('chesscom.gamesPerDaySunday').value,
    };
    if (!limitByWeekDay) {
        chesscomGamesPerDay[0] = document.getElementById('chesscom.gamesPerDay').value;
        chesscomGamesPerDay[1] = document.getElementById('chesscom.gamesPerDay').value;
        chesscomGamesPerDay[2] = document.getElementById('chesscom.gamesPerDay').value;
        chesscomGamesPerDay[3] = document.getElementById('chesscom.gamesPerDay').value;
        chesscomGamesPerDay[4] = document.getElementById('chesscom.gamesPerDay').value;
        chesscomGamesPerDay[5] = document.getElementById('chesscom.gamesPerDay').value;
        chesscomGamesPerDay[6] = document.getElementById('chesscom.gamesPerDay').value;
    }
    const saveButton = document.getElementById('save');
    saveButton.disabled = true;

    let usernameCheckPromise;
    if (chesscomUsername != chesscomOldUsername) {
        usernameCheckPromise = 
            fetch(`https://api.chess.com/pub/player/${chesscomUsername}`, {method: 'GET', headers: {'Accept': 'application/json'}})
                .then((response) => response.json())
                .then((responseJson) => {
                    if (!responseJson['username']) {
                        alert(`username "${chesscomUsername}" doesn't exist in chess.com!`);
                        chesscomUsername = '';
                    }
                });
    }
    else {
        usernameCheckPromise = Promise.resolve();
    }

    usernameCheckPromise.then(() => {
        chesscomOldUsername = chesscomUsername;
        document.getElementById('chesscom.username').value = chesscomUsername;
    }).then(() => {
        return chrome.storage.sync.set({
            dayStartTimeHours: dayStartTimeHours,
            dayStartTimeMinutes: dayStartTimeMinutes,
            chesscom_username: chesscomUsername,
            chesscom_gamesPerDay: chesscomGamesPerDay,
        });
    }).then(() => {
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => {
            status.textContent = '';
            saveButton.disabled = false;
        }, 1000);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('chesscom.limitByWeekDay').addEventListener('change', (event) => { restore_day_limits(event.target.value); });
    restore_options();
});
document.getElementById('save').addEventListener('click', save_options);
