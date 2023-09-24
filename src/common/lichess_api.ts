export async function* readLichessGamesResponseLines(response: Response): AsyncGenerator<string> {
    const utf8Decoder = new TextDecoder('utf-8');
    const responseReader = response.body!.getReader();
    let { value: chunk, done: readerDone } = await responseReader.read();

    while (true) {
        // assuming chunks don't end mid-json
        if (chunk) {
            let currentIndex = 0;
            while (currentIndex < chunk.length) {
                const nextLineEndingIndex = chunk.indexOf('\n'.charCodeAt(0), currentIndex);
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

export async function getLichessGamesCount(username: string, fromDate: Date, maxGames: number = 0) {
    return getLichessGames(username, fromDate, maxGames).then(async (response) => {
        let numberOfGames = 0; 
        for await (_ of readLichessGamesResponseLines(response)) {
            //assume every line is a game without parsing...
            numberOfGames++;
        }

        return numberOfGames;
    });
}

export function getLichessGames(username: string, fromDate: Date, maxGames=0) {
    let endpoint = `https://lichess.org/api/games/user/${username}?since=${fromDate.getTime()}&moves=false`;
    if (maxGames > 0) {
        endpoint += `&max=${maxGames}`;
    }
    return fetch(endpoint, {method: 'GET', headers: {'Accept': 'application/x-ndjson'}});
}

export async function isLichessUsernameValid(username: string): Promise<boolean> {
    return fetch(`https://api.chess.com/pub/player/${username}`, {method: 'GET', headers: {'Accept': 'application/json'}})
            .then((response) => response.json())
            .then((responseJson) => {
                if (!responseJson['username']) {
                    return false;
                }
                return true;
            });
}