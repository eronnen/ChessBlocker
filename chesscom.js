async function getPlayerLast2DaysGamesTimes(username) {
    // TODO: update if chess.com supports smaller units then month
    // TODO: solve edge case in the new day of a month?
    
    //console.debug('username: ' + username);
    if (!username) {
        return [];
    }

    let currentDate = new Date();
    const response = await fetch(`https://api.chess.com/pub/player/${username}/games/${currentDate.getFullYear()}/${(currentDate.getMonth() + 1).toString().padStart(2,0)}`, {method: 'GET', headers: {'Accept': 'application/json'}});
    const responseJson = await response.json();
    
    // set currentDate to the start of last day
    currentDate.setHours(0);
    currentDate.setMinutes(0);
    currentDate.setSeconds(0);
    currentDate.setMilliseconds(0);
    currentDate.setDate(currentDate.getDate() - 1);
    const last2DaysEpoch = currentDate.getTime() / 1000;
    
    //console.debug('got total ' + responseJson.length + ' monthly games');
    return responseJson["games"].filter((g) => g['end_time'] >= last2DaysEpoch).map((g) => g['end_time']);
}

const chessBlockerOptionsPromise = chrome.storage.sync.get({
    options_chesscom_username: '',
    options_chesscom_gamesPerDay: 10,
    options_dayStartTimeHours: 3,
    options_dayStartTimeMinutes: 30
});

const last2DaysGamesTimesPromise = chessBlockerOptionsPromise.then(
    (items) => getPlayerLast2DaysGamesTimes(items.options_chesscom_username)
);

const PLAY_BUTTONS_TEXTS = [ /^Play$/, /^New (\d+) min$/, /^Play (\d+) min$/]
function playButtonHandler(event) {
    if (event.created_by_chess_blocker)
        return;

    console.debug('Clicked on play');
    const target = event.target;
    const type = event.type;
    event.preventDefault();
    event.stopPropagation();

    function reclickButton() {
        let restoredEvent = new event.constructor(type, event);
        restoredEvent.created_by_chess_blocker = true;
        target.dispatchEvent(restoredEvent);
    }

    Promise.all([chessBlockerOptionsPromise, last2DaysGamesTimesPromise]).then(([items, last2DaysGamesTimes]) => {
        const currentTime = new Date();
        let dayStart = new Date(currentTime.getTime());
        dayStart.setHours(items.options_dayStartTimeHours);
        dayStart.setMinutes(items.options_dayStartTimeMinutes);
        dayStart.setSeconds(0);
        dayStart.setMilliseconds(0);
        if (dayStart > currentTime) {
            dayStart.setDate(dayStart.getDate() - 1);
        }
        const dayStartEpoch = dayStart.getTime() / 1000;

        //console.debug('total games played last 2 days: ' + last2DaysGamesTimes.length);
        //console.debug('dayStart: ' + dayStart);
        const numberOfGamesPlayed = last2DaysGamesTimes.filter((t) => t > dayStartEpoch).length;
        if (numberOfGamesPlayed >= items.options_chesscom_gamesPerDay) {
            // limit reached
            console.debug(`you reached your daily games limit! you played ${numberOfGamesPlayed}/${items.options_chesscom_gamesPerDay} games`);
        }
        else {
            console.debug(`you played ${numberOfGamesPlayed}/${items.options_chesscom_gamesPerDay} games today`);
            reclickButton();
        }
    }).catch((e) => {
        console.error(`ChessBlocker error: ${e.message}`);
        reclickButton();
    });
}

function addPlayButtonsHandler(tags) {
    for (let i = 0;  i < tags.length; i++) {
        for (const t of PLAY_BUTTONS_TEXTS) {
            if (tags[i].innerText.match(t)) {
                tags[i].addEventListener('click', playButtonHandler, true);
            }
        }
    }
}

const buttonTags = document.getElementsByTagName("button");
const aTags = document.getElementsByTagName("a");

addPlayButtonsHandler(aTags);
addPlayButtonsHandler(buttonTags);
