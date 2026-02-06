// ============================================
// SCROLL ANIMATIONS - GestiónITT Landing Page
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    
    // Configuración del Intersection Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    // Observer para elementos que se animan una sola vez
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target); // Deja de observar después de animar
            }
        });
    }, observerOptions);

    // ============================================
    // HERO SECTION
    // ============================================
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.classList.add('fade-in-up');
        // El hero se anima inmediatamente al cargar
        setTimeout(() => {
            heroContent.classList.add('animate');
        }, 100);
    }

    // ============================================
    // VIDEO SECTION
    // ============================================
    const videoSection = document.querySelector('.video-section');
    if (videoSection) {
        videoSection.classList.add('fade-scale');
        observer.observe(videoSection);
    }

    // ============================================
    // BENEFIT CARDS
    // ============================================
    const benefitCards = document.querySelectorAll('.benefit-card');
    benefitCards.forEach((card, index) => {
        card.classList.add('fade-in-up');
        card.style.animationDelay = `${index * 0.15}s`;
        observer.observe(card);
    });

    // ============================================
    // STEPS (HOW IT WORKS)
    // ============================================
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        // Alterna entre izquierda y derecha
        if (index % 2 === 0) {
            step.classList.add('slide-in-left');
        } else {
            step.classList.add('slide-in-right');
        }
        step.style.animationDelay = `${index * 0.2}s`;
        observer.observe(step);
    });

    // ============================================
    // SECTION TITLES
    // ============================================
    const sectionTitles = document.querySelectorAll('.section-title');
    sectionTitles.forEach(title => {
        title.classList.add('fade-in-up');
        observer.observe(title);
    });

    const sectionSubtitles = document.querySelectorAll('.section-subtitle');
    sectionSubtitles.forEach(subtitle => {
        subtitle.classList.add('fade-in-up');
        subtitle.style.animationDelay = '0.1s';
        observer.observe(subtitle);
    });

    // ============================================
    // SMOOTH SCROLL para los enlaces de navegación
    // ============================================
    const header = document.querySelector('header');
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = header.offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ============================================
    // CONTADOR ANIMADO (opcional para números)
    // ============================================
    function animateCounter(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    // ============================================
    // ANIMACIÓN DE BOTONES AL HOVER
    // ============================================
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // ============================================
    // LOADING SCREEN (opcional)
    // ============================================
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });

    // ============================================
    // DEMO SECTION
    // ============================================
    const demoSection = document.querySelector('.demo-section');
    if (demoSection) {
        demoSection.classList.add('fade-scale');
        observer.observe(demoSection);
    }

});

// ============================================
// UTILIDADES
// ============================================

// Detectar si el usuario prefiere movimiento reducido
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    // Desactivar animaciones si el usuario lo prefiere
    document.documentElement.style.setProperty('--animation-duration', '0.01s');
}

// Console log para debug
console.log('🎨 Animaciones de scroll cargadas');
