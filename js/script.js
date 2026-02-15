// =============================
// YouTube API Setup
// =============================
const API_KEY = "AIzaSyAAq7p-BkiMsQ7Efm3PW6pjp8REPd5o6vI";
const PLAYLIST_ID = "PLKdU0fuY4OFfWY36nDJDlI26jXwInSm8f";

let player;
let videos = [];
let currentIndex = parseInt(localStorage.getItem("videoIndex")) || 0;
let watchedVideos = JSON.parse(localStorage.getItem("watchedVideos")) || [];

// =============================
// YouTube Player
// =============================
function onYouTubeIframeAPIReady() {
    player = new YT.Player("player", {
        height: "500",
        width: "100%",
        videoId: "",
        events: { 'onStateChange': onPlayerStateChange }
    });
    fetchVideos();
}

// =============================
// Fetch YouTube playlist
// =============================
async function fetchVideos() {
    try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}`);
        const data = await res.json();
        if (data.items) {
            videos = data.items.map(item => ({
                title: item.snippet.title,
                id: item.snippet.resourceId.videoId
            }));
        }
        renderPlaylist();
        loadSavedVideo();
    } catch (error) {
        console.error("Failed to fetch playlist:", error);
    }
}

// =============================
// Load saved video
// =============================
function loadSavedVideo() {
    if (!videos.length) return;
    const savedTime = parseFloat(localStorage.getItem("videoTime")) || 0;
    player.loadVideoById({ videoId: videos[currentIndex].id, startSeconds: savedTime });
    highlightCurrent();
    updateProgress();
}

// =============================
// Video navigation
// =============================
function loadVideo(index) {
    currentIndex = index;
    if (!watchedVideos.includes(index)) {
        watchedVideos.push(index);
        localStorage.setItem("watchedVideos", JSON.stringify(watchedVideos));
    }
    player.loadVideoById(videos[currentIndex].id);
    localStorage.setItem("videoIndex", currentIndex);
    localStorage.setItem("videoTime", 0);
    highlightCurrent();
    updateProgress();
}

function nextVideo() { if (currentIndex < videos.length - 1) loadVideo(currentIndex + 1); }
function prevVideo() { if (currentIndex > 0) loadVideo(currentIndex - 1); }

// =============================
// Player state change
// =============================
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        if (!watchedVideos.includes(currentIndex)) {
            watchedVideos.push(currentIndex);
            localStorage.setItem("watchedVideos", JSON.stringify(watchedVideos));
        }
        updateProgress();
        renderPlaylist();
        nextVideo();
    }
}

// =============================
// Playlist rendering
// =============================
function renderPlaylist() {
    const list = document.getElementById("playlist");
    list.innerHTML = "";
    videos.forEach((v, i) => {
        const div = document.createElement("div");
        div.className = "video-item";
        div.innerHTML = `
          <img src="https://img.youtube.com/vi/${v.id}/hqdefault.jpg">
          <div class="video-info">
            <div class="video-title">
              ${v.title} ${watchedVideos.includes(i) ? '<span class="watched-badge">✔ Watched</span>' : ''}
            </div>
          </div>
        `;
        div.onclick = () => loadVideo(i);
        list.appendChild(div);
    });
    highlightCurrent();
    updateProgress();
}

// =============================
// Highlight current video
// =============================
function highlightCurrent() {
    document.querySelectorAll(".video-item").forEach((el, i) => {
        el.classList.remove("active");
        if (i === currentIndex) el.classList.add("active");
    });
}

// =============================
// Search
// =============================
function searchVideo() {
    const value = document.getElementById("search").value.toLowerCase();
    document.querySelectorAll(".video-item").forEach(el => {
        el.style.display = el.innerText.toLowerCase().includes(value) ? "flex" : "none";
    });
}

// =============================
// Dark / Light Mode
// =============================
function toggleMode() { document.body.classList.toggle("light"); }

// =============================
// Update course progress
// =============================
function updateProgress() {
    const percent = (watchedVideos.length / videos.length) * 100;
    document.getElementById("progressText").innerText = "Course Progress: " + Math.round(percent) + "%";
    document.getElementById("courseProgressFill").style.width = percent + "%";
}

// =============================
// Video progress bar
// =============================
setInterval(() => {
    if (player && player.getPlayerState() === YT.PlayerState.PLAYING) {
        const currentTime = player.getCurrentTime();
        localStorage.setItem("videoTime", currentTime);
        const duration = player.getDuration();
        const percent = duration ? (currentTime / duration) * 100 : 0;
        document.getElementById("progressBar").style.width = percent + "%";
    }
}, 500);
