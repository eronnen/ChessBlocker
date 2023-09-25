import { CHESSCOM, LICHESS, CHESS_WEBSITES, WEEK_DAYS, LIMIT_BY_DAY, LIMIT_BY_DAY_OF_WEEK, DEFAULT_GAMES_PER_DAY, DEFAULT_DAY_START_TIME_HOURS, DEFAULT_DAY_START_TIME_MINUTES } from "../common/constants";
import { isUsernameValid } from "../common/chess_sites";

const WEBSITES_NAMES = {
    [CHESSCOM]: "Chess.com", 
    [LICHESS]: "Lichess.org"
};

const g_oldUsernames = {
    [CHESSCOM]: "", 
    [LICHESS]: ""
};

async function restoreDayLimits(website: ChessWebsiteType, limitType: LimitType) {
    const config: ChessBlockerConfigType = {
        [website]: {
            gamesPerDay: Object.fromEntries(Array.from({ length: WEEK_DAYS.length }, (_, i) => [i, DEFAULT_GAMES_PER_DAY]))
        }
    }
    const items: ChessBlockerConfigType = await chrome.storage.sync.get(config);
    const gamePerDayElement = document.getElementById(website + '.gamesPerDay')! as HTMLInputElement;
    gamePerDayElement.value = items[website]!.gamesPerDay![0].toString();
    gamePerDayElement.hidden = limitType == LIMIT_BY_DAY_OF_WEEK;
    WEEK_DAYS.forEach((day, index) => {
        const gamePerCurrentDayElemet = document.getElementById(website + '.gamesPerDay.' + day)! as HTMLInputElement;
        gamePerCurrentDayElemet.value = items[website]!.gamesPerDay![index].toString();
        gamePerCurrentDayElemet.hidden = limitType == LIMIT_BY_DAY;
    });
}

async function restoreOptions() {
    const config: ChessBlockerConfigType = {
        dayStartTimeHours: DEFAULT_DAY_START_TIME_HOURS,
        dayStartTimeMinutes: DEFAULT_DAY_START_TIME_MINUTES,
    };

    for (const website of CHESS_WEBSITES) {
        config[website] = {
            username: '',
            limitType: LIMIT_BY_DAY,
        }
    }

    const items: ChessBlockerConfigType = await chrome.storage.sync.get(config);
    
    g_oldUsernames[CHESSCOM] = items[CHESSCOM]!.username!;
    g_oldUsernames[LICHESS] = items[LICHESS]!.username!;
    (document.getElementById('dayStartTime') as HTMLInputElement)!.value = `${items.dayStartTimeHours!.toString().padStart(2,'0')}:${items.dayStartTimeMinutes!.toString().padStart(2,'0')}`;

    for (const website of CHESS_WEBSITES) {
        (document.getElementById(website + '.username') as HTMLInputElement)!.value = items[website]!.username!;
        (document.getElementById(website + '.limitType') as HTMLInputElement).value = items[website]!.limitType!;
        restoreDayLimits(website, items[website]!.limitType!);
    }
}

async function saveOptions() {
    const dayStartTime = (document.getElementById('dayStartTime') as HTMLInputElement)!.value!;
    const dayStartTimeHours = parseInt(dayStartTime.match(/(\d{2}):(\d{2})/)![1]);
    const dayStartTimeMinutes = parseInt(dayStartTime.match(/(\d{2}):(\d{2})/)![2]);

    const saveButton = document.getElementById('save')! as HTMLButtonElement;
    saveButton.disabled = true;

    for (const website of CHESS_WEBSITES) {
        let username = (document.getElementById(website + '.username')! as HTMLInputElement).value;
        const limitType = (document.getElementById(website + '.limitType') as HTMLInputElement)!.value as LimitType;
        const gamesPerDay = Object.fromEntries(Array.from(
            { length: WEEK_DAYS.length }, 
            (_, i) => [i, parseInt((document.getElementById(website + '.gamesPerDay.' + WEEK_DAYS[i]) as HTMLInputElement)!.value)]));
        
        if (limitType == LIMIT_BY_DAY) {
            for (let i = 0; i < WEEK_DAYS.length; i++) {
                gamesPerDay[i] = parseInt((document.getElementById(website + '.gamesPerDay.' + WEEK_DAYS[0]) as HTMLInputElement)!.value);
            }
        }
        
        if (g_oldUsernames[website] != username) {
            if (!await isUsernameValid(website, username)) {
                alert(`username "${username}" doesn't exist in ${WEBSITES_NAMES[website]}`);
                username = '';
            }
        }

        g_oldUsernames[website] = username;
        (document.getElementById(website + '.username') as HTMLInputElement)!.value = username;

        const config: ChessBlockerConfigType = {
            dayStartTimeHours: dayStartTimeHours,
            dayStartTimeMinutes: dayStartTimeMinutes,
            [website]: {
                username: username,
                limitType: limitType,
                gamesPerDay: gamesPerDay,
            }
        };

        await chrome.storage.sync.set(config);
    }

    const status = document.getElementById('status')!;
    status.textContent = 'Options saved.';
    setTimeout(() => {
        status.textContent = '';
        saveButton.disabled = false;
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    for (const website of CHESS_WEBSITES) {
        document.getElementById(website + '.limitType')!.addEventListener('change', (event: Event) => { 
            restoreDayLimits(website, (event.target! as HTMLSelectElement).value as LimitType); 
        });
    }
    restoreOptions();
});
document.getElementById('save')!.addEventListener('click', saveOptions);
