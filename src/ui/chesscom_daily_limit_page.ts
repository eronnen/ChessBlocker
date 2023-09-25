import { CHESSCOM } from "../common/constants";
import { setDailyLimitMessages } from "./daily_limit_page";

document.addEventListener("DOMContentLoaded", async () => {
  setDailyLimitMessages(
    CHESSCOM,
    document.getElementById("games_played_message")!,
    document.getElementById("games_allowed_message")!,
  );
});
