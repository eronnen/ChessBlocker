# ChessBlocker

ChessBlocker is a chrome extension with the purpose of restricting time spent on chess without completely stop playing.

#

## How it works
* **Username** - chess.com username (used to check playing time and number of games).
* **Minutes Per Day** - maximum number of minutes of playing time allowed per day.
* **Games Per Day** - maximum number of games allowed to play each day. 

## Supported chess websites

- [x] chess.com
- [ ] lichess

## Known Issues
### Chess.com
* Chess.com API supports only getting a user's games from the whole last month. This data can take a few seconds to retrieve, which can delay the button click.
* The games data for a user can take a few seconds to update in Chess.com server, so sometimes when starting a new game, the previous game won't be counted if ended very recently.

## TODO
- [ ] Block direct links like `https://www.chess.com/play/online/new?action=createLiveChallenge&base=180&timeIncrement=0`
- [ ] Add browser based counting
- [ ] Add loading animation when it takes a lot of times to retrieve games
- [ ] Restriction based on day of the week
- [ ] Prettier settings UI
- [ ] Request from chess.com API to get games per day instead of per month
- [ ] Restriction based on game time format (blitz, bullet...)

## Contributing

`ChessBlocker` is developed at [eronnen/ChessBlocker](https://github.com/eronnen/ChessBlocker). PRs, issues and feature request are welcome.