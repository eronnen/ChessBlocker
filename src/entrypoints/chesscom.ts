import { CHESSCOM } from "../common/constants";
import {
  getChesscomMonthGames,
  filterChesscomGamesByDate,
} from "../common/chesscom_api";
import { getLast2DaysDate } from "../common/date_utils";
import {
  addLoadingAnimation,
  waitForElementToExist,
  playButtonHandler,
  addPlayButtonHandlerWithPattern,
} from "../common/chess_website_hook";

// since we cache the result, we retrieve the previous 2 days in case date start changes in the settings.
// also chess.com supports getting only the last month, so we retrieve the past 2 days anyway (except in a month start)

let g_last2DaysGamesTimesPromise: Promise<number[]> | undefined = undefined;

async function getPlayerLast2DaysGamesTimes(
  username: string | undefined,
  delayMs = 0,
): Promise<number[]> {
  // TODO: update if chess.com supports smaller units then month

  if (!username) {
    console.warn("ChessBlocker: no chess.com username configured");
    return [];
  }

  const currentDate = new Date();

  // TODO: solve edge case in the first day of a month and retrieve for previous month too
  const removeLoadingAnimation = addLoadingAnimation();
  await new Promise((resolve) => setTimeout(resolve, delayMs)); // because it takes time for chess.com to update last game data
  console.debug("ChessBlocker: fetching chess.com games for " + username);
  const response = await getChesscomMonthGames(username, currentDate);
  console.debug("ChessBlocker: done fetching");
  const responseJson = await response.json();
  removeLoadingAnimation();

  const last2DaysDate = getLast2DaysDate(currentDate);
  return filterChesscomGamesByDate(responseJson, last2DaysDate);
}

async function getLast2DaysGamesTimes(delayMs = 0): Promise<number[]> {
  const config: ChessBlockerConfigType = {
    [CHESSCOM + ".username"]: "",
  };

  const items: ChessBlockerConfigType = await chrome.storage.sync.get(config);
  return getPlayerLast2DaysGamesTimes(
    items[(CHESSCOM + ".username") as UsernameConfigType],
    delayMs,
  );
}

function reinitializeChessBlockerData(delayMs = 0) {
  g_last2DaysGamesTimesPromise = getLast2DaysGamesTimes(delayMs);
}

async function getLast2DaysGamesTimesPromiseGlobal(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  items: ChessBlockerConfigType,
): Promise<number[]> {
  // Using a global so we can update the value before needed in button, since
  // chess.com API can be very slow because we need to query a whole month
  return g_last2DaysGamesTimesPromise!;
}

async function waitForSideBarAndAddListener(): Promise<HTMLElement> {
  const sideBarElement = (await waitForElementToExist(
    "board-layout-sidebar",
  )) as HTMLElement;
  if (!sideBarElement) {
    throw new Error("ChessBlocker: Didnt find sidebar on live game");
  }

  sideBarElement.addEventListener(
    "click",
    (event: Event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      let closestButton: HTMLElement | null = event.target.closest("button");
      if (closestButton == null) {
        closestButton = event.target.closest("a");
        if (closestButton == null) {
          // not a button or a link
          return;
        }
      }

      const buttonText = closestButton.textContent;
      if (buttonText == null) {
        return;
      }

      if (buttonText.match(/^\s*New (\d+) min\s*$/)) {
        playButtonHandler(
          event as ChessBlockerEvent,
          CHESSCOM,
          false,
          getLast2DaysGamesTimesPromiseGlobal,
        );
      } else if (buttonText.match(/^\s*Play\s*$/)) {
        playButtonHandler(
          event as ChessBlockerEvent,
          CHESSCOM,
          false,
          getLast2DaysGamesTimesPromiseGlobal,
        );
      } else if (buttonText.match(/^\s*New (\d+) min rated\s*$/)) {
        playButtonHandler(
          event as ChessBlockerEvent,
          CHESSCOM,
          false,
          getLast2DaysGamesTimesPromiseGlobal,
        );
      }
    },
    true,
  );

  return sideBarElement;
}

async function initializeChessBlocker() {
  const pagePath = document.location.pathname;
  if (pagePath == "/home") {
    // home: only "Play x min" link
    reinitializeChessBlockerData();
    await waitForElementToExist(undefined, ".play-quick-links-title");
    if (
      !addPlayButtonHandlerWithPattern(
        document.body,
        "a",
        /^\s*Play (\d+) min\s*$/,
        (event) => {
          playButtonHandler(
            event,
            CHESSCOM,
            true,
            getLast2DaysGamesTimesPromiseGlobal,
          );
        },
      )
    ) {
      console.error("ChessBlocker: Didn't find play button in home page");
    }
  } else if (
    pagePath.startsWith("/game/live") ||
    pagePath.startsWith("/play/online")
  ) {
    // game link - "new x min" button appears when game ends, and there is a play button in the "New Game" tab
    if (pagePath.startsWith("/play/online/new")) {
      // disallowing again
      chrome.runtime.sendMessage(chrome.runtime.id, {
        type: "disallow-new-game-link",
        website: "chesscom",
      });
    }

    reinitializeChessBlockerData();
    const sideBarElement =
      (await waitForSideBarAndAddListener()) as HTMLElement;

    const sidebarObserver = new MutationObserver(
      (mutationList: MutationRecord[]) => {
        for (const mutation of mutationList) {
          if (mutation.type != "childList") {
            continue;
          }

          if ((mutation.target as ParentNode).children.length > 0) {
            // consider only the leaves of the DOM, in order to avoid duplication of text change
            continue;
          }

          for (const removedNode of mutation.removedNodes) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((removedNode as any).data == "Play") {
              // TODO: remove any
              // game was in play, now finished
              console.debug("ChessBlocker: chess.com game is finished");

              // wait for chess.com to update last game data hopefully. TODO: remove delay?
              reinitializeChessBlockerData(1500);
            }
          }
        }
      },
    );
    sidebarObserver.observe(sideBarElement, { childList: true, subtree: true });
  }
}

console.debug("ChessBlocker initialize");
initializeChessBlocker();
console.debug("ChessBlocker done");
