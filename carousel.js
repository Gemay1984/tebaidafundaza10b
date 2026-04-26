/* ─── 3D TOURISM CAROUSEL ─── */
const tourismData = [
    { src: 'hero_new.jpg', title: 'Panorámica Municipal', desc: 'El Edén Tropical del Quindío visto desde lo alto, mostrando sus tierras fértiles.' },
    { src: 'escudo_oficial.png', title: 'Símbolos Patrios', desc: 'El escudo oficial representa el lema: Trabajo, Divisas y Riqueza.' }
];

const carCarousel = document.getElementById('turismo-carousel');
const carIndicators = document.getElementById('car-indicators');
if (carCarousel && carIndicators) {
    let currIndex = 0;
    
    // Inject cards
    tourismData.forEach((item, i) => {
        const card = document.createElement('div');
        card.className = 'car-card';
        card.innerHTML = `
            <img src="${item.src}" alt="${item.title}" loading="lazy">
            <div class="car-card-info">
                <h3>${item.title}</h3>
                <p>${item.desc}</p>
            </div>
        `;
        carCarousel.appendChild(card);
        
        const dot = document.createElement('div');
        dot.className = 'car-dot';
        if (i === 0) dot.classList.add('active');
        dot.onclick = () => moveCarousel(i);
        carIndicators.appendChild(dot);
    });

    function moveCarousel(index) {
        currIndex = index;
        const cards = document.querySelectorAll('.car-card');
        const dots = document.querySelectorAll('.car-dot');
        
        cards.forEach((card, i) => {
            const offset = i - currIndex;
            const absOffset = Math.abs(offset);
            
            if (absOffset > 1) {
                card.style.opacity = '0';
                card.style.pointerEvents = 'none';
            } else {
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
            }
            
            const scale = 1 - absOffset * 0.15;
            const translateX = offset * 220;
            const translateZ = -absOffset * 150;
            const rotateY = offset * -25;
            
            card.style.transform = `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
            card.style.zIndex = 10 - absOffset;
        });
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currIndex);
        });
    }

    document.getElementById('car-prev').onclick = () => {
        if (currIndex > 0) moveCarousel(currIndex - 1);
        else moveCarousel(tourismData.length - 1);
    };
    document.getElementById('car-next').onclick = () => {
        if (currIndex < tourismData.length - 1) moveCarousel(currIndex + 1);
        else moveCarousel(0);
    };

    // Initialize
    moveCarousel(0);

    // Auto rotate
    setInterval(() => {
        const next = (currIndex + 1) % tourismData.length;
        moveCarousel(next);
    }, 4000);
}
