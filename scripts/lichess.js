async function getLichessPlayerLast2DaysGamesTimes(username) {
    if (!username) {
        console.debug('ChessBlocker: no lichess.org username configured');
        return [];
    }

    const last2DaysEpochMillis = getLast2DaysEpochMillis(new Date());
    console.debug('ChessBlocker: fetching lichess.org games for ' + username);
    const response = await fetch(`https://lichess.org/api/games/user/${username}?since=${last2DaysEpochMillis}&moves=false`, {method: 'GET', headers: {'Accept': 'application/x-ndjson'}});
    console.debug('ChessBlocker: done fetching');
    const responseText = await response.text();
    console.debug('ChessBlocker: done getting response text');
    
    if (!responseText) {
        return [];
    }
    
    const gamesJsonTexts = responseText.split('\n');
    let gameTimes = [];
    for (const gameJsonText of gamesJsonTexts) {
        if (!gameJsonText) {
            continue;
        }
        
        const gameJson = JSON.parse(gameJsonText);
        if (!gameJson["createdAt"]) {
            console.warn("ChessBlocker: got lichess game without createdAt");
            continue;
        }
        
        gameTimes.push(gameJson["createdAt"]);
    }
    console.debug('ChessBlocker: done parsing ndjson ' + gameTimes.length);

    return gameTimes;
}

let g_lichessUsernamePromise = chrome.storage.sync.get({
    lichess_username: ''
});

async function getLast2DaysGamesTimesPromise() {
    return g_lichessUsernamePromise.then(
        (items) => getLichessPlayerLast2DaysGamesTimes(items.lichess_username)
    );
}

async function initializeChessBlocker() {
    const pagePath = document.location.pathname;
    if (pagePath == '/') {
        // home: quick pairing,
        const lobbyElement = await waitForElementToExist(null, 'main');
        if (!lobbyElement) {
            throw new Error('Didnt find lobby in home page');
        }

        lobbyElement.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) {
                return;
            }

            console.debug('lichess click');
            console.debug(event.target);
            const targetLpoolsElement = event.target.closest('.lpools');
            if (targetLpoolsElement != null && targetLpoolsElement != event.target) {
                // click in one of the pool time controls
                playButtonHandler(event, 'lichess', false, getLast2DaysGamesTimesPromise);
            }
        }, true);
    }
}

console.debug('ChessBlocker initialize');
initializeChessBlocker();
console.debug('ChessBlocker done');
