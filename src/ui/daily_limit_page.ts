import { WEEK_DAYS, DEFAULT_GAMES_PER_DAY, DEFAULT_DAY_START_TIME_HOURS, DEFAULT_DAY_START_TIME_MINUTES } from "../common/constants";
import { getSiteGamesCount } from "../common/chess_sites";
import { getDayStart, getActualWeekDayByDate } from "../common/date_utils";

export async function setDailyLimitMessages(site: ChessWebsiteType, gamesPlayedElement: Element, gamesAllowedElement: Element): Promise<void> {
    const currentDate = new Date();
    let items: ChessBlockerConfigType;

    try {
        items = await chrome.storage.sync.get({
            dayStartTimeHours: DEFAULT_DAY_START_TIME_HOURS,
            dayStartTimeMinutes: DEFAULT_DAY_START_TIME_MINUTES,
            [site]: {
                username: '',
                gamesPerDay: Object.fromEntries(Array.from({ length: WEEK_DAYS.length }, (_, i) => [i, DEFAULT_GAMES_PER_DAY])),
                gamesPlayedToday: -1,
            }
        }) as ChessBlockerConfigType;
    } catch (err) {
        gamesPlayedElement.innerHTML = `You played enough games today! (error getting exact number: ${err})`;
        return;
    }

    const currentWeekday = getActualWeekDayByDate(currentDate, items.dayStartTimeHours!, items.dayStartTimeMinutes!);
    gamesAllowedElement.innerHTML = `${items[site]!.gamesPerDay![currentWeekday]} games were allowed today (${WEEK_DAYS[currentWeekday]})`;

    if (!items[site]!.username!) {
        gamesPlayedElement.innerHTML = `You played enough games today! (no username configured)`;
        return;
    }

    if (items[site]!.gamesPlayedToday! >= 0) {
        gamesPlayedElement.innerHTML = `You played ${items[site]!.gamesPlayedToday} games today!`;
    } else {
        try {
            const dayStart = getDayStart(currentDate, items.dayStartTimeHours!, items.dayStartTimeMinutes!);
            const gamesCount = await getSiteGamesCount(site, items[site]!.username!, dayStart);
            gamesPlayedElement.innerHTML = `You played ${gamesCount} games today!`;
        } catch (err) {
            gamesPlayedElement.innerHTML = `You played enough games today! (error getting exact number: ${err})`;
            return;
        }
    }
}