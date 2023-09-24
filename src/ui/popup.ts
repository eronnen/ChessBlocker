import { DEFAULT_DAY_START_TIME_HOURS, DEFAULT_DAY_START_TIME_MINUTES } from "../common/constants";
import { getDayStart } from "../common/date_utils";
import { getChesscomMonthGames } from "../common/chesscom_api";
import { getLichessGamesCount } from "../common/lichess_api";

document.getElementById('settingsButton')!.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

async function updateTodayGames() {
    const items: ChessBlockerConfigType = await chrome.storage.sync.get({
        dayStartTimeHours: DEFAULT_DAY_START_TIME_HOURS,
        dayStartTimeMinutes: DEFAULT_DAY_START_TIME_MINUTES,
        [CHESSCOM]: {
            username: '',
        },
        [LICHESS]: {
            username: '',
        },
    });

    const currentDate = new Date();
    const dayStart = getDayStart(currentDate, items.dayStartTimeHours!, items.dayStartTimeMinutes!);

    //chess.com
    if (items[CHESSCOM]!.username) {
        const chesscomGamesElement = document.getElementById('chesscom.games')!;
        chesscomGamesElement.innerHTML = '<div class="loader"></div>&nbsp;Games';
        getChesscomMonthGames(items[CHESSCOM]!.username!, dayStart)
            .then((response) => response.json())
            .then((responseJson) => {
                let numberOfGames = 0;
                if (responseJson['games']) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    numberOfGames = (responseJson["games"].filter((g: any) => g['end_time'] * 1000 > dayStart.getDate())).length; 
                }
                chesscomGamesElement.innerHTML = `<span style="font-weight: bold;">${numberOfGames}</span> Games`;
            })
            .catch(() => {
                chesscomGamesElement.innerHTML = '<span style="font-weight: bold;">(Error)</span>';
            });
    }

    if (items[LICHESS]!.username) {
        const lichessGamesElement = document.getElementById('lichess.games')!;
        lichessGamesElement.innerHTML = '<div class="loader"></div>&nbsp;Games';
        getLichessGamesCount(items[LICHESS]!.username!, dayStart)
            .then((numberOfGames) => {
                lichessGamesElement.innerHTML = `<span style="font-weight: bold;">${numberOfGames}</span> Games`;
            })
            .catch(() => {
                lichessGamesElement.innerHTML = '<span style="font-weight: bold;">(Error)</span>';
            });
    }
}

updateTodayGames();
