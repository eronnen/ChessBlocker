// getting games only for last days, since we don't cache values in lichess

async function getLichessPlayerLastDayGamesTimes(items) {
    if (!items.lichess_username) {
        console.debug('ChessBlocker: no lichess.org username configured');
        return [];
    }

    const currentDate = new Date();
    const gamesLimitPerToday = items.lichess_gamesPerDay[getActualWeekDayByDate(currentDate, items.dayStartTimeHours, items.dayStartTimeMinutes)];
    const dayStartEpochMillis = getDayStart(currentDate, items.dayStartTimeHours, items.dayStartTimeMinutes).getTime();
    console.debug('ChessBlocker: fetching lichess.org games for ' + items.lichess_username);
    const response = await fetch(`https://lichess.org/api/games/user/${items.lichess_username}?since=${dayStartEpochMillis}&max=${gamesLimitPerToday}&moves=false`, 
        {method: 'GET', headers: {'Accept': 'application/x-ndjson'}});
    console.debug('ChessBlocker: done fetching');

    async function* readResponseLines() {
        const utf8Decoder = new TextDecoder('utf-8');
        const responseReader = response.body.getReader();
        let { value: chunk, done: readerDone } = await responseReader.read();

        while (true) {
            // assuming chunks don't end mid-json
            if (chunk) {
                let currentIndex = 0;
                while (currentIndex < chunk.length) {
                    const nextLineEndingIndex = chunk.indexOf('\n'.charCodeAt(), currentIndex);
                    if (nextLineEndingIndex == -1) {
                        console.error("ChessBlocker: got chunk without new line");
                        break;
                    }

                    yield utf8Decoder.decode(chunk.slice(currentIndex, nextLineEndingIndex));
                    currentIndex = nextLineEndingIndex + 1;
                }
            }

            if (readerDone) {
                break;
            }

            ({ value: chunk, done: readerDone } = await responseReader.read());
        }
    }
    
    let gameTimes = [];
    for await (const gameJsonText of readResponseLines()) {
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

function addListenersToPoolElements(parentElement) {
    if (parentElement.classList.contains('lobby__app-pools')) {
        const poolElement = parentElement.querySelector('.lpools');
        if (!poolElement) {
            console.error('ChessBlocker: didnt find pool element in added node');
            return;
        }

        poolElement.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) {
                return;
            }

            const targetPoolButton = event.target.closest('div[data-id]');
            if (targetPoolButton != null && targetPoolButton.innerText != 'Custom') {
                // click in one of the pool time controls
                playButtonHandler(event, 'lichess', false, getLichessPlayerLastDayGamesTimes);
            }
        }, true);
    }
    else if (parentElement.classList.contains('lobby__app-real_time')) {
        parentElement.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) {
                return;
            }
;
            const targetChallengeRow = event.target.closest('tr.join');
            if (!targetChallengeRow) {
                return;
            }
            
            playButtonHandler(event, 'lichess', false, getLichessPlayerLastDayGamesTimes);
        }, true);
    }
}

async function initializeChessBlocker() {
    const pagePath = document.location.pathname;
    if (pagePath == '/') {
        // home: quick pairing, Lobby

        // observing everything because the user can switch between quick pairing and lobby
        const poolMenuObserver = new MutationObserver((mutationList) => {
            for (const mutation of mutationList) {
                for (const addedNode of mutation.addedNodes) {
                    if (!(addedNode instanceof Element)) {
                        continue;
                    }

                    addListenersToPoolElements(addedNode);
                }
            }
        });
        
        const lobbyElement = await waitForElementToExist(null, 'main');
        if (!lobbyElement) {
            throw new Error('ChessBlocker: Didnt find lobby in home page');
        }

        // add listeners to existing elements before observing
        for (const child of lobbyElement.children) {
            addListenersToPoolElements(child);
        }
        poolMenuObserver.observe(lobbyElement, {childList: true, subtree: false});

        // observe the "Create A Game dialog"
        const createGameObserver = new MutationObserver((mutationList) => {
            for (const mutation of mutationList) {
                for (const addedNode of mutation.addedNodes) {
                    if (!(addedNode instanceof Element)) {
                        continue;
                    }

                    if (addedNode.id == 'modal-overlay') {
                        // opened a "Create A Game dialog"
                        
                        const submitTray = addedNode.querySelector('div.color-submits');
                        const timeControlSelect = addedNode.querySelector('#sf_timeMode');
                        if (!submitTray || !timeControlSelect) {
                            console.error('ChessBlocker: Didnt find submit tray or time control');
                            continue;
                        }

                        submitTray.addEventListener('click', (event) => {
                            if (!(event.target instanceof Element)) {
                                return;
                            }

                            const colorButton = event.target.closest('button.color-submits__button');
                            if (!colorButton) {
                                return; // not press on button
                            }

                            if (timeControlSelect.value != 'realTime') {
                                console.debug('ChessBlocker: allowing to play non realTime game');
                                return;
                            }
                            
                            playButtonHandler(event, 'lichess', false, getLichessPlayerLastDayGamesTimes);
                        }, true);
                    }
                }
            }
        });

        const lobbyTableElement = await waitForElementToExist(null, 'div.lobby__table');
        createGameObserver.observe(lobbyTableElement, {childList: true, subtree: false});
    }
}

console.debug('ChessBlocker initialize');
initializeChessBlocker();
console.debug('ChessBlocker done');