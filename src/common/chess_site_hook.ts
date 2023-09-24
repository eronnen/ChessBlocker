import { WEEK_DAYS, DEFAULT_GAMES_PER_DAY, DEFAULT_DAY_START_TIME_HOURS, DEFAULT_DAY_START_TIME_MINUTES } from "./constants";
import { getActualWeekDayByDate } from "./date_utils";

export async function waitForElementToExist(id: string | undefined, selector: string | undefined = undefined): Promise<Element> {
    return new Promise(resolve => {
        let element = id !== undefined ? document.getElementById(id) : document.querySelector(selector!);
        if (element) {
            return resolve(element);
        }

        const observer = new MutationObserver(() => {
            element = id !== undefined ? document.getElementById(id) : document.querySelector(selector!)
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

export function addLoadingAnimation(): () => void {
    const animationStyle = document.createElement('style');
    animationStyle.innerHTML = "@keyframes ChessBlockerLoading { 0% { opacity: 1; transform: translateY(3.5rem); } 100% { opacity: 1; transform: translateY(0); } }";
    document.head.appendChild(animationStyle);

    const loadingElement = document.createElement('div');
    loadingElement.innerHTML = `ChessBlocker: checking games...`;
    loadingElement.style.cssText = 'position: fixed; bottom: 0; left: 40%; font-size: 21px; font-weight: bold; color: black; background: rgb(190, 190, 190); border: 0.15em solid rgb(77, 77, 77); border-radius: 5px;';
    loadingElement.style.setProperty('animation', 'ChessBlockerLoading 0.5s ease-out 1s backwards');
    document.body.appendChild(loadingElement);

    // return removeLoadingAnimation function
    return function() {
        document.body.removeChild(loadingElement);
        document.head.removeChild(animationStyle);
    };
}

export async function playButtonHandler(event: ChessBlockerEvent, website: ChessWebsiteType, is_new_game_link: boolean, getPreviousGamesTimesPromise: (items: ChessBlockerConfigType) => Promise<number[]>) {
    if (event.created_by_chess_blocker) {
        return;
    }

    console.debug('ChessBlocker: Clicked on play');
    const target = event.target!;
    event.preventDefault();
    event.stopPropagation();
    
    async function reclickButton() {
        if (is_new_game_link) {
            await chrome.runtime.sendMessage(chrome.runtime.id, {
                type: 'allow-new-game-link',
                website: website
            });
        }

        const restoredEvent: ChessBlockerEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        });
        restoredEvent.created_by_chess_blocker = true;
        target.dispatchEvent(restoredEvent);
    }

    const config: ChessBlockerConfigType =  {
        dayStartTimeHours: DEFAULT_DAY_START_TIME_HOURS,
        dayStartTimeMinutes: DEFAULT_DAY_START_TIME_MINUTES,
        [website]: {
            username: '',
            gamesPerDay: Object.fromEntries(Array.from({ length: WEEK_DAYS.length }, (_, i) => [i, DEFAULT_GAMES_PER_DAY])),
        }
    }

    let chessBlockerOptions: ChessBlockerConfigType;
    let previousGamesTimes: number[];

    try {
        chessBlockerOptions = await chrome.storage.sync.get(config);
        previousGamesTimes = await getPreviousGamesTimesPromise(chessBlockerOptions);
    } catch (err) {
        console.error(`ChessBlocker error: ${err}`);
        reclickButton();
        return;
    }

    if (!chessBlockerOptions || !previousGamesTimes) {
        throw new Error('ChessBlocker data not initialized');
    }

    const currentDate = new Date();
    const dayStart = new Date(currentDate.getTime());
    dayStart.setHours(chessBlockerOptions.dayStartTimeHours!);
    dayStart.setMinutes(chessBlockerOptions.dayStartTimeMinutes!);
    dayStart.setSeconds(0);
    dayStart.setMilliseconds(0);
    if (dayStart > currentDate) {
        dayStart.setDate(dayStart.getDate() - 1);
    }
    
    const dayStartEpochMillis = dayStart.getTime();
    const gamesLimitPerToday = chessBlockerOptions[website]!.gamesPerDay![getActualWeekDayByDate(currentDate, chessBlockerOptions.dayStartTimeHours!, chessBlockerOptions.dayStartTimeMinutes!)];

    const numberOfGamesPlayed = previousGamesTimes.filter((t) => t > dayStartEpochMillis).length;
    if (numberOfGamesPlayed >= gamesLimitPerToday) {
        // limit reached
        console.debug(`you reached your daily games limit! you played ${numberOfGamesPlayed}/${gamesLimitPerToday} games`);
        await chrome.storage.sync.set({ [website]: { gamesPlayedToday: numberOfGamesPlayed } });
        chrome.runtime.sendMessage(chrome.runtime.id, {
            type: 'limit',
            website: website,
            numberOfGamesPlayed: numberOfGamesPlayed
        });
    }
    else {
        console.debug(`you played ${numberOfGamesPlayed}/${gamesLimitPerToday} games today`);
        reclickButton();
    }
}

export function addPlayButtonHandlerWithPattern(parent: HTMLElement, tag: string, buttonPattern: RegExp, handler: (event: ChessBlockerEvent) => void) {
    for (const e of parent.querySelectorAll(tag)) {
        if (e instanceof Element && e.textContent && e.textContent.match(buttonPattern)) {
            console.debug(`ChessBlocker: hooking ${e.textContent} button`);
            (e as HTMLElement).addEventListener('click', handler, true);
            return true;
        }
    }
}
