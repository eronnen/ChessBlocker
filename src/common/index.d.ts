declare const WEEK_DAYS: readonly ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
declare type WeekDayType = (typeof WEEK_DAYS)[number];
declare type WeekDayIndexType = keyof typeof WEEK_DAYS;

declare const CHESSCOM = "chesscom";
declare const LICHESS = "lichess";
declare const CHESS_WEBSITES: readonly [typeof CHESSCOM, typeof LICHESS];
declare type ChessWebsiteType = (typeof CHESS_WEBSITES)[number];

declare const LIMIT_BY_DAY = "day";
declare const LIMIT_BY_DAY_OF_WEEK = "dayOfWeek";
declare const LIMIT_TYPES: readonly [typeof LIMIT_BY_DAY, typeof LIMIT_BY_DAY_OF_WEEK];
declare type LimitType = (typeof LIMIT_TYPES)[number];

declare type ChessBlockerSiteConfigType = {
    username?: string;
    limitType?: LimitType;
    gamesPerDay?: { [id: number]: number };
    gamesPlayedToday?: number;
};

declare type ChessBlockerConfigType = {
    dayStartTimeHours?: number;
    dayStartTimeMinutes?: number;
    [CHESSCOM]?: ChessBlockerSiteConfigType;
    [LICHESS]?: ChessBlockerSiteConfigType;
};

declare type ChessBlockerEvent = MouseEvent & {
    created_by_chess_blocker?: boolean;
};
