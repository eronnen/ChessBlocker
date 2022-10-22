function save_options() {
    var chesscomUsername = document.getElementById('chesscom.username').value;
    var chesscomGamesPerDay = document.getElementById('chesscom.gamesPerDay').value;
    var saveButton = document.getElementById('save');
    saveButton.disabled = true;

    chrome.storage.sync.set({
        options_chesscom_username: chesscomUsername,
        options_chesscom_gamesPerDay: chesscomGamesPerDay,
    }, function() {
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
            saveButton.disabled = false;
        }, 750);
    });
}

function restore_options() {
    chrome.storage.sync.get({
        options_chesscom_username: '',
        options_chesscom_gamesPerDay: 10
    }, function(items) {
        document.getElementById('chesscom.username').value = items.options_chesscom_username;
        document.getElementById('chesscom.gamesPerDay').value = items.options_chesscom_gamesPerDay;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
