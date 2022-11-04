// getting games only for last days, since we don't cache values in lichess

async function getLichessPlayerLastDayGamesTimes(items) {
    if (!items.lichess_username) {
        console.debug('ChessBlocker: no lichess.org username configured');
        return [];
    }

    const dayStartEpochMillis = getDayStart(new Date(), items.dayStartTimeHours, items.dayStartTimeMinutes).getTime();
    console.debug('ChessBlocker: fetching lichess.org games for ' + items.lichess_username);
    // TODO: add max=
    const response = await fetch(`https://lichess.org/api/games/user/${items.lichess_username}?since=${dayStartEpochMillis}&moves=false`, 
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
            console.debug(event.target.textContent);
            const targetLpoolsElement = event.target.closest('.lpools');
            if (targetLpoolsElement != null && targetLpoolsElement != event.target) {
                // click in one of the pool time controls
                playButtonHandler(event, 'lichess', false, getLichessPlayerLastDayGamesTimes);
            }
        }, true);
    }
}

console.debug('ChessBlocker initialize');
initializeChessBlocker();
console.debug('ChessBlocker done');
