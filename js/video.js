const VID_TYPE_STR = "video/";

var videoElement;
var scrubBarElement;

var curVideoSpeed = 0;
var targScrubPerc = 0;
var scrubPerc = 0;

var beingMoved = false;

var curTween;

function getVideoType(src) {
    var tokens = src.split(".");
    var ext = tokens[tokens.length-1];
    return VID_TYPE_STR + ext;
}

var videoUpdateIntervals;

function moveScrubBar() {
    if (!beingMoved) {
        var curTimePerc = videoElement.currentTime / videoElement.duration;
        scrubBarElement.style.left = (curTimePerc*window.innerWidth - (scrubBarElement.clientWidth/2)) + "px";
    }
    else {
        scrubBarElement.style.left = (targScrubPerc*window.innerWidth - (scrubBarElement.clientWidth/2)) + "px";
    }
}

var beingMovedTimeout;

function createVideo(srcArray) {
    var video = document.createElement("video");
    video.autoplay = true;
    video.controls = false;
    video.muted = true;
    video.preload = "auto";
    video.loop = true;
    video.preservepitch = true;
    for (var i = 0; i < srcArray.length; i++) {
        var srcElement = document.createElement("source");

        srcElement.src = srcArray[i];
        srcElement.type = getVideoType(srcArray[i]);
        video.appendChild(srcElement);
    }

    // add not supported warning
    var nsElement = document.createElement("p");
    nsElement.innerHTML = "Your browser does not support HTML5 video.";
    video.appendChild(nsElement);
    video.load();
    return video;
}

function handleMouseMove(ev) {
    var curX = ev.clientX;
    targScrubPerc = curX / window.innerWidth;
    // scrubPerc = targScrubPerc;
    beingMoved = true;
    if (curTween) {
        curTween.duration(Math.abs(targScrubPerc - scrubPerc) + 0.5);
        curTween.updateTo(
            {
                currentTime: (videoElement.duration * targScrubPerc),
            },
            true
        );
    }
    else {
        curTween = TweenMax.to(videoElement, Math.abs(targScrubPerc - scrubPerc) + 0.5, {
            currentTime: (videoElement.duration * targScrubPerc),
            // immediateRender: true,
            overwrite: "all",
            ease: Quad.easeInOut,
            onComplete: doneSeeking
        });
    }
}

function handleMouseDown(ev) {
    window.addEventListener("mousemove",handleMouseMove);
}

function handleMouseUp(ev) {
    window.removeEventListener("mousemove",handleMouseMove);
}

function doneSeeking() {
    beingMoved = false;
}

function initScrubBar() {
    scrubBarElement = document.getElementById('scrubBar');

    scrubBarElement.addEventListener("mousedown",handleMouseDown);
    window.addEventListener("mouseup",handleMouseUp);
}




var audioContext;




function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var buff = new Buffer(audioContext,["./audio/vid.ogg"]);
    buff.loadAll();

    var snd = new Sound(audioContext,buff.getSoundByIndex(0));
    snd.play();
}











function initVideo(containerElement,srcArray) {
    videoElement = createVideo(srcArray);
    containerElement.appendChild(videoElement);
    initScrubBar();
    initAudio();

    barUpdateInterval = setInterval(moveScrubBar, 10);
}
