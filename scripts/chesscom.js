async function getPlayerLast2DaysGamesTimes(username) {
    // TODO: update if chess.com supports smaller units then month
    
    if (!username) {
        console.debug('ChessBlocker: no chess.com username configured');
        return [];
    }
    
    let currentDate = new Date();
    
    // TODO: solve edge case in the first day of a month and retrieve for previous month too
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
    
    if (!responseJson["games"]) {
        return []
    }
    return responseJson["games"].filter((g) => g['end_time'] >= last2DaysEpoch).map((g) => g['end_time']);
}

let g_chessComUsernamePromise = chrome.storage.sync.get({
    chesscom_username: ''
});

function getLast2DaysGamesTimesPromise() {
    return g_chessComUsernamePromise.then(
        (items) => getPlayerLast2DaysGamesTimes(items.chesscom_username)
    );
}

function reinitializeChessBlockerData(delayMs = 0) {
    if (delayMs == 0) {
        g_last2DaysGamesTimesPromise = getLast2DaysGamesTimesPromise();
    }
    else {
        delayPromise = new Promise(resolve => setTimeout(resolve, delayMs));
        g_last2DaysGamesTimesPromise = delayPromise.then(() => getLast2DaysGamesTimesPromise());
    }
}

async function waitForSideBarAndAddListener() {
    const sideBarElement = await waitForElementToExist("board-layout-sidebar");
    if (!sideBarElement) {
        throw new Error('Didnt find sidebar on live game');
    }

    sideBarElement.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }

        let closestButton = event.target.closest('button');
        if (closestButton == null) {
            closestButton = event.target.closest('a');
            if (closestButton == null) {
                // not a button or a link
                return;
            }
        }

        const buttonText = closestButton.textContent;
        if (buttonText.match(/^\s*New (\d+) min\s*$/)) {
            playButtonHandler(event, "chesscom", false);
        }
        else if (buttonText.match(/^\s*Play\s*$/)) {
            playButtonHandler(event, "chesscom", false);
        }
        else if (buttonText.match(/^\s*New (\d+) min rated\s*$/)) {
            playButtonHandler(event, "chesscom", false);
        }
    }, true);

    return sideBarElement;
}

async function initializeChessBlocker() {
    const pagePath = document.location.pathname;
    if (pagePath == '/home') {
        // home: only "Play x min" link
        reinitializeChessBlockerData();
        await waitForElementToExist(null, '.play-quick-links-title');
        if (!addPlayButtonHandlerWithPattern(document, "a", /^\s*Play (\d+) min\s*$/, (event) => {
            playButtonHandler(event, "chesscom", true);
        })) {
            console.error("Didn't find play button in home page");
        }
    }
    else if (pagePath.startsWith('/game/live') || pagePath.startsWith('/play/online')) {
        // game link - "new x min" button appears when game ends, and there is a play button in the "New Game" tab
        if (pagePath.startsWith('/play/online/new')) {
            // allow only from chess.com link handler
            chrome.runtime.sendMessage(chrome.runtime.id, {
                type: 'disallow-liveChallenge-link',
            })
        }

        reinitializeChessBlockerData();
        const sideBarElement = await waitForSideBarAndAddListener();

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
    else if (pagePath.startsWith('/live')) {
        // old live link - "Play" button on sidebar and "New x min" link in the chat on button
        console.debug('live');
        reinitializeChessBlockerData();
        const sideBarElement = await waitForSideBarAndAddListener();
        const boardLayoutElement = document.getElementById('board-layout-chessboard');
        const gameDialogObserver = new MutationObserver((mutationList, observer) => {
            for (const mutation of mutationList) {
                if (mutation.type != "childList") {
                    continue;
                }

                for (const addedNode of mutation.addedNodes) {
                    if (addedNode instanceof Element && addedNode.className.includes('board-dialog-component')) {
                        // game was in play, now finished
                        console.debug('ChessBlocker: chess.com game is finished');

                        // wait for chess.com to update last game data hopefully. TODO: remove delay?
                        reinitializeChessBlockerData(1500);
                        if (!addPlayButtonHandlerWithPattern(addedNode, "button", /^\s*New (\d+) min\s*$/), (event) => {
                            playButtonHandler(event, "chesscom", false);
                        }) {
                            console.error("Didn't find play button in game over dialog");
                        }
                    }
                }
            }
        });
        console.debug('gameDialogObserver');
        gameDialogObserver.observe(boardLayoutElement, {childList: true, subtree: true});
    }
}

console.debug('ChessBlocker initialize');
initializeChessBlocker();
console.debug('ChessBlocker done');
