import { LICHESS } from '../common/constants';
import { addLoadingAnimation, waitForElementToExist, playButtonHandler } from '../common/chess_site_hook';
import { getDayStart, getActualWeekDayByDate } from '../common/date_utils';
import { getLichessGames, readLichessGamesResponseLines } from '../common/lichess_api';

// getting games only for last days, since we don't cache values in lichess

async function getLichessPlayerLastDayGamesTimes(items: ChessBlockerConfigType): Promise<number[]> {
    const username = items[LICHESS]!.username;
    if (!username) {
        console.debug('ChessBlocker: no lichess.org username configured');
        return [];
    }

    const removeLoadingAnimation = addLoadingAnimation();

    const currentDate = new Date();
    const gamesLimitPerToday = items[LICHESS]!.gamesPerDay![getActualWeekDayByDate(currentDate, items.dayStartTimeHours!, items.dayStartTimeMinutes!)];
    const dayStartDate = getDayStart(currentDate, items.dayStartTimeHours!, items.dayStartTimeMinutes!);
    
    console.debug('ChessBlocker: fetching lichess.org games for ' + username);
    const response = await getLichessGames(username, dayStartDate, gamesLimitPerToday);
    console.debug('ChessBlocker: done fetching');
    
    const gameTimes: number[] = [];
    for await (const gameJsonText of readLichessGamesResponseLines(response)) {
        const gameJson: object = JSON.parse(gameJsonText);
        if (!("createdAt" in gameJson)) {
            console.warn("ChessBlocker: got lichess game without createdAt");
            continue;
        }
        
        gameTimes.push(parseInt(gameJson["createdAt"] as string));
    }
    console.debug('ChessBlocker: done parsing ndjson ' + gameTimes.length);
    removeLoadingAnimation();

    return gameTimes;
}

function addListenersToPoolElements(parentElement: HTMLElement) {
    if (parentElement.classList.contains('lobby__app-pools')) {
        const poolElement = parentElement.querySelector('.lpools') as HTMLElement;
        if (!poolElement) {
            console.error('ChessBlocker: didnt find pool element in added node');
            return;
        }

        poolElement.addEventListener('click', (event: MouseEvent) => {
            if (!(event.target instanceof Element)) {
                return;
            }

            const targetPoolButton = event.target.closest('div[data-id]') as HTMLElement;
            if (targetPoolButton != null && targetPoolButton.innerText != 'Custom') {
                // click in one of the pool time controls
                playButtonHandler(event, LICHESS, false, getLichessPlayerLastDayGamesTimes);
            }
        }, true);
    }
    else if (parentElement.classList.contains('lobby__app-real_time')) {
        parentElement.addEventListener('click', (event: MouseEvent) => {
            if (!(event.target instanceof Element)) {
                return;
            }

            const targetChallengeRow = event.target.closest('tr.join');
            if (!targetChallengeRow) {
                return;
            }
            
            playButtonHandler(event, LICHESS, false, getLichessPlayerLastDayGamesTimes);
        }, true);
    }
}

function addListenersToRightControl(finishedGameElement: HTMLElement) {
    if (!finishedGameElement.classList.contains('follow-up')) {
        return;
    }

    for (const newGameLink of finishedGameElement.querySelectorAll('a.fbt')) {
        if ((newGameLink as HTMLElement).innerText.toLowerCase() == 'new opponent') {
            (newGameLink as HTMLElement).addEventListener('click', (event: MouseEvent) => {
                playButtonHandler(event, LICHESS, true, getLichessPlayerLastDayGamesTimes);
            }, true);
        }
    }
}

async function initializeChessBlocker() {
    const pagePath = document.location.pathname;
    if (pagePath == '/') {
        // home: quick pairing, Lobby
        
        // disallow again
        chrome.runtime.sendMessage(chrome.runtime.id, {
            type: 'disallow-new-game-link',
            website: LICHESS
        });

        // observing everything because the user can switch between quick pairing and lobby
        const poolMenuObserver = new MutationObserver((mutationList) => {
            for (const mutation of mutationList) {
                for (const addedNode of mutation.addedNodes) {
                    if (!(addedNode instanceof Element)) {
                        continue;
                    }

                    addListenersToPoolElements(addedNode as HTMLElement);
                }
            }
        });
        
        const lobbyElement = await waitForElementToExist(undefined, 'main');
        if (!lobbyElement) {
            throw new Error('ChessBlocker: Didnt find lobby in home page');
        }

        // add listeners to existing elements before observing
        for (const child of lobbyElement.children) {
            addListenersToPoolElements(child as HTMLElement);
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
                        
                        const submitTray = addedNode.querySelector('div.color-submits') as HTMLElement;
                        const timeControlSelect = addedNode.querySelector('#sf_timeMode') as HTMLSelectElement;
                        if (!submitTray || !timeControlSelect) {
                            console.error('ChessBlocker: Didnt find submit tray or time control');
                            continue;
                        }

                        submitTray.addEventListener('click', (event: ChessBlockerEvent) => {
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
                            
                            playButtonHandler(event, LICHESS, false, getLichessPlayerLastDayGamesTimes);
                        }, true);
                    }
                }
            }
        });

        const lobbyTableElement = await waitForElementToExist(undefined, 'div.lobby__table');
        createGameObserver.observe(lobbyTableElement, {childList: true, subtree: false});
    } else if (pagePath.match(/^\/[0-9a-z]{12}$/i)) {
        // the user's game
        // 12 characters is an ongoign game link. a finished game/ watching other game has 8 characters
        const rcontrolsObserver = new MutationObserver((mutationList) => {
            for (const mutation of mutationList) {
                for (const addedNode of mutation.addedNodes) {
                    if (!(addedNode instanceof Element)) {
                        continue;
                    }

                    addListenersToRightControl(addedNode as HTMLElement);
                }
            }
        });

        const rcontrolsElement = await waitForElementToExist(undefined, 'div.rcontrols');

        // add listeners to existing elements before observing
        for (const child of rcontrolsElement.children) {
            addListenersToRightControl(child as HTMLElement);
        }
        rcontrolsObserver.observe(rcontrolsElement, {childList: true, subtree: false});
    }
}

console.debug('ChessBlocker initialize');
initializeChessBlocker();
console.debug('ChessBlocker done');
