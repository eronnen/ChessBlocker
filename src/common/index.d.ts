declare type WeekDayType = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
declare type WeekDayIndexType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

declare type ChessWebsiteType = "chesscom" | "lichess";
declare type LimitType = "day" | "dayOfWeek";

declare type ChessBlockerSiteConfigType = {
    username?: string;
    limitType?: LimitType;
    gamesPerDay?: { [id: number]: number };
    gamesPlayedToday?: number;
};

declare type ChessBlockerConfigType = {
    dayStartTimeHours?: number;
    dayStartTimeMinutes?: number;
    chesscom?: ChessBlockerSiteConfigType;
    lichess?: ChessBlockerSiteConfigType;
};

declare type ChessBlockerEvent = MouseEvent & {
    created_by_chess_blocker?: boolean;
};
