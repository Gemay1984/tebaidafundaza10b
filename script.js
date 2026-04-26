/* ─── PROGRESS BARS: animate width on reveal ─── */
document.querySelectorAll('.temp-bar-fill').forEach(bar => {
    const targetWidth = bar.style.width;
    bar.style.width = '0';
    bar.dataset.target = targetWidth;
});

/* ─── INTERSECTION OBSERVER: reveal + bar animations ─── */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Animate bars inside
            entry.target.querySelectorAll('.temp-bar-fill').forEach(bar => {
                setTimeout(() => { bar.style.width = bar.dataset.target || '70%'; }, 300);
            });
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ─── NAVBAR: scroll effect ─── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
});

/* ─── MAP ─── */
const map = L.map('map').setView([4.4534, -75.7874], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const icons = {
    default: L.divIcon({ className:'', html:`<div style="background:#1b4332;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>` }),
    airport: L.divIcon({ className:'', html:`<div style="background:#ff4d6d;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>` }),
};

const poi = [
    { coords:[4.4528,-75.7876], name:"Parque de Bolívar", desc:"Corazón social y cultural del municipio.", icon:icons.default },
    { coords:[4.4531,-75.7885], name:"Parroquia Ntra. Sra. del Carmen", desc:"Arquitectura moderna y emblema espiritual.", icon:icons.default },
    { coords:[4.4447,-75.7728], name:"✈️ Aeropuerto El Edén", desc:"Principal acceso aéreo internacional al Quindío.", icon:icons.airport },
    { coords:[4.4600,-75.8000], name:"Valle de Maravelez", desc:"Confluencia de Ríos Quindío y Barragán → Río La Vieja.", icon:icons.default },
    { coords:[4.4560,-75.7850], name:"Corredor Gastronómico", desc:"Los mejores sabores del Quindío en un solo lugar.", icon:icons.default },
    { coords:[4.4490,-75.7750], name:"Zona Franca del Quindío", desc:"Motor de desarrollo económico e industrial.", icon:icons.default },
];
poi.forEach(p => {
    L.marker(p.coords, { icon: p.icon })
        .addTo(map)
        .bindPopup(`<strong>${p.name}</strong><br><small>${p.desc}</small>`, { maxWidth: 200 });
});

/* ─── WEATHER: Open-Meteo (free, no API key) ─── */
const WMO_CODES = {
    0: { label:'Despejado', icon:'☀️' },
    1: { label:'Mayormente despejado', icon:'🌤️' },
    2: { label:'Parcialmente nublado', icon:'⛅' },
    3: { label:'Nublado', icon:'☁️' },
    45: { label:'Neblina', icon:'🌫️' },
    48: { label:'Neblina con escarcha', icon:'🌫️' },
    51: { label:'Llovizna ligera', icon:'🌦️' },
    53: { label:'Llovizna moderada', icon:'🌦️' },
    55: { label:'Llovizna intensa', icon:'🌧️' },
    61: { label:'Lluvia ligera', icon:'🌧️' },
    63: { label:'Lluvia moderada', icon:'🌧️' },
    65: { label:'Lluvia intensa', icon:'🌧️' },
    80: { label:'Chubascos', icon:'🌦️' },
    81: { label:'Chubascos moderados', icon:'🌧️' },
    95: { label:'Tormenta eléctrica', icon:'⛈️' },
};

function getWMO(code) {
    return WMO_CODES[code] || { label:'Clima variable', icon:'🌈' };
}

const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

async function fetchWeather() {
    try {
        const url = 'https://api.open-meteo.com/v1/forecast?' +
            'latitude=4.45&longitude=-75.79' +
            '&current_weather=true' +
            '&hourly=relativehumidity_2m,apparent_temperature' +
            '&daily=weathercode,temperature_2m_max,temperature_2m_min' +
            '&timezone=America%2FBogota&forecast_days=5';

        const res = await fetch(url);
        const data = await res.json();
        const cw = data.current_weather;

        // Current weather
        const { label, icon } = getWMO(cw.weathercode);
        document.getElementById('weather-temp-display').textContent = `${Math.round(cw.temperature)}°C`;
        document.getElementById('weather-desc-display').textContent = label;
        document.getElementById('weather-icon').textContent = icon;
        document.getElementById('weather-wind').textContent = `${Math.round(cw.windspeed)} km/h`;

        // Apparent temp & humidity from first hourly slot
        if (data.hourly) {
            const idx = data.hourly.time.findIndex(t => t >= data.current_weather.time.slice(0,13));
            const i = idx >= 0 ? idx : 0;
            document.getElementById('weather-feels').textContent = `${Math.round(data.hourly.apparent_temperature[i])}°C`;
            document.getElementById('weather-humidity').textContent = `${data.hourly.relativehumidity_2m[i]}%`;
        }

        // Forecast Chart (SVG)
        if (data.daily) {
            const container = document.getElementById('forecast-days');
            const svg = document.getElementById('forecast-svg');
            if (container && svg) {
                container.innerHTML = '';
                const maxTemps = data.daily.temperature_2m_max;
                const minTemps = data.daily.temperature_2m_min;
                
                // SVG Chart Drawing
                const maxT = Math.max(...maxTemps) + 2;
                const minT = Math.min(...minTemps) - 2;
                const range = maxT - minT;
                const w = 400; const h = 100;
                const dx = w / 4;
                
                let pointsStr = '';
                for (let i = 0; i < 5; i++) {
                    const x = i * dx;
                    const y = h - ((maxTemps[i] - minT) / range) * h + 10;
                    pointsStr += `${x},${y} `;
                }
                
                svg.innerHTML = `
                    <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stop-color="#40916c"/>
                            <stop offset="100%" stop-color="#f9c74f"/>
                        </linearGradient>
                    </defs>
                    <polyline fill="none" stroke="url(#lineGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${pointsStr.trim()}"/>
                `;

                for (let i = 0; i < 5; i++) {
                    const x = i * dx;
                    const y = h - ((maxTemps[i] - minT) / range) * h + 10;
                    svg.innerHTML += `<circle cx="${x}" cy="${y}" r="5" fill="#fff" stroke="#f9c74f" stroke-width="2"/>`;
                    svg.innerHTML += `<text x="${x}" y="${y - 12}" fill="rgba(255,255,255,0.9)" font-size="14" font-family="Outfit" font-weight="700" text-anchor="middle">${Math.round(maxTemps[i])}°</text>`;

                    const date = new Date(data.daily.time[i] + 'T12:00:00');
                    const dayName = DAY_NAMES[date.getDay()];
                    const { icon: fIcon } = getWMO(data.daily.weathercode[i]);
                    container.innerHTML += `
                        <div class="fday-chart-item" style="width: ${100/5}%">
                            <span>${dayName}</span>
                            <span class="fday-chart-icon">${fIcon}</span>
                            <span style="opacity:0.6;font-size:0.7rem;margin-top:4px;">${Math.round(minTemps[i])}°</span>
                        </div>`;
                }
            }
        }
        
        // Day/Night Cycle based on real hour in Colombia
        const hour = new Date().toLocaleString("en-US", {timeZone: "America/Bogota", hour: 'numeric', hour12: false});
        const isNight = hour >= 18 || hour < 6;
        if (isNight) {
            document.body.classList.add('night-mode');
        } else {
            document.body.classList.remove('night-mode');
        }
        document.querySelector('.weather-main').classList.add('premium');
    } catch (err) {
        document.getElementById('weather-desc-display').textContent = 'No disponible';
        console.warn('Weather error:', err);
    }
}

fetchWeather();
setInterval(fetchWeather, 10 * 60 * 1000); // refresh every 10 min

/* ─── SMOOTH SCROLL ─── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});

/* ─── SCROLL PROGRESS BAR ─── */
const progressBar = document.getElementById('scroll-progress');
const backTop     = document.getElementById('back-top');
const parallaxImg = document.querySelector('.parallax-img');

window.addEventListener('scroll', () => {
    const scrolled  = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const pct       = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;

    // Progress bar
    if (progressBar) progressBar.style.width = pct + '%';

    // Back to top visibility
    if (backTop) backTop.classList.toggle('visible', scrolled > 400);

    // Parallax hero image
    if (parallaxImg && scrolled < window.innerHeight) {
        parallaxImg.style.transform = `translateY(${scrolled * 0.3}px) scale(1.1)`;
    }

    // Active nav link highlight
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(sec => {
        const top    = sec.offsetTop - 120;
        const bottom = top + sec.offsetHeight;
        const link   = document.querySelector(`.nav-links a[href="#${sec.id}"]`);
        if (link) link.classList.toggle('active', scrolled >= top && scrolled < bottom);
    });
}, { passive: true });

// Back to top click
if (backTop) {
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ─── ANIMATED COUNTERS ─── */
function animateCounter(el) {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const step = target / (duration / 16);
    let current = 0;
    const id = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current).toLocaleString('es-CO') + suffix;
        if (current >= target) clearInterval(id);
    }, 16);
}
const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('[data-count]').forEach(animateCounter);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });
const heroStats = document.querySelector('.hero-stats');
if (heroStats) counterObserver.observe(heroStats);

/* ─── CUSTOM CURSOR ─── */
const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');

if (cursor && cursorRing) {
    let ringX = 0, ringY = 0;
    let curX  = 0, curY  = 0;

    document.addEventListener('mousemove', e => {
        curX = e.clientX; curY = e.clientY;
        cursor.style.left = curX + 'px';
        cursor.style.top  = curY + 'px';
    });

    // Ring follows with lag
    function animateRing() {
        ringX += (curX - ringX) * 0.15;
        ringY += (curY - ringY) * 0.15;
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top  = ringY + 'px';
        requestAnimationFrame(animateRing);
    }
    animateRing();

    // Hover effect on interactive elements
    document.querySelectorAll('a,button,[onclick],input,label').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            cursorRing.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            cursorRing.classList.remove('hover');
        });
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        cursorRing.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
        cursorRing.style.opacity = '1';
    });
}

/* ─── SVG GEO MAP: interactive pins ─── */
const geoTooltip = document.getElementById('geo-tooltip');
if (geoTooltip) {
    document.querySelectorAll('#geo-svg .svg-pin').forEach(pin => {
        pin.addEventListener('click', () => {
            const info = pin.getAttribute('data-info');
            geoTooltip.textContent = info;
            geoTooltip.style.borderColor = '#74c0fc';
            setTimeout(() => { geoTooltip.style.borderColor = '#4dabf7'; }, 800);
        });
    });
}

/* ─── TTS ACCESSIBILITY ─── */
const ttsBtn = document.getElementById('tts-btn');
const ttsIcon = document.getElementById('tts-icon');
let ttsUtterance = null;
let ttsActive = false;

function getPageText() {
    const sections = [
        document.querySelector('.hero-content'),
        document.getElementById('geografia'),
        document.getElementById('clima'),
        document.getElementById('historia'),
        document.getElementById('curiosidades'),
    ];
    return sections
        .filter(Boolean)
        .map(s => s.innerText || s.textContent)
        .join('. ')
        .replace(/\s+/g, ' ')
        .trim();
}

function stopTTS() {
    speechSynthesis.cancel();
    ttsActive = false;
    ttsBtn.classList.remove('tts-active');
    ttsIcon.textContent = '🔊';
    ttsBtn.querySelector('.tts-label').textContent = 'Escuchar';
}

if (ttsBtn && 'speechSynthesis' in window) {
    ttsBtn.addEventListener('click', () => {
        if (ttsActive) {
            stopTTS();
            return;
        }
        const text = getPageText();
        ttsUtterance = new SpeechSynthesisUtterance(text);
        ttsUtterance.lang = 'es-CO';
        ttsUtterance.rate = 0.95;
        ttsUtterance.pitch = 1;
        // Try to use a Spanish voice
        const voices = speechSynthesis.getVoices();
        const esVoice = voices.find(v => v.lang.startsWith('es'));
        if (esVoice) ttsUtterance.voice = esVoice;
        ttsUtterance.onend = stopTTS;
        ttsUtterance.onerror = stopTTS;
        speechSynthesis.speak(ttsUtterance);
        ttsActive = true;
        ttsBtn.classList.add('tts-active');
        ttsIcon.textContent = '⏹️';
        ttsBtn.querySelector('.tts-label').textContent = 'Detener';
    });
} else if (ttsBtn) {
    ttsBtn.title = 'Lectura de voz no disponible en este navegador';
    ttsBtn.style.opacity = '0.5';
    ttsBtn.style.cursor = 'not-allowed';
}

/* ─── HAMBURGER MENU ─── */
function toggleMenu() {
    const links = document.getElementById('nav-links');
    const btn = document.getElementById('hamburger');
    links.classList.toggle('mobile-open');
    btn.classList.toggle('open');
    document.body.style.overflow = links.classList.contains('mobile-open') ? 'hidden' : '';
}
function closeMenu() {
    const links = document.getElementById('nav-links');
    const btn = document.getElementById('hamburger');
    links.classList.remove('mobile-open');
    btn.classList.remove('open');
    document.body.style.overflow = '';
}

/* ─── LIGHTBOX GALLERY ─── */
const lbImages = [
    { src: 'hero_new.jpg',       caption: '📸 Panorámica Municipal de La Tebaida' },
    { src: 'main_photo.png',     caption: '🏛️ Centro Histórico' },
    { src: 'relief.png',         caption: '🌿 Valle de Maravelez — Confluencia de ríos' },
    { src: 'escudo_oficial.png', caption: '🛡️ Escudo Oficial del Municipio de La Tebaida' },
];
let lbCurrent = 0;

function openLightbox(idx) {
    lbCurrent = idx;
    const lb = document.getElementById('lightbox');
    lb.classList.add('open');
    document.getElementById('lb-img').src     = lbImages[idx].src;
    document.getElementById('lb-caption').textContent = lbImages[idx].caption;
    document.body.style.overflow = 'hidden';
}
function closeLightbox(e) {
    if (e && e.target !== document.getElementById('lightbox')) return;
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
}
function lbNav(dir, e) {
    if (e) e.stopPropagation();
    lbCurrent = (lbCurrent + dir + lbImages.length) % lbImages.length;
    const img = document.getElementById('lb-img');
    img.style.opacity = '0';
    setTimeout(() => {
        img.src = lbImages[lbCurrent].src;
        document.getElementById('lb-caption').textContent = lbImages[lbCurrent].caption;
        img.style.opacity = '1';
    }, 200);
    img.style.transition = 'opacity 0.2s';
}
document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft')  lbNav(-1, null);
    if (e.key === 'ArrowRight') lbNav(1, null);
});
// Touch swipe for lightbox
let lbTouchX = null;
document.getElementById('lightbox')?.addEventListener('touchstart', e => { lbTouchX = e.touches[0].clientX; });
document.getElementById('lightbox')?.addEventListener('touchend', e => {
    if (!lbTouchX) return;
    const diff = lbTouchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) lbNav(diff > 0 ? 1 : -1, null);
    lbTouchX = null;
});

/* ─── TREASURE TRIVIA ─── */
const TRIVIA = [
    {
        q: '¿Cuál es la altitud aproximada de La Tebaida?',
        opts: ['1.200 msnm', '2.100 msnm', '800 msnm', '1.600 msnm'],
        correct: 0,
        exp: '✅ La Tebaida es el municipio de menor altitud del Quindío: 1.200 msnm.'
    },
    {
        q: '¿Qué dos ríos confluyen en el Valle de Maravelez para formar el Río La Vieja?',
        opts: ['Quindío y Cauca', 'Quindío y Barragán', 'Barragán y Atrato', 'La Vieja y Quindío'],
        correct: 1,
        exp: '✅ El Río Quindío y el Río Barragán se unen en Maravelez formando el Río La Vieja.'
    },
    {
        q: '¿En qué año fue fundado oficialmente el municipio de La Tebaida?',
        opts: ['1890', '1916', '1923', '1905'],
        correct: 1,
        exp: '✅ La Tebaida fue fundada el 24 de junio de 1916 por Pedro y Luis Enrique Arango.'
    },
    {
        q: '¿Cómo se llama el aeropuerto ubicado en La Tebaida?',
        opts: ['El Paraíso', 'El Edén', 'Matecaña', 'La Nubia'],
        correct: 1,
        exp: '✅ El Aeropuerto Internacional El Edén es el único aeropuerto del Quindío.'
    },
    {
        q: '¿Cuál es la relación de La Tebaida con el Paisaje Cultural Cafetero (PCC) de la UNESCO?',
        opts: ['Está en la lista oficial', 'Es la capital del PCC', 'Está en su área de influencia', 'No tiene relación'],
        correct: 2,
        exp: '✅ Aunque no está en la lista oficial de la UNESCO (2011), La Tebaida forma parte de su área de influencia y cultura viva.'
    },
];

let triviaIdx = 0;
let triviaCorrect = 0;
let triviaWaiting = false;

function openTreasure() {
    document.getElementById('trivia-overlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function closeTreasure() {
    document.getElementById('trivia-overlay').style.display = 'none';
    document.body.style.overflow = '';
}
function showScreen(id) {
    ['trivia-screen-intro','trivia-screen-game','trivia-screen-win','trivia-screen-lose']
        .forEach(s => document.getElementById(s).style.display = 'none');
    document.getElementById(id).style.display = 'block';
}
function startTrivia() {
    triviaIdx = 0;
    triviaCorrect = 0;
    triviaWaiting = false;
    showScreen('trivia-screen-game');
    renderQuestion();
}
function renderQuestion() {
    const q = TRIVIA[triviaIdx];
    document.getElementById('trivia-q-num').textContent = `Pregunta ${triviaIdx+1} de ${TRIVIA.length}`;
    document.getElementById('trivia-bar-fill').style.width = `${(triviaIdx / TRIVIA.length) * 100}%`;
    document.getElementById('trivia-question').textContent = q.q;
    document.getElementById('trivia-feedback').textContent = '';
    const opts = document.getElementById('trivia-options');
    opts.innerHTML = '';
    q.opts.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'trivia-opt-btn';
        btn.textContent = opt;
        btn.onclick = () => answerTrivia(i);
        opts.appendChild(btn);
    });
    triviaWaiting = false;
}
function answerTrivia(chosen) {
    if (triviaWaiting) return;
    triviaWaiting = true;
    const q = TRIVIA[triviaIdx];
    const btns = document.querySelectorAll('.trivia-opt-btn');
    btns.forEach(b => b.disabled = true);
    btns[chosen].classList.add(chosen === q.correct ? 'correct' : 'wrong');
    if (chosen === q.correct) {
        btns[q.correct].classList.add('correct');
        triviaCorrect++;
        document.getElementById('trivia-feedback').textContent = q.exp;
    } else {
        btns[q.correct].classList.add('correct');
        document.getElementById('trivia-feedback').textContent = `❌ ${q.exp}`;
    }
    setTimeout(() => {
        triviaIdx++;
        if (triviaIdx >= TRIVIA.length) {
            document.getElementById('trivia-bar-fill').style.width = '100%';
            if (triviaCorrect >= 4) {
                showScreen('trivia-screen-win');
                launchConfetti();
            } else {
                showScreen('trivia-screen-lose');
            }
        } else {
            renderQuestion();
        }
    }, 1800);
}

/* ─── CONFETTI ─── */
function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const colors = ['#ff4d6d','#f9c74f','#40916c','#4dabf7','#d4a373','#a9d6e5'];
    const pieces = Array.from({length: 100}, () => ({
        x: Math.random() * canvas.width,
        y: -10,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        angle: Math.random() * 360,
        spin: (Math.random() - 0.5) * 8,
        drift: (Math.random() - 0.5) * 2,
    }));
    let frame = 0;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.angle * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
            p.y += p.speed;
            p.x += p.drift;
            p.angle += p.spin;
            if (p.y > canvas.height) {
                p.y = -10;
                p.x = Math.random() * canvas.width;
            }
        });
        if (frame++ < 300) requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    draw();
}
 
