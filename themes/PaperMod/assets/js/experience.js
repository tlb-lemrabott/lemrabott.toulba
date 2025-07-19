// Enhanced Experience Page JavaScript
// Adds interactive features and animations

document.addEventListener('DOMContentLoaded', function() {
    // Initialize experience page enhancements
    initExperienceEnhancements();
});

function initExperienceEnhancements() {
    // Add smooth scroll behavior
    addSmoothScroll();
    
    // Add tag filtering functionality
    addTagFiltering();
    
    // Add intersection observer for animations
    addScrollAnimations();
    
    // Add hover effects
    addHoverEffects();
    
    // Add keyboard navigation
    addKeyboardNavigation();
}

function addSmoothScroll() {
    // Smooth scroll to top when clicking on experience cards
    const experienceCards = document.querySelectorAll('.experience-card');
    
    experienceCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking on links or interactive elements
            if (e.target.tagName === 'A' || e.target.classList.contains('experience-tag')) {
                return;
            }
            
            // Smooth scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
}

function addTagFiltering() {
    const experienceCards = document.querySelectorAll('.experience-card');
    const tags = document.querySelectorAll('.experience-tag');
    
    // Add click handlers to tags
    tags.forEach(tag => {
        tag.addEventListener('click', function() {
            const selectedTag = this.textContent.trim();
            
            // Toggle active state
            this.classList.toggle('active');
            
            // Filter cards based on selected tags
            filterCardsByTags();
        });
    });
    
    function filterCardsByTags() {
        const activeTags = Array.from(document.querySelectorAll('.experience-tag.active'))
            .map(tag => tag.textContent.trim());
        
        experienceCards.forEach(card => {
            const cardTags = Array.from(card.querySelectorAll('.experience-tag'))
                .map(tag => tag.textContent.trim());
            
            if (activeTags.length === 0 || activeTags.some(tag => cardTags.includes(tag))) {
                card.style.display = 'block';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            } else {
                card.style.opacity = '0.3';
                card.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    }
}

function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe experience cards
    const experienceCards = document.querySelectorAll('.experience-card');
    experienceCards.forEach(card => {
        observer.observe(card);
    });
}

function addHoverEffects() {
    const experienceCards = document.querySelectorAll('.experience-card');
    
    experienceCards.forEach(card => {
        // Add tilt effect on hover
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });
        
        // Reset transform on mouse leave
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });
}

function addKeyboardNavigation() {
    const experienceCards = document.querySelectorAll('.experience-card');
    const tags = document.querySelectorAll('.experience-tag');
    
    // Add keyboard navigation for cards
    experienceCards.forEach((card, index) => {
        card.setAttribute('tabindex', '0');
        
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
    
    // Add keyboard navigation for tags
    tags.forEach(tag => {
        tag.setAttribute('tabindex', '0');
        
        tag.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

// Add CSS for new interactive features
function addInteractiveStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .experience-tag.active {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
            transform: scale(1.05) translateY(-2px) !important;
        }
        
        .experience-card.animate-in {
            animation: slideInUp 0.6s ease-out forwards;
        }
        
        .experience-card:focus {
            outline: 2px solid #667eea;
            outline-offset: 2px;
        }
        
        .experience-tag:focus {
            outline: 2px solid #667eea;
            outline-offset: 2px;
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize styles
addInteractiveStyles();

// Export functions for potential external use
window.ExperienceEnhancements = {
    initExperienceEnhancements,
    addTagFiltering,
    addScrollAnimations,
    addHoverEffects
}; 