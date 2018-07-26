function getCss( element, property ) {
    return window.getComputedStyle( element, null ).getPropertyValue( property );
}

function getParentByClassName(el,pClass) {
    try {
        while (!el.classList.contains(pClass)) {
            el = el.parentNode;
            if (el.tagName == "BODY") return false;
        }
        return el;
    } catch (e) {
        return;
    }
}

function init() {
    initVideo(["./video/not_supposed.webm","./video/not_supposed.ogv","./video/not_supposed.mp4"]);
    initPages();
}

window.onload = init;
