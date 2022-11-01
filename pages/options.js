const WEBSITES = ["chesscom", "lichess"];
const WEBSITES_NAMES = {"chesscom": "Chess.com", "lichess": "Lichess.org"};
let oldUsernames = {'chesscom': '', 'lichess': '' };
let usernameValidators = {
    'chesscom': async function(username) {
        return fetch(`https://api.chess.com/pub/player/${username}`, {method: 'GET', headers: {'Accept': 'application/json'}})
            .then((response) => response.json())
            .then((responseJson) => {
                if (!responseJson['username']) {
                    return false;
                }
                return true;
            });
    },
    'lichess': async function(username) {
        return fetch(`https://lichess.org/api/user/${username}`, {method: 'GET', headers: {'Accept': 'application/json'}})
            .then((response) => response.json())
            .then((responseJson) => {
                if (!responseJson['username']) {
                    return false;
                }
                return true;
            });
    }
}

function restore_day_limits(website, limitType) {
    chrome.storage.sync.get({
        [website + '_gamesPerDay']: {
            0: 10,
            1: 10,
            2: 10,
            3: 10,
            4: 10,
            5: 10,
            6: 10,
        }
    }).then((items) => {
        document.getElementById(website + '.gamesPerDay').value = items[website + '_gamesPerDay'][0];
        document.getElementById(website + '.gamesPerDayMonday').value = items[website + '_gamesPerDay'][1];
        document.getElementById(website + '.gamesPerDayTuesday').value = items[website + '_gamesPerDay'][2];
        document.getElementById(website + '.gamesPerDayWednesday').value = items[website + '_gamesPerDay'][3];
        document.getElementById(website + '.gamesPerDayThursday').value = items[website + '_gamesPerDay'][4];
        document.getElementById(website + '.gamesPerDayFriday').value = items[website + '_gamesPerDay'][5];
        document.getElementById(website + '.gamesPerDaySaturday').value = items[website + '_gamesPerDay'][6];
        document.getElementById(website + '.gamesPerDaySunday').value = items[website + '_gamesPerDay'][0];

        if (limitType == 'dayOfWeek') {
            document.getElementById(`li.${website}.gamesPerDay`).hidden = true;
            document.getElementById(`li.${website}.gamesPerDayMonday`).hidden = false;
            document.getElementById(`li.${website}.gamesPerDayTuesday`).hidden = false;
            document.getElementById(`li.${website}.gamesPerDayWednesday`).hidden = false;
            document.getElementById(`li.${website}.gamesPerDayThursday`).hidden = false;
            document.getElementById(`li.${website}.gamesPerDayFriday`).hidden = false;
            document.getElementById(`li.${website}.gamesPerDaySaturday`).hidden = false;
            document.getElementById(`li.${website}.gamesPerDaySunday`).hidden = false;
        }
        else { // 'day'
            document.getElementById(`li.${website}.gamesPerDay`).hidden = false;
            document.getElementById(`li.${website}.gamesPerDayMonday`).hidden = true;
            document.getElementById(`li.${website}.gamesPerDayTuesday`).hidden = true;
            document.getElementById(`li.${website}.gamesPerDayWednesday`).hidden = true;
            document.getElementById(`li.${website}.gamesPerDayThursday`).hidden = true;
            document.getElementById(`li.${website}.gamesPerDayFriday`).hidden = true;
            document.getElementById(`li.${website}.gamesPerDaySaturday`).hidden = true;
            document.getElementById(`li.${website}.gamesPerDaySunday`).hidden = true;
        }
    });
}

function restore_options() {
    optionsGetter = {
        dayStartTimeHours: 3,
        dayStartTimeMinutes: 30
    };

    for (const website of WEBSITES) {
        optionsGetter[website + "_username"] = '';
        optionsGetter[website + "_limitByWeekday"] = false;
    }

    chrome.storage.sync.get(optionsGetter).then((items) => {
        oldUsernames['chesscom'] = items.chesscom_username;
        oldUsernames['lichess'] = items.lichess_username;
        document.getElementById('dayStartTime').value = `${items.dayStartTimeHours.toString().padStart(2,0)}:${items.dayStartTimeMinutes.toString().padStart(2,0)}`;

        for (const website of WEBSITES) {
            document.getElementById(website + '.username').value = items[website + '_username'];
            if (items[website + '_limitByWeekday']) {
                document.getElementById(website + '.limitByWeekDay').value = 'dayOfWeek';
            }
            else {
                document.getElementById(website + '.limitByWeekDay').value = 'day';
            }
            restore_day_limits(website, document.getElementById(website + '.limitByWeekDay').value);
        }
    });
}

async function save_options() {
    const dayStartTime = document.getElementById('dayStartTime').value;
    const dayStartTimeHours = dayStartTime.match(/(\d{2}):(\d{2})/)[1];
    const dayStartTimeMinutes = dayStartTime.match(/(\d{2}):(\d{2})/)[2];

    const saveButton = document.getElementById('save');
    saveButton.disabled = true;

    for (const website of WEBSITES) {
        let username = document.getElementById(website + '.username').value;
        const limitByWeekDay = document.getElementById(website + '.limitByWeekDay').value == 'dayOfWeek';
        const gamesPerDay = {
            1: document.getElementById(website + '.gamesPerDayMonday').value,
            2: document.getElementById(website + '.gamesPerDayTuesday').value,
            3: document.getElementById(website + '.gamesPerDayWednesday').value,
            4: document.getElementById(website + '.gamesPerDayThursday').value,
            5: document.getElementById(website + '.gamesPerDayFriday').value,
            6: document.getElementById(website + '.gamesPerDaySaturday').value,
            0: document.getElementById(website + '.gamesPerDaySunday').value,
        };
        if (!limitByWeekDay) {
            gamesPerDay[0] = document.getElementById(website + '.gamesPerDay').value;
            gamesPerDay[1] = document.getElementById(website + '.gamesPerDay').value;
            gamesPerDay[2] = document.getElementById(website + '.gamesPerDay').value;
            gamesPerDay[3] = document.getElementById(website + '.gamesPerDay').value;
            gamesPerDay[4] = document.getElementById(website + '.gamesPerDay').value;
            gamesPerDay[5] = document.getElementById(website + '.gamesPerDay').value;
            gamesPerDay[6] = document.getElementById(website + '.gamesPerDay').value;
        }
        
        if (oldUsernames[website] != username) {
            let isUsernameValid = await usernameValidators[website](username);
            if (!isUsernameValid) {
                alert(`username "${username}" doesn't exist in ${WEBSITES_NAMES[website]}`);
                username = '';
            }
        }

        oldUsernames[website] = username;
        document.getElementById(website + '.username').value = username;

        await chrome.storage.sync.set({
            dayStartTimeHours: dayStartTimeHours,
            dayStartTimeMinutes: dayStartTimeMinutes,
            [website + '_username']: username,
            [website + '_limitByWeekday']: limitByWeekDay,
            [website + '_gamesPerDay']: gamesPerDay,
        });
    }

    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
        status.textContent = '';
        saveButton.disabled = false;
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    for (const website of WEBSITES) {
        document.getElementById(website + '.limitByWeekDay').addEventListener('change', (event) => { restore_day_limits(website, event.target.value); });
    }
    restore_options();
});
document.getElementById('save').addEventListener('click', save_options);
