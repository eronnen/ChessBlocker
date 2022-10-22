console.debug('chess.com loaded');

PLAY_BUTTONS_TEXTS = [ /^Play$/, /^New (\d+) min$/, /^Play (\d+) min$/]

function playButtonHandler(event) {
    console.debug('Clicked on play');
    event.preventDefault();
    event.stopPropagation();
}

function addPlayButtonsHandler(tags) {
    for (var i = 0;  i < tags.length; i++) {
        for (const t of PLAY_BUTTONS_TEXTS) {
            if (tags[i].innerText.match(t)) {
                console.debug(tags[i].innerText);
                tags[i].addEventListener('click', playButtonHandler, true);
            }
        }
    }
}

var buttonTags = document.getElementsByTagName("button");
var aTags = document.getElementsByTagName("a");

addPlayButtonsHandler(aTags);
addPlayButtonsHandler(buttonTags);
console.debug('chess.com load end');