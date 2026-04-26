/* ═══════════════════════════════════════════════════════════
   INTERACTIVIDAD AVANZADA — Charts, Timeline, Topo SVG
   ═══════════════════════════════════════════════════════════ */

/* ── TOPOGRAPHIC PROFILE INTERACTIVITY ── */
(function () {
    const svg      = document.getElementById('topo-svg');
    const cursor   = document.getElementById('topo-cursor');
    const dot      = document.getElementById('topo-dot');
    const tooltip  = document.getElementById('topo-tooltip');
    const ttLabel  = document.getElementById('topo-tt-label');
    const ttAlt    = document.getElementById('topo-tt-alt');
    const ttDesc   = document.getElementById('topo-tt-desc');
    const zoneHL   = document.getElementById('topo-zone-hl');

    if (!svg) return;

    // Approximate Y-coordinate of the profile at each SVG X (sampled)
    // Based on path: M0,130 Q50,100 Q150,80 Q250,30 Q350,80 Q450,90 Q600,100 Q700,105 Q900,110
    function getProfileY(svgX) {
        const pct = svgX / 900;
        if (pct < 0.15) return 130 - pct * 200; // descends
        if (pct < 0.30) return 100 - (pct - 0.15) * 330; // rises to peak
        if (pct < 0.35) return 50 + (pct - 0.30) * 600;  // drops
        if (pct < 0.55) return 80 + (pct - 0.35) * 75;  // plateau
        if (pct < 0.80) return 95 + (pct - 0.55) * 40;
        return 105 + (pct - 0.80) * 25;
    }

    function altFromY(y) {
        // SVG Y 30 = ~1900m, Y 200 = ~950m
        const m = 950 + (200 - y) / 170 * 950;
        return Math.round(m / 50) * 50;
    }

    svg.addEventListener('mousemove', e => {
        const rect  = svg.getBoundingClientRect();
        const scaleX = 900 / rect.width;
        const svgX  = (e.clientX - rect.left) * scaleX;
        const svgY  = getProfileY(svgX);
        const alt   = altFromY(svgY);

        // Move cursor line & dot
        cursor.setAttribute('x1', svgX); cursor.setAttribute('x2', svgX);
        dot.setAttribute('cx', svgX);    dot.setAttribute('cy', svgY);

        // Find active zone
        const zones = svg.querySelectorAll('.topo-zone');
        let activeZone = null;
        zones.forEach(z => {
            const zx = parseFloat(z.getAttribute('x'));
            const zw = parseFloat(z.getAttribute('width'));
            if (svgX >= zx && svgX <= zx + zw) activeZone = z;
        });

        if (activeZone) {
            const zx = parseFloat(activeZone.getAttribute('x'));
            const zw = parseFloat(activeZone.getAttribute('width'));
            zoneHL.setAttribute('x', zx);
            zoneHL.setAttribute('width', zw);
            ttLabel.textContent = activeZone.dataset.label;
            ttAlt.textContent   = activeZone.dataset.alt;
            ttDesc.textContent  = activeZone.dataset.desc;
            tooltip.style.display = 'block';
        }
    });

    svg.addEventListener('mouseleave', () => {
        cursor.setAttribute('x1', -1); cursor.setAttribute('x2', -1);
        dot.setAttribute('cx', -10);   dot.setAttribute('cy', -10);
        zoneHL.setAttribute('width', 0);
        tooltip.style.display = 'none';
    });
})();

/* ── TIMELINE: EXPAND ON CLICK ── */
(function () {
    // Extra details for each timeline card by year text
    const extras = {
        '1916': 'Pedro y Luis Enrique Arango impulsaron la colonización antioqueña en estas tierras fértiles del Quindío, fundando La Tebaida el 24 de junio.',
        '1959': 'La construcción de las vías permitió conectar a La Tebaida con Armenia y el resto del Quindío, impulsando el comercio del café.',
        '1966': 'Con la fundación oficial del municipio se establecieron sus primeras instituciones públicas y se trazó el plan urbanístico del centro.',
        '1999': 'El terremoto del Quindío (25 enero) afectó severamente la región. La reconstrucción transformó la infraestructura urbana.',
        '2011': 'La UNESCO reconoció el Paisaje Cultural Cafetero, del que La Tebaida hace parte, como Patrimonio Mundial de la Humanidad.',
    };

    document.querySelectorAll('.tl-card').forEach(card => {
        const yearEl = card.querySelector('.tl-year');
        if (!yearEl) return;
        const year = yearEl.textContent.trim();
        const extra = extras[year];
        if (!extra) return;

        // Add expand icon
        const title = card.querySelector('h3');
        if (title) {
            const icon = document.createElement('span');
            icon.className = 'tl-expand-icon';
            icon.textContent = '▾';
            title.appendChild(icon);
        }

        // Add extra content div
        const extraDiv = document.createElement('div');
        extraDiv.className = 'tl-card-extra';
        extraDiv.textContent = extra;
        card.appendChild(extraDiv);

        card.addEventListener('click', () => {
            card.classList.toggle('expanded');
        });
    });

    // Animated progress line on scroll
    const timeline = document.querySelector('.timeline-pro');
    if (!timeline) return;

    const progressLine = document.createElement('div');
    progressLine.className = 'timeline-progress-line';
    timeline.insertBefore(progressLine, timeline.firstChild);

    function updateProgress() {
        const rect = timeline.getBoundingClientRect();
        const viewH = window.innerHeight;
        if (rect.bottom < 0 || rect.top > viewH) return;
        const visible = Math.max(0, Math.min(rect.bottom, viewH) - Math.max(rect.top, 0));
        const pct = Math.min(100, (visible / rect.height) * 130);
        progressLine.style.height = pct + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
})();

/* ── CLIMATE BARS: TOOLTIP ON HOVER ── */
(function () {
    document.querySelectorAll('.temp-bar-wrap').forEach(wrap => {
        const bar = wrap.querySelector('.temp-bar-fill');
        if (!bar) return;
        const label = wrap.closest('.temp-row')?.querySelector('.temp-label');
        const valueEl = wrap.closest('.temp-row')?.querySelector('.temp-value');
        if (!valueEl) return;

        wrap.style.cursor = 'pointer';
        wrap.addEventListener('mouseenter', () => {
            bar.style.filter = 'brightness(1.2)';
            valueEl.style.fontWeight = '800';
            valueEl.style.color = '#40916c';
        });
        wrap.addEventListener('mouseleave', () => {
            bar.style.filter = '';
            valueEl.style.fontWeight = '';
            valueEl.style.color = '';
        });
    });
})();

/* ── SVG HYDROGRAPHY MAP: RIVER HOVER HIGHLIGHTS ── */
(function () {
    const riverMap = {
        'rio-quindio':  { name: 'Río Quindío', color: '#74c0fc', origin: 'Nace en el Páramo de Los Nevados' },
        'rio-barragan': { name: 'Río Barragán', color: '#a9d6e5', origin: 'Nace en el Cerro Barragán, Tolima' },
        'rio-la-vieja': { name: 'Río La Vieja',  color: '#4dabf7', origin: 'Desemboca en el Río Cauca' },
    };

    Object.entries(riverMap).forEach(([id, info]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.cursor = 'pointer';
        el.addEventListener('mouseenter', () => {
            el.style.strokeWidth = '8';
            el.style.filter = 'brightness(1.3)';
            const tip = document.getElementById('geo-tooltip');
            if (tip) {
                tip.innerHTML = `<strong>${info.name}</strong><br><small>${info.origin}</small>`;
                tip.style.borderColor = info.color;
            }
        });
        el.addEventListener('mouseleave', () => {
            el.style.strokeWidth = '';
            el.style.filter = '';
        });
    });
})();
