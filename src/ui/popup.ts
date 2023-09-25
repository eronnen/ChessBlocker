import { CHESSCOM, LICHESS, DEFAULT_DAY_START_TIME_HOURS, DEFAULT_DAY_START_TIME_MINUTES, CHESS_WEBSITES } from "../common/constants";
import { getDayStart } from "../common/date_utils";
import { getWebsiteGamesCount } from "../common/chess_websites";

document.getElementById('settingsButton')!.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

async function updateTodayGames() {
    const config: ChessBlockerConfigType = {
        dayStartTimeHours: DEFAULT_DAY_START_TIME_HOURS,
        dayStartTimeMinutes: DEFAULT_DAY_START_TIME_MINUTES,
        [CHESSCOM + ".username"]: "",
        [LICHESS + ".username"]: "",
    }

    const items: ChessBlockerConfigType = await chrome.storage.sync.get(config);
    const currentDate = new Date();
    const dayStart = getDayStart(currentDate, items.dayStartTimeHours!, items.dayStartTimeMinutes!);

    for (const website of CHESS_WEBSITES) {
        const username = items[website + ".username" as UsernameConfigType];
        if (!username) {
            continue;
        }

        const gamesElement = document.getElementById(website + '.games')!;
        gamesElement.innerHTML = '<div class="loader"></div>&nbsp;Games';
        try {
            const numberOfGames = await getWebsiteGamesCount(website, username, dayStart);
            gamesElement.innerHTML = `<span style="font-weight: bold;">${numberOfGames}</span> Games`;
        } catch (err) {
            gamesElement.innerHTML = '<span style="font-weight: bold;">(Error)</span>';
        }
    }
}

updateTodayGames();
