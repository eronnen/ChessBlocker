
function waitForElementToExist(id, selector = null) {
    return new Promise(resolve => {
        element = id != null ? document.getElementById(id) : document.querySelector(selector);
        if (element) {
            return resolve(element);
        }

        const observer = new MutationObserver(mutations => {
            element = id != null ? document.getElementById(id) : document.querySelector(selector)
            if (element) {
                observer.disconnect();
                return resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function getLast2DaysEpochMillis(currentDate) {
    currentDate.setHours(0);
    currentDate.setMinutes(0);
    currentDate.setSeconds(0);
    currentDate.setMilliseconds(0);
    currentDate.setDate(currentDate.getDate() - 1);
    return currentDate.getTime();
}

function getActualWeekDayByDate(date, dayStartTimeHours, dayStartTimeMinutes) {
    // returns the actual date according to dayStartTimeHours/dayStartTimeMinutes values

    const copyDate = new Date(date);
    if ((   copyDate.getHours() < dayStartTimeHours || (copyDate.getHours() == dayStartTimeHours && copyDate.getMinutes() < dayStartTimeMinutes)) &&
            dayStartTimeHours < 7) {
        // late night hours before limit - consider as previous day still
        copyDate.setDate(copyDate.getDate() - 1);
    }

    return copyDate.getDay()
}

function playButtonHandler(event, website, is_new_game_link, getLast2DaysGamesTimesPromise) {
    if (event.created_by_chess_blocker) {
        return;
    }

    console.debug('ChessBlocker: Clicked on play');
    const target = event.target;
    event.preventDefault();
    event.stopPropagation();
    
    async function reclickButton() {
        if (is_new_game_link) {
            await chrome.runtime.sendMessage(chrome.runtime.id, {
                type: 'allow-new-game-link',
                website: website
            });
        }

        restoredEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        });
        restoredEvent.created_by_chess_blocker = true;
        target.dispatchEvent(restoredEvent);
    }

    chessBlockerOptionsPromise = chrome.storage.sync.get({
        dayStartTimeHours: 3,
        dayStartTimeMinutes: 30,
        [website + "_gamesPerDay"]: {
            0: 10,
            1: 10,
            2: 10,
            3: 10,
            4: 10,
            5: 10,
            6: 10,
        },
    });

    Promise.all([chessBlockerOptionsPromise, getLast2DaysGamesTimesPromise()]).then(([items, last2DaysGamesTimes]) => {
        if (!items || !last2DaysGamesTimes) {
            throw new Error('ChessBlocker data not initialized');
        }

        let currentDate = new Date();
        let dayStart = new Date(currentDate.getTime());
        dayStart.setHours(items.dayStartTimeHours);
        dayStart.setMinutes(items.dayStartTimeMinutes);
        dayStart.setSeconds(0);
        dayStart.setMilliseconds(0);
        if (dayStart > currentDate) {
            dayStart.setDate(dayStart.getDate() - 1);
        }
        
        const dayStartEpochMillis = dayStart.getTime();
        const gamesPerToday = (items[website + "_gamesPerDay"])[getActualWeekDayByDate(currentDate, items.dayStartTimeHours, items.dayStartTimeMinutes)];

        const numberOfGamesPlayed = last2DaysGamesTimes.filter((t) => t > dayStartEpochMillis).length;
        if (numberOfGamesPlayed >= gamesPerToday) {
            // limit reached
            console.debug(`you reached your daily games limit! you played ${numberOfGamesPlayed}/${gamesPerToday} games`);
            console.debug(`setting ${website + 'games_played_today'} = ${numberOfGamesPlayed}`);
            chrome.storage.sync.set({
                [website + "_games_played_today"]: numberOfGamesPlayed
            }).then(() => {
                chrome.runtime.sendMessage(chrome.runtime.id, {
                    type: 'limit',
                    website: website,
                    numberOfGamesPlayed: numberOfGamesPlayed
                });
            });
        }
        else {
            console.debug(`you played ${numberOfGamesPlayed}/${gamesPerToday} games today`);
            reclickButton();
        }
    }).catch((e) => {
        console.error(`ChessBlocker error: ${e.message}`);
        reclickButton();
    });
}

function addPlayButtonHandlerWithPattern(parent, tag, buttonPattern, handler) {
    for (const e of parent.querySelectorAll(tag)) {
        if (e instanceof Element && e.textContent.match(buttonPattern)) {
            console.debug(`ChessBlocker: hooking ${e.textContent} button`);
            e.addEventListener('click', handler, true);
            return true;
        }
    }
}
