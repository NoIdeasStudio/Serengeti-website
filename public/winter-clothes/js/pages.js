var curPage = false;
var sectionEl = false;

const HOME  = "home";
const ABOUT = "about";
const TOUR  = "tour";

var curUrl;

function loadPage(pageCode) {
    if (curPage) {
        sectionEl.classList.add("hidden");
        setTimeout(function () {
            curPage = false;
            loadPage(pageCode);
        }, 200);
    }
    else {
        curPage = pageCode;
        sectionEl = document.getElementById(curPage + "_sec");
        sectionEl.classList.remove("hidden");
    }
}

function navButtonClickHandler(ev) {
    var target = getParentByClassName(ev.target,"navButton");
    if (!target) return;
    var targPageCode = target.id.split("_")[0];
    loadPage(targPageCode);
}

function initEventHandlers() {
    var navButtons = document.getElementsByClassName("navButton");
    for (var i = 0; i < navButtons.length; i++) {
        navButtons[i].addEventListener("click",navButtonClickHandler);
    }
}

function initPages() {
    initEventHandlers();
    if (window.location.href.indexOf("?") > -1) {
        var paramString = window.location.href.split("?")[1];
        if (paramString == HOME || paramString == ABOUT || paramString == TOUR) {
            loadPage(paramString);
            return;
        }
    }
    loadPage(HOME);
}
