
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

function getLast2DaysEpochMillis(date) {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    date.setDate(date.getDate() - 1);
    return date.getTime();
}

function getDayStart(date, dayStartTimeHours, dayStartTimeMinutes) {
    const copyDate = new Date(date);
    if ((   copyDate.getHours() < dayStartTimeHours || (copyDate.getHours() == dayStartTimeHours && copyDate.getMinutes() < dayStartTimeMinutes)) &&
            dayStartTimeHours < 12) {
        // late night hours before limit - consider as previous day still
        copyDate.setDate(copyDate.getDate() - 1);
    }

    copyDate.setHours(dayStartTimeHours);
    copyDate.setMinutes(dayStartTimeMinutes);

    return copyDate;
}

function getActualWeekDayByDate(date, dayStartTimeHours, dayStartTimeMinutes) {
    // returns the actual date according to dayStartTimeHours/dayStartTimeMinutes values
    const dayStart = getDayStart(date, dayStartTimeHours, dayStartTimeMinutes);

    // if current time is before day start (meaning next day starts at the evening) 
    // then increment day because it was started in the before evening (wednesday night => thursday)
    if (date < dayStart) {
        dayStart.setDate(dayStart.getDate() + 1);
    }

    return dayStart.getDay();
}

function playButtonHandler(event, website, is_new_game_link, getPreviousGamesTimesPromise) {
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
        [website + "_username"]: '',
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

    chessBlockerOptionsPromise.then((items) => {
        previousGamesTimesPromise = getPreviousGamesTimesPromise(items);
        return Promise.all([Promise.resolve(items), previousGamesTimesPromise]);
    }).then(([items, previousGamesTimes]) => {
        if (!items || !previousGamesTimes) {
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

        const numberOfGamesPlayed = previousGamesTimes.filter((t) => t > dayStartEpochMillis).length;
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
