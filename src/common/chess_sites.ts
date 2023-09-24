import { getLichessGamesCount, isLichessUsernameValid } from "./lichess_api";
import { isChesscomUsernameValid } from "./chesscom_api";

export async function getSiteGamesCount(site: ChessWebsiteType, username: string, fromDate: Date, maxGames: number = 0): Promise<number> {
    switch (site) {
        case LICHESS:
            return getLichessGamesCount(username, fromDate, maxGames);
        case CHESSCOM:
            throw new Error("getSiteGamesCount for chess.com is not implemented yet. Their API sucks");
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
