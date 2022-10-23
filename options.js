let chesscomOldUsername = '';

function restore_options() {
    chrome.storage.sync.get({
        options_chesscom_username: '',
        options_chesscom_gamesPerDay: 10,
        options_dayStartTimeHours: 3,
        options_dayStartTimeMinutes: 30
    }, function(items) {
        chesscomOldUsername = items.options_chesscom_username;
        document.getElementById('chesscom.username').value = items.options_chesscom_username;
        document.getElementById('chesscom.gamesPerDay').value = items.options_chesscom_gamesPerDay;
        document.getElementById('dayStartTime').value = `${items.options_dayStartTimeHours.toString().padStart(2,0)}:${items.options_dayStartTimeMinutes.toString().padStart(2,0)}`;
    });
}

function save_options() {
    let chesscomUsername = document.getElementById('chesscom.username').value;
    const chesscomGamesPerDay = document.getElementById('chesscom.gamesPerDay').value;
    const dayStartTime = document.getElementById('dayStartTime').value;
    const dayStartTimeHours = dayStartTime.match(/(\d{2}):(\d{2})/)[1]; 
    const dayStartTimeMinutes = dayStartTime.match(/(\d{2}):(\d{2})/)[2]; 
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
            options_chesscom_username: chesscomUsername,
            options_chesscom_gamesPerDay: chesscomGamesPerDay,
            options_dayStartTimeHours: dayStartTimeHours,
            options_dayStartTimeMinutes: dayStartTimeMinutes
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

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
