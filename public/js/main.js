function getParentByClassName(el,pClass) {
    while (!el.classList.contains(pClass)) {
        el = el.parentNode;
        if (el.tagName == "BODY") return false;
    }
    return el;
}

function init() {
    initVideo(document.getElementById("videoCont"),["./video/not_supposed.webm","./video/not_supposed.mp4"]);
    initPages();
}

window.onload = init;
