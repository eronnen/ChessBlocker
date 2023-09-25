export function getChesscomMonthGames(username: string, date: Date) {
    return fetch(`https://api.chess.com/pub/player/${username}/games/${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2,'0')}`, {method: 'GET', headers: {'Accept': 'application/json'}});
}

export function filterChesscomGamesByDate(responseJson: any, startDate: Date) {
    if (!("games" in responseJson)) {
        return [];
    }

    return responseJson["games"].filter((g: any) => g["end_time"] >= startDate.getTime()).map((g: any) => g["end_time"] * 1000);
}

export async function getChesscomGamesCount(username: string, fromDate: Date) {
    console.debug('ChessBlocker: fetching chess.com games for ' + username);
    const response = await getChesscomMonthGames(username, fromDate);
    console.debug('ChessBlocker: done fetching');
    return filterChesscomGamesByDate(response, fromDate).length;
}

export async function isChesscomUsernameValid(username: string): Promise<boolean> {
    return fetch(`https://api.chess.com/pub/player/${username}`, {method: 'GET', headers: {'Accept': 'application/json'}})
            .then((response) => response.json())
            .then((responseJson) => {
                if (!responseJson['username']) {
                    return false;
                }
                return true;
            });
}