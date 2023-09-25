import { getLichessGamesCount, isLichessUsernameValid } from "./lichess_api";
import { getChesscomGamesCount, isChesscomUsernameValid } from "./chesscom_api";
import { CHESSCOM, LICHESS } from "./constants";

export async function getSiteGamesCount(site: ChessWebsiteType, username: string, fromDate: Date, maxGames: number = 0): Promise<number> {
    switch (site) {
        case LICHESS:
            return getLichessGamesCount(username, fromDate, maxGames);
        case CHESSCOM:
            return getChesscomGamesCount(username, fromDate);
        default:
            throw new Error(`Unknown site: ${site}`);
    }
}

export async function isUsernameValid(site: ChessWebsiteType, username: string): Promise<boolean> {
    switch (site) {
        case LICHESS:
            return isLichessUsernameValid(username);
        case CHESSCOM:
            return isChesscomUsernameValid(username);
        default:
            throw new Error(`Unknown site: ${site}`);
    }
}
