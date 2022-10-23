# ChessBlocker

ChessBlocker is a chrome extension with the purpose of restricting time spent on chess without completely stop playing.

#

## Settings
* **Username** - chess.com username (used to check playing time and number of games).
* **Minutes Per Day** - maximum number of minutes of playing time allowed per day.
* **Games Per Day** - maximum number of games allowed to play each day. 

## Supported chess websites

- [x] chess.com
- [ ] lichess

## TODO
- [ ] Block direct links like `https://www.chess.com/play/online/new?action=createLiveChallenge&base=180&timeIncrement=0`
- [ ] Restriction based on day of the week
- [ ] Prettier settings UI
- [ ] Use faster undocumented API to retrieve 20 or less last games with `https://www.chess.com/callback/user/popup/{username}` and `"https://www.chess.com/callback/user/games?locale=en&all=0&userId={userId}&gameType=chess&gameTimeClass=blitz"`
- [ ] Request from chess.com API to get games per day instead of per month
- [ ] Restriction based on game time format (blitz, bullet...)

## Contributing

`ChessBlocker` is developed at [eronnen/ChessBlocker](https://github.com/eronnen/ChessBlocker). PRs, issues and feature request are welcome.