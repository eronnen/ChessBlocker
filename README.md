# ChessBlocker

ChessBlocker is a chrome extension that limits the number of chess games you play per day.

<img src="./images/ChessBlocker256.png">

## Installation (Until published in chrome store)
1. Clone/Download the project
2. Go to [chrome://extensions/](chrome://extensions/)
3. Click on "Load unpacked" and select the extension folder
4. Configure your username in the options page
## How it works
* The user configures his username in the extension settings, and the number of games permitted to play every day.
* When browsing chess.com website, the extension adds a handler to every button that starts a new game. In that handler, the extension checks with chess.com API that the user didn't reach the current day limit, including games from other browsers or mobile.
## Known Issues
* Chess.com API supports only getting a user's games from the whole last month. This data can take a few seconds to retrieve, which can delay the button click.
* The games data for a user can take a few seconds to update in Chess.com server, so sometimes when starting a new game, the previous game won't be counted if ended very recently.

## TODO
- [ ] Request from chess.com API to get games per day instead of per month
- [ ] Use dialog inside tab instead of opening a new tab when game limit is reached (when chrome API allows)
- [ ] Add loading animation when it takes a lot of times to retrieve games (when `chrome.action.openPopup` will work in chrome... or find a different way)
- [ ] Add browser based counting (instead of always using chess.com API)
- [ ] Show number of games in popup
- [ ] Prettier options UI
- [ ] Prettier popup
- [ ] Prettier limit page UI
- [ ] Restriction based on game type (blitz, bullet...)
- [ ] Refactor extension to multiple js files
- [ ] Convert to TypeScript

## Contributing

`ChessBlocker` is developed at [eronnen/ChessBlocker](https://github.com/eronnen/ChessBlocker). PRs, issues, feedbacks and feature request are welcome, you can use the [issue tracker](https://github.com/eronnen/ChessBlocker/issues).