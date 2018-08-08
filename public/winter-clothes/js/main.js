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
    initVideo(["./video/winter_clothes.mp4","./video/winter_clothes.webm","./video/winter_clothes.ogv"]);
    initPages();
}

window.onload = init;
