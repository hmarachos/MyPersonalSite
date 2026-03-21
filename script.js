/* ============================================
   Smooth Scroll to Contact
   ============================================ */

function scrollToContact() {
    const contactSection = document.getElementById('contact');
    contactSection.scrollIntoView({ behavior: 'smooth' });
}

/* ============================================
   Form Handling
   ============================================ */

document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const formInputs = this.querySelectorAll('.form-input');
    const name = formInputs[0].value;
    const contact = formInputs[1].value;
    
    // Simple validation
    if (!name.trim() || !contact.trim()) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    // Show success message
    const button = this.querySelector('button');
    const originalText = button.textContent;
    button.textContent = '✓ Спасибо! Я свяжусь с вами';
    button.style.background = '#10b981';
    
    // Reset form
    this.reset();
    
    // Restore button after 3 seconds
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 3000);
    
    // In a real project, you would send this data to a server:
    // fetch('/api/contact', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ name, contact })
    // })
});

/* ============================================
   Intersection Observer for Animations
   ============================================ */

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all cards
document.querySelectorAll('.benefit-card, .case-card').forEach(card => {
    card.style.opacity = '0';
    observer.observe(card);
});

/* ============================================
   Active Navigation Link
   ============================================ */

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.style.color = 'var(--primary)';
        } else {
            link.style.color = '';
        }
    });
});
