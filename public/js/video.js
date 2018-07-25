var AUDIO_TIMING = 0.2;

const VID_TYPE_STR = "video/";

const FF_AUDIO_PATHS = ["./audio/ff.mp3"];
const RW_AUDIO_PATHS = ["./audio/rw.mp3"];

const FF_CODE        = "ff";
const RW_CODE        = "rw";

var videoElement;
var scrubBarElement;

var curVideoSpeed = 0;
var targScrubPerc = 0;
var scrubPerc = 0;

var beingMoved = false;

var curTween;

var ffSound;
var rwSound;
var curScrubSound;

function getVideoType(src) {
    var tokens = src.split(".");
    var ext = tokens[tokens.length-1];
    return VID_TYPE_STR + ext;
}

function isVideoPlaying() {
    return (videoElement && !videoElement.paused);
}

var videoUpdateIntervals;

function moveScrubBar() {
    if (!beingMoved) {
        scrubPerc = videoElement.currentTime / videoElement.duration;
    }
    scrubBarElement.style.left = (scrubPerc*window.innerWidth - (scrubBarElement.clientWidth/2)) + "px";
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

function scrubHandler(perc) {
    targScrubPerc = perc;

    scrubAmt = targScrubPerc - scrubPerc;
    scrubDir = scrubAmt/Math.abs(scrubAmt);

    if (scrubDir > 0) {                                                         // fast forward
        if (curScrubSound == RW_CODE) {
            rwSound.stop();
            curScrubSound = false;
        }
        if (curScrubSound != FF_CODE) {
            ffSound.play();
            curScrubSound = FF_CODE;
        }
        curScrubSound = FF_CODE;
    }
    else if (scrubDir < 0) {                                                    // rewind
        if (curScrubSound == FF_CODE) {
            ffSound.stop();
            curScrubSound = false;
        }
        if (curScrubSound != RW_CODE) {
            rwSound.play();
            curScrubSound = RW_CODE;
        }
        curScrubSound = RW_CODE;
    }

    beingMoved = true;
    if (curTween) {
        curTween.duration(AUDIO_TIMING);
        curTween.updateTo(
            {currentTime: (videoElement.duration * targScrubPerc)},true
        );
    }
    else {
        TweenMax.lagSmoothing(500,33);
        curTween = TweenMax.to(videoElement,AUDIO_TIMING, {
            currentTime: (videoElement.duration * targScrubPerc),
            // immediateRender: true,
            overwrite: "all",
            ease: Linear.easeInOut,
            onComplete: doneSeeking,
            onUpdate: function () {
                scrubPerc = videoElement.currentTime/videoElement.duration;
                moveScrubBar();
            }
        });
    }
}

function handleMouseMove(ev) {
    clearInterval(barUpdateInterval);
    var curX = ev.clientX;

    scrubHandler(curX / window.innerWidth);
}

function handleTouchMove(ev) {
    // stop touch event
    ev.stopPropagation();
    ev.preventDefault();

    // translate to mouse event
    var mEv = document.createEvent('MouseEvent');
    mEv.initMouseEvent('mousemove', true, true, window, ev.detail,
                 ev.touches[0].screenX, ev.touches[0].screenY,
                 ev.touches[0].clientX, ev.touches[0].clientY,
                 false, false, false, false,
                 0, null);
    handleMouseMove(mEv);
}

function handleMouseDown(ev) {
    videoElement.pause();
    // videoElement.muted = true;
    window.addEventListener("touchmove",handleTouchMove,false);
    window.addEventListener("mousemove",handleMouseMove);
}

function handleMouseUp(ev) {
    window.removeEventListener("touchmove",handleTouchMove,false);
    window.removeEventListener("mousemove",handleMouseMove);
}

var stopScrubSampleTimeout;

function doneSeeking() {
    beingMoved = false;
    videoElement.muted = false;
    barUpdateInterval = setInterval(moveScrubBar, 10);
    if (curScrubSound == FF_CODE) {
        ffSound.stop();
        curScrubSound = false;
    }
    if (curScrubSound == RW_CODE) {
        rwSound.stop();
        curScrubSound = false;
    }
    videoElement.play();
}

function initScrubBar() {
    scrubBarElement = document.getElementById('scrubBar');

    scrubBarElement.addEventListener("mousedown",handleMouseDown);
    window.addEventListener("mouseup",handleMouseUp);

    scrubBarElement.addEventListener("touchstart",handleMouseDown);
    window.addEventListener("touchend",handleMouseUp);
}

function loadScrubAudio() {
    ffSound = new Howl({
        src: FF_AUDIO_PATHS,
        loop: true,
        preload: true,
    });
    rwSound = new Howl({
        src: RW_AUDIO_PATHS,
        loop: true,
        preload: true,
        volume: 2
    });
}

function handleTogglePlayback(ev) {
    if (!ev || !ev.target) return;
    var target = getParentByClassName(ev.target,"scrubBar");
    if (target) return;
    target = getParentByClassName(ev.target,"navButton");
    if (target) return;
    target = getParentByClassName(ev.target,"option");
    if (target) return;
    videoElement.muted = !videoElement.muted;
    // if (isVideoPlaying()) videoElement.pause();
    // else {
    //     videoElement.play();
    // }
}

function initVideo(containerElement,srcArray) {
    loadScrubAudio();
    videoElement = createVideo(srcArray);
    containerElement.appendChild(videoElement);
    initScrubBar();

    window.addEventListener("click",handleTogglePlayback);

    barUpdateInterval = setInterval(moveScrubBar, 10);
}
