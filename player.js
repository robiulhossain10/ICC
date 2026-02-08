let player;
let video;
let currentStream = null;

async function initPlayer() {

  video = document.getElementById("video");

  const ui = video.ui;
  const controls = ui.getControls();
  player = controls.getPlayer();

  // ===== PRO STREAM CONFIG =====
  player.configure({
    streaming: {
      bufferingGoal: 30,
      rebufferingGoal: 3,
      bufferBehind: 15,
      lowLatencyMode: true,
      jumpLargeGaps: true
    }
  });

  // ===== ERROR HANDLER =====
  player.addEventListener("error", onPlayerError);
  video.addEventListener("error", onVideoError);

  // ===== NETWORK RECOVERY =====
  window.addEventListener("online", () => {
    if (currentStream) loadStream(currentStream);
  });

  loadStream(1);
}

function onPlayerError(e) {
  console.error("Shaka Player Error:", e.detail);
  showMessage("Playback error. Retrying...");
  retryStream();
}

function onVideoError(e) {
  console.error("Video Error:", e);
  showMessage("Video error occurred.");
}

async function loadStream(id) {

  try {

    currentStream = id;

    showLoader(true);

    const s = window.STREAM_CONFIG[id];

    if (!s) {
      showMessage("Stream config not found");
      return;
    }

    await player.unload();

    // ===== CLEARKEY DRM =====
    if (s.clearkey) {
      player.configure({
        drm: {
          clearKeys: {
            [s.clearkey.keyId]: s.clearkey.key
          }
        }
      });
    }

    console.log("Loading Stream:", s.mpd);

    await player.load(s.mpd);

    hideMessage();
    showLoader(false);

    safePlay();

  } catch (err) {
    console.error("Stream Load Failed:", err);
    showMessage("Stream load failed. Retrying...");
    retryStream();
  }
}

// ===== SAFE AUTOPLAY =====
async function safePlay() {
  try {
    await video.play();
  } catch {
    video.muted = true;
    video.play();
  }
}

// ===== RETRY SYSTEM =====
function retryStream() {
  setTimeout(() => {
    if (currentStream) loadStream(currentStream);
  }, 3000);
}

/* ================= UI HELPERS ================= */

function showLoader(state) {
  const el = document.getElementById("loader");
  if (el) el.style.display = state ? "flex" : "none";
}

function showMessage(msg) {
  const el = document.getElementById("message");
  if (el) {
    el.innerText = msg;
    el.style.display = "block";
  }
}

function hideMessage() {
  const el = document.getElementById("message");
  if (el) el.style.display = "none";
}
