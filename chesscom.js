async function getPlayerLast2DaysGamesTimes(username) {
    // TODO: update if chess.com supports smaller units then month
    // TODO: solve edge case in the new day of a month?
    
    if (!username) {
        console.debug('ChessBlocker: no chess.com username configured');
        return [];
    }

    let currentDate = new Date();
    console.debug('ChessBlocker: fetching chess.com games for ' + username);
    const response = await fetch(`https://api.chess.com/pub/player/${username}/games/${currentDate.getFullYear()}/${(currentDate.getMonth() + 1).toString().padStart(2,0)}`, {method: 'GET', headers: {'Accept': 'application/json'}});
    console.debug('ChessBlocker: done fetching');
    const responseJson = await response.json();
    
    // set currentDate to the start of last day
    currentDate.setHours(0);
    currentDate.setMinutes(0);
    currentDate.setSeconds(0);
    currentDate.setMilliseconds(0);
    currentDate.setDate(currentDate.getDate() - 1);
    const last2DaysEpoch = currentDate.getTime() / 1000;
    
    return responseJson["games"].filter((g) => g['end_time'] >= last2DaysEpoch).map((g) => g['end_time']);
}

let g_chessComUsernamePromise = chrome.storage.sync.get({
    options_chesscom_username: ''
});

function getLast2DaysGamesTimesPromise() {
    return g_chessComUsernamePromise.then(
        (items) => getPlayerLast2DaysGamesTimes(items.options_chesscom_username)
    );
}

let g_last2DaysGamesTimesPromise = null;
function reinitializeChessBlockerData(delayMs = 0) {
    // TODO: initialize based on time
    if (delayMs == 0) {
        g_last2DaysGamesTimesPromise = getLast2DaysGamesTimesPromise();
    }
    else {
        delayPromise = new Promise(resolve => setTimeout(resolve, delayMs));
        g_last2DaysGamesTimesPromise = delayPromise.then(() => getLast2DaysGamesTimesPromise());
    }
}

function playButtonHandler(event) {
    if (event.created_by_chess_blocker) {
        console.debug('got event created_by_chess_blocker');
        return;
    }

    console.debug('ChessBlocker: Clicked on play');
    console.log(event);
    const target = event.target;
    event.preventDefault();
    event.stopPropagation();
    
    function reclickButton() {
        restoredEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        });
        restoredEvent.created_by_chess_blocker = true;
        target.dispatchEvent(restoredEvent);
    }

    chessBlockerOptionsPromise = chrome.storage.sync.get({
        options_chesscom_gamesPerDay: 10,
        options_dayStartTimeHours: 3,
        options_dayStartTimeMinutes: 30
    });

    Promise.all([chessBlockerOptionsPromise, g_last2DaysGamesTimesPromise]).then(([items, last2DaysGamesTimes]) => {
        if (!items || !last2DaysGamesTimes) {
            throw new Error('ChessBlocker data not initialized');
        }

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

function addPlayButtonHandlerWithPattern(parent, tag, buttonPattern) {
    for (const e of parent.querySelectorAll(tag)) {
        if (e instanceof Element && e.textContent.match(buttonPattern)) {
            e.addEventListener('click', playButtonHandler, true);
            return true;
        }
    }
}

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

async function initializeChessBlocker() {
    const pagePath = document.location.pathname;
    if (pagePath == '/home') {
        // home: only "Play x min" link
        reinitializeChessBlockerData();
        await waitForElementToExist(null, '.play-quick-links-link');
        if (!addPlayButtonHandlerWithPattern(document, "a", /^\s*Play (\d+) min\s*$/)) {
            console.error("Didn't find play button in home page");
        }
    }
    else if (pagePath.startsWith('/game/live') || pagePath.startsWith('/play/online')) {
        // game link - "new x min" button appears when game ends, and there is a play button in the "New Game" tab
        reinitializeChessBlockerData();
        const sideBarElement = await waitForElementToExist("board-layout-sidebar");
        if (!sideBarElement) {
            throw new Error('Didnt find sidebar on live game');
        }

        sideBarElement.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) {
                return;
            }

            if (!event.target.tagName == 'BUTTON') {
                return;
            }

            if (event.target.textContent.match(/^\s*New (\d+) min\s*$/)) {
                playButtonHandler(event);
            }
            else if (event.target.textContent.match(/^\s*Play\s*$/)) {
                playButtonHandler(event);
            }
        }, true);

        const sidebarObserver = new MutationObserver((mutationList, observer) => {
            for (const mutation of mutationList) {
                if (mutation.type != "childList") {
                    continue;
                }

                if (mutation.target.children.length > 0) {
                    // consider only the leaves of the DOM, in order to avoid duplication of text change
                    continue;
                }

                for (const removedNode of mutation.removedNodes) {
                    if (removedNode.data == 'Play') {
                        // game was in play, now finished
                        console.debug('ChessBlocker: chess.com game is finished');

                        // wait for chess.com to update last game data hopefully. TODO: remove delay?
                        reinitializeChessBlockerData(1500); 
                    }
                }
            }
        });
        sidebarObserver.observe(sideBarElement, {childList: true, subtree: true});
    }
}

console.debug('ChessBlocker initialize');
initializeChessBlocker();
console.debug('ChessBlocker done');
