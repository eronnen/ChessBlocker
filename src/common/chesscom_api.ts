export function getChesscomMonthGames(username: string, date: Date) {
    return fetch(`https://api.chess.com/pub/player/${username}/games/${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2)}`, {method: 'GET', headers: {'Accept': 'application/json'}});
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