import { CHESSCOM, LICHESS, DEFAULT_DAY_START_TIME_HOURS, DEFAULT_DAY_START_TIME_MINUTES } from "../common/constants";
import { getDayStart } from "../common/date_utils";
import { getChesscomGamesCount } from "../common/chesscom_api";
import { getLichessGamesCount } from "../common/lichess_api";

document.getElementById('settingsButton')!.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

async function updateTodayGames() {
    const config: ChessBlockerConfigType = {
        dayStartTimeHours: DEFAULT_DAY_START_TIME_HOURS,
        dayStartTimeMinutes: DEFAULT_DAY_START_TIME_MINUTES,
        [CHESSCOM]: {
            username: '',
        },
        [LICHESS]: {
            username: '',
        },
    }

    const items: ChessBlockerConfigType = await chrome.storage.sync.get(config);
    const currentDate = new Date();
    const dayStart = getDayStart(currentDate, items.dayStartTimeHours!, items.dayStartTimeMinutes!);

    //chess.com
    if (items[CHESSCOM]!.username) {
        const chesscomGamesElement = document.getElementById('chesscom.games')!;
        chesscomGamesElement.innerHTML = '<div class="loader"></div>&nbsp;Games';
        try {
            const numberOfGames = await getChesscomGamesCount(items[CHESSCOM]!.username!, dayStart);
            chesscomGamesElement.innerHTML = `<span style="font-weight: bold;">${numberOfGames}</span> Games`;
        } catch (err) {
            chesscomGamesElement.innerHTML = '<span style="font-weight: bold;">(Error)</span>';
        }
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
