const VID_TYPE_STR = "video/";

var videoElement;
var scrubBarElement;

var curVideoSpeed = 0;
var targScrubPerc = 0;
var scrubPerc = 0;

function getVideoType(src) {
    var tokens = src.split(".");
    var ext = tokens[tokens.length-1];
    return VID_TYPE_STR + ext;
}

var videoUpdateIntervals;
var playbackHandlerInterval;

function moveScrubBar() {
    scrubBarElement.style.left = (targScrubPerc*window.innerWidth - (scrubBarElement.clientWidth/2)) + "px";
}

function updateScrubFromPlayback() {
    console.log(videoElement.currentTime);
    targScrubPerc = videoElement.currentTime/videoElement.duration;
    scrubPerc = targScrubPerc;
    moveScrubBar();
}

function updateVideoSpeed() {
    videoElement.currentTime = videoElement.duration * scrubPerc;
}

function createVideo(srcArray) {
    var video = document.createElement("video");
    video.autoplay = true;
    video.controls = false;
    video.muted = true;
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
    moveScrubBar();
}

function handleMouseDown(ev) {
    clearInterval(playbackHandlerInterval);
    window.addEventListener("mousemove",handleMouseMove);
    updateVideoSpeed = setInterval(updateVideoSpeed, 10);
}

function handleMouseUp(ev) {
    window.removeEventListener("mousemove",handleMouseMove);
}

function doneSeeking() {
    clearInterval(videoUpdateIntervals);
    playbackHandlerInterval = setInterval(updateScrubFromPlayback, 10);
}


function initScrubBar() {
    scrubBarElement = document.getElementById('scrubBar');

    scrubBarElement.addEventListener("mousedown",handleMouseDown);
    scrubBarElement.addEventListener("mouseup",handleMouseUp);
}

function initVideo(containerElement,srcArray) {
    videoElement = createVideo(srcArray);
    containerElement.appendChild(videoElement);
    initScrubBar();
    playbackHandlerInterval = setInterval(updateScrubFromPlayback, 10);
}
