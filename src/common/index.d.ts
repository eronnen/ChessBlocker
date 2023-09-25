declare type WeekDayType =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";
declare type WeekDayIndexType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

declare type ChessWebsiteType = "chesscom" | "lichess";
declare type LimitType = "day" | "dayOfWeek";

declare type ChessBlockerSiteConfigType = {
  username?: string;
  limitType?: LimitType;
  gamesPerDay?: { [id: number]: number };
  gamesPlayedToday?: number;
};

declare type UsernameConfigType = `${ChessWebsiteType}.username`;
declare type LimitTypeConfigType = `${ChessWebsiteType}.limitType`;
declare type GamesPerDayConfigType = `${ChessWebsiteType}.gamesPerDay`;
declare type GamesPlayedTodayConfigType =
  `${ChessWebsiteType}.gamesPlayedToday`;

declare type ChessBlockerGeneralConfigType = {
  dayStartTimeHours?: number;
  dayStartTimeMinutes?: number;
};

// config is flat and not nested for every website in order to be able to set single values in chrome.storage.sync without overriding the whole config
declare type ChessBlockerConfigType = ChessBlockerGeneralConfigType & {
  [K in UsernameConfigType]?: string;
} & { [K in LimitTypeConfigType]?: LimitType } & {
  [K in GamesPerDayConfigType]?: { [id: number]: number };
} & { [K in GamesPlayedTodayConfigType]?: number };

declare type ChessBlockerEvent = MouseEvent & {
  created_by_chess_blocker?: boolean;
};
