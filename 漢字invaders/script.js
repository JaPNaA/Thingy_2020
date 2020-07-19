// BEGIN GLOBALS - Not much to say; They're globals. See further down.
let currentLetter = null;
let kanaInput = "";
let kanaAnswer = "";
let kanjiBitmask = 0;
let invaders = [];
let streak = [10, 10];
let score = 0, physics = 0, nextKanjiTimer = 0;
let msDelay = 1000 * 0.033; //attempt about 30 frames per second with a 33ms delay.
let speed = 1; //Thusly, this is about 30 pixels per second.

// BEGIN KANJI DICTIONARY
// This should be pretty straightforward. It's an array of
// arrays whose first element is Kanji. The second element
// is the kana reading, and the English meaning follows.
// The final item is a bitfield for difficulty. 0x4 is hardest.

//console.log("we have "+kanjiList.length);

//	kanjiList.push(['','','',0x4], ['','','',0x4], ['','','',0x4], ['','','',0x4], ['','','',0x4]);
//	I regularly copy the above line enough to justify leaving it here.

////////BEGIN HTML DOM LOGISTICS
////////Page-manipulations done before the game starts.
function dismissTutorial() {
    kanjiList = kanjiList;
    let allInputs = document.getElementsByTagName("input");
    let answer = 0;
    for (let i = 0; i < allInputs.length; i++) {
        if (allInputs[i].getAttribute("name") == "jlpt")
            if (allInputs[i].checked)
                answer += parseInt(allInputs[i].getAttribute("value"))
    }
    kanjiBitmask = answer;
    for (let i = 0; i < kanjiList.length; i++) {
        if (!(kanjiList[i][3] & kanjiBitmask)) {
            kanjiList.splice(i, 1);
            i--;
        }
    }
    nextKanjiTimer = setTimeout(setNextKanji, 3000);
    physics = setTimeout(updatePhysics, msDelay);
    $('tutorial').style.display = "none";
    updateOrientation();
    $('ios_text_input').focus();
    setInterval(kanjiClean, 5000);
}
function whatIsJLPT() {
    $('jlptpopup').style.display = "block";
    $('tutorial').style.display = "none";
}
function whatIsRomaji() {
    $('romajipopup').style.display = "block";
    $('tutorial').style.display = "none";
}
function hideHelp() {
    $('romajipopup').style.display = "none";
    $('jlptpopup').style.display = "none";
    $('tutorial').style.display = "block";
}
// BEGIN GAME LOGIC
// Here are the core rules for Kanji Invaders: Check input,
// and if the user has input a correct kanji, give points.
// Otherwise, move it all down and age the Kanji/Kana.
function isValidKanji(i) {
    //returns whether this kanji is still meaningful for physics and gameplay.
    //false means it's either a word that fell to the bottom, was completed, or somesuch.
    return (invaders[i].className.search("defeated") == -1 && invaders[i].className.search("completed") == -1);
}
function checkInput() {
    for (let i = 0; i < invaders.length; i++) {
        if (isValidKanji(i) == false) continue;
        let answer = invaders[i].getAttribute('reading');
        const kanaString = wanakana.toHiragana(kanaInput);
        if (kanaString.substr(kanaInput.length - answer.length, kanaInput.length) == answer) {
            correctAnswer(i);
            //don't solve multiple words with one keystroke!
            //players should have to fully type each word onscreen.
            break;
        }
    }
}
function kanjiDie(i) {
    streak = [0, 0];
    speed = 1;
    //reset that score.  残念, ね...
    $('streak').innerHTML = "Ouch! You missed " + invaders[i].getAttribute('kanji') + "(<span class='furigana'>" + invaders[i].getAttribute('reading') + "</span>)" + "!";
    invaders[i].classList.add("defeated");
}
function kanjiClean(i) {
    for (i = 0; i < invaders.length; i++) {
        if (isValidKanji(i) == false) {
            document.body.removeChild(invaders[i]);
            invaders.splice(i, 1);
        }
    }
}
function correctAnswer(i) {
    $('feedback').innerHTML = invaders[i].getAttribute('kanji') + "(<span class='furigana'>" + invaders[i].getAttribute('reading') + "</span>) is " + invaders[i].getAttribute('meaning');
    if (invaders[i].getAttribute("age") == 0) {
        streak[0]++;
    }
    else {
        streak[1]++;
    }
    //The game intensity is logarithmic. This function defines fall speed,
    //which is added onto the original base speed (assumed to be 1 here)
    speed = Math.log(((streak[0] * 0.75 + streak[1] * 0.25 + 2.45) / 2) + 1);
    //Yeah, I arbitrarily inflate the score.
    //Thousands of points are cooler than tens.
    $('streak').innerHTML = streak[1] * 125 + streak[0] * 75 + " points (" + streak[1] + " kanji, " + streak[0] + " kana)";
    invaders[i].classList.add("completed");
    clearKanaInput();
    return;
}
//This function is called every "frame."
//More correct: "Every frame" is this function.
function updatePhysics() {
    physics = setTimeout(updatePhysics, msDelay);
    for (let i = 0; i < invaders.length; i++) {
        if (isValidKanji(i) == false)
            continue;
        // This has always seemed like a non-graceful way to move the words, but
        // I'd rather work on other things since this is functional.
        let thisKanjiPosition = Number(invaders[i].style.top.substr(0, invaders[i].style.top.length - 2)) + speed;
        invaders[i].style.top = thisKanjiPosition;
        //now see if any have fallen too far.
        let panelOffset = $('panel').clientHeight;
        //take the size of the kanji into account
        panelOffset += invaders[i].clientHeight;
        console.log(panelOffset);
        if (thisKanjiPosition > getH() - panelOffset) {
            kanjiDie(i);
        }
        else if (thisKanjiPosition > (getH() - panelOffset) / 2) {
            invaders[i].setAttribute("age", 1);
            invaders[i].classList.add("halfway");
        }
    }
}
//Todo: Better random kanji selection? Repeats can be annoying.
function setNextKanji() {
    let newKanji = document.createElement("div");
    document.body.appendChild(newKanji);
    invaders.push(newKanji);
    invaders[invaders.length - 1].className = "invader";
    invaders[invaders.length - 1].style.position = "absolute";
    invaders[invaders.length - 1].style.left = Math.floor(Math.random() * (getW() - 100)) + "px";
    invaders[invaders.length - 1].style.top = 0;
    let nextTimeout = (Math.log(9 / (streak[1] + streak[0] + 0.5)) + 4) * 1000;
    nextKanjiTimer = setTimeout(setNextKanji, nextTimeout);
    let nextKanji;
    do {
        nextKanji = kanjiList[Math.floor(Math.random() * kanjiList.length)];
    } while (false)//this is for set selection!(nextKanji[3]&0x1))

    invaders[invaders.length - 1].setAttribute("age", 0);
    invaders[invaders.length - 1].setAttribute("kanji", nextKanji[0]);
    invaders[invaders.length - 1].setAttribute("reading", nextKanji[1]);
    invaders[invaders.length - 1].setAttribute("meaning", nextKanji[2]);
    invaders[invaders.length - 1].innerHTML = nextKanji[0];
    invaders[invaders.length - 1].classList.add("appearing");
}
//More hacks to make IE work, argh!
function getW() {
    if (document.body)
        return document.body.clientWidth;
}
function getH() {
    if (document.body)
        return document.body.clientHeight;
    return 200;
}

// iOS hacks
// Yay, more browser hacks.
// This is so we can bring up a keyboard in mobile browsers.
//$('debug').innerHTML = navigator.userAgent;
var isiPad = navigator.userAgent.match(/iPad/i) != null;
var isiPhone = navigator.userAgent.match(/iPhone/i) != null;
function updateOrientation() {
    if ($('tutorial').style.display != "none") {
        return;
    }
    switch (window.orientation) {
        case 0:
        case 180:
            if (isiPad)
                $('panel').style.top = "60%";
            else if (isiPhone)
                $('panel').style.top = "30%";
            break;
        case -90:
        case 90:
            if (isiPad)
                $('panel').style.top = "38.5%";
            else if (isiPhone)
                $('panel').style.top = "30%";
            break;
    }
    //ipadportrait		onscreenKeyboardRaiseRatio = "37%";
    //iphoneportrait	onscreenKeyboardRaiseRatio = "60%";
}


function $(id) {
    return document.getElementById(id);
}


// --- Wanakana

/** @type {HTMLInputElement} */
// @ts-ignore
const wanakanaIMEInput = $("wanakanaIME");
wanakana.bind(wanakanaIMEInput);
wanakanaIMEInput.addEventListener("keydown", function() {
    // let WanaKana do whatever it needs to do
    setTimeout(function() {
        kanaInput = wanakanaIMEInput.value;
        checkInput();
    }, 1);
});

addEventListener("keydown", function(e) {
  if (e.target != wanakanaIMEInput) {
    wanakanaIMEInput.focus();
  }
});

function clearKanaInput() {
    wanakanaIMEInput.value = "";
}
