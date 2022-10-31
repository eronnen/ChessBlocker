
function waitForElementToExist(id, selector = null) {
    return new Promise(resolve => {
        element = id != null ? document.getElementById(id) : document.querySelector(selector);
        if (element) {
            return resolve(element);
        }

        const observer = new MutationObserver(mutations => {
            element = id != null ? document.getElementById(id) : document.querySelector(selector)
            if (element) {
                resolve(element);
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

let g_last2DaysGamesTimesPromise = null;

function playButtonHandler(event, website, is_liveChallenge_link) {
    if (event.created_by_chess_blocker) {
        return;
    }

    console.debug('ChessBlocker: Clicked on play');
    const target = event.target;
    event.preventDefault();
    event.stopPropagation();
    
    async function reclickButton() {
        if (is_liveChallenge_link) {
            await chrome.runtime.sendMessage(chrome.runtime.id, {
                type: 'allow-liveChallenge-link',
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

    Promise.all([chessBlockerOptionsPromise, g_last2DaysGamesTimesPromise]).then(([items, last2DaysGamesTimes]) => {
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
        const dayStartEpoch = dayStart.getTime() / 1000;

        // TODO: avoid code duplication
        if ((   currentDate.getHours() < items.dayStartTimeHours || (currentDate.getHours() == items.dayStartTimeHours && currentDate.getMinutes() < dayStartTimeMinutes)) &&
                items.dayStartTimeHours < 7) {
            // late night hours before limit - consider as previous day still
            currentDate.setDate(currentDate.getDate() - 1);
        }
        const gamesPerToday = (items[website + "_gamesPerDay"])[currentDate.getDay()];

        const numberOfGamesPlayed = last2DaysGamesTimes.filter((t) => t > dayStartEpoch).length;
        if (numberOfGamesPlayed >= gamesPerToday) {
            // limit reached
            console.debug(`you reached your daily games limit! you played ${numberOfGamesPlayed}/${gamesPerToday} games`);
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
