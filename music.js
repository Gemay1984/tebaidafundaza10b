/* ═══════════════════════════════════════════════════════════
   SPLASH SCREEN + BACKGROUND MUSIC — La Tebaida
   ═══════════════════════════════════════════════════════════ */

const audio   = document.getElementById('bg-audio');
const btn     = document.getElementById('music-btn');
const icon    = document.getElementById('music-icon');
const bars    = document.getElementById('music-bars');
const volSldr = document.getElementById('music-vol');
const control = document.getElementById('music-control');
const splash  = document.getElementById('splash');

/* ── Helpers ── */
function fadeAudioIn(target) {
    audio.volume = 0;
    const step = target / 40;
    const id = setInterval(() => {
        audio.volume = Math.min(audio.volume + step, target);
        if (audio.volume >= target) clearInterval(id);
    }, 50);
}

function fadeAudioOut(cb) {
    const id = setInterval(() => {
        audio.volume = Math.max(audio.volume - 0.04, 0);
        if (audio.volume <= 0) {
            clearInterval(id);
            audio.pause();
            if (cb) cb();
        }
    }, 50);
}

function setPlayUI(playing) {
    if (playing) {
        icon.textContent = '⏸️';
        btn.classList.add('playing');
        bars.classList.add('active');
    } else {
        icon.textContent = '🎵';
        btn.classList.remove('playing');
        bars.classList.remove('active');
    }
}

/* ── Enter site → start music ── */
window.enterSite = function () {
    // Dismiss splash
    splash.classList.add('hidden');
    setTimeout(() => { splash.style.display = 'none'; }, 900);

    // Play music — click already happened so browser allows it
    if (!audio) return;
    audio.play().then(() => {
        fadeAudioIn(parseFloat(volSldr ? volSldr.value : 0.4));
        setPlayUI(true);
    }).catch(err => {
        console.warn('Audio error:', err);
        setPlayUI(false);
    });
};

/* ── Music button: toggle play/pause ── */
if (btn && audio) {
    btn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().then(() => {
                fadeAudioIn(parseFloat(volSldr.value));
                setPlayUI(true);
            });
        } else {
            fadeAudioOut(() => setPlayUI(false));
        }
    });
}

/* ── Volume slider ── */
if (volSldr && audio) {
    volSldr.addEventListener('input', () => {
        if (!audio.paused) audio.volume = parseFloat(volSldr.value);
    });
}

/* ── Expand info panel on hover ── */
if (control) {
    control.addEventListener('mouseenter', () => control.classList.add('expanded'));
    control.addEventListener('mouseleave', () => control.classList.remove('expanded'));
}
