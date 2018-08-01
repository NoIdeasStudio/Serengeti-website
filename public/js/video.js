var AUDIO_TIMING = 0.2;

const VID_TYPE_STR = "video/";

const FF_AUDIO_PATHS = ["./audio/ff.mp3"];
const RW_AUDIO_PATHS = ["./audio/rw.mp3"];

const FF_CODE        = "ff";
const RW_CODE        = "rw";

var hasWebGL;

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

var container;
var camera, scene, renderer, videoTexture, mesh;
var uniforms;

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
    scrubBarElement.style.left = (scrubPerc*(window.innerWidth - scrubBarElement.clientWidth)) + "px";
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

    // add "not supported" warning
    var nsElement = document.createElement("p");
    nsElement.innerHTML = "Your browser does not support HTML5 video.";
    video.appendChild(nsElement);
    video.load();

    if (hasWebGL) {
        // begin three.js stuff for glitch effect
        container = document.getElementById( "videoCont" );

        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
        camera.position.z = 1;

        scene = new THREE.Scene();

        var geometry = new THREE.PlaneBufferGeometry( 3, 3 );

        videoTexture = new THREE.Texture( video );
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.repeat.set( 2, 2 );
        videoTexture.wrapS = THREE.ClampToEdgeWrapping;
        videoTexture.wrapT = THREE.ClampToEdgeWrapping;

        uniforms = {
            u_time: { type: "f", value: 1.0 },
            u_resolution: { type: "v2", value: new THREE.Vector2() },
            u_mouse: { type: "v2", value: new THREE.Vector2() },
            u_vid_dims: { type: "v2", value: new THREE.Vector2(video.videoWidth,video.videoHeight) },
            u_texture: { type: "t", value: videoTexture },
            u_donoise: { type: "f", value: 0.0 }
        };

        var material = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: document.getElementById( "vertexShader" ).textContent,
            fragmentShader: document.getElementById( "fragmentShader" ).textContent
        } );

        mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );

        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );

        container.appendChild( renderer.domElement );

        onWindowResize();
        window.addEventListener( "resize", onWindowResize, false );

        document.onmousemove = function(e){
            uniforms.u_mouse.value.x = e.pageX
            uniforms.u_mouse.value.y = e.pageY
        }

        videoElement = video;
        videoElement.play();
        animate();
    } else {
        videoElement = video;
        document.getElementById("videoCont").appendChild(videoElement)
        videoElement.play();
    }

}

function onWindowResize( event ) {
    renderer.setSize( window.innerWidth, window.innerHeight );
    uniforms.u_resolution.value.x = window.innerWidth/window.innerHeight;
    uniforms.u_resolution.value.y = 1;
}

function animate() {
    requestAnimationFrame( animate );
    render();
}

function render() {
    uniforms.u_time.value += 0.05;
    if ( videoElement.readyState === videoElement.HAVE_ENOUGH_DATA ) {
        videoTexture.needsUpdate = true;
        uniforms.u_vid_dims.value.x = videoElement.videoWidth;
        uniforms.u_vid_dims.value.y = videoElement.videoHeight;
    }

    renderer.render( scene, camera );
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
        ffSound.rate = (Math.abs(scrubAmt) * 200).toFixed(0);
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
        rwSound.rate = (Math.abs(scrubAmt) * 200).toFixed(0);
        curScrubSound = RW_CODE;
    }

    if (hasWebGL) uniforms.u_donoise.value = Math.abs(scrubAmt) * 50;

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
            }
        });
    }
}

function handleMouseMove(ev) {
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
    if (hasWebGL) uniforms.u_donoise.value = 0;
    if (curScrubSound == FF_CODE) {
        ffSound.stop();
        curScrubSound = false;
    }
    if (curScrubSound == RW_CODE) {
        rwSound.stop();
        curScrubSound = false;
    }
    videoElement.play();
    setTimeout(function () {
        videoElement.play();
    }, 10);
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
    if (document.getElementById("audioToggle").classList.contains("crossed")) {
        document.getElementById("audioToggle").classList.remove("crossed");
    }
    else {
        document.getElementById("audioToggle").classList.add("crossed");
    }
}

function initVideo(srcArray) {
    hasWebGL = Detector.webgl;
    loadScrubAudio();
    createVideo(srcArray);
    initScrubBar();

    document.getElementById("audioToggle").addEventListener("click",handleTogglePlayback);

    barUpdateInterval = setInterval(moveScrubBar, 10);
}
