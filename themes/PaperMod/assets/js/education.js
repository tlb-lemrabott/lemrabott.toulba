// Education Page Interactive Features

document.addEventListener('DOMContentLoaded', function() {
    const educationCards = document.querySelectorAll('.education-card');
    const educationTags = document.querySelectorAll('.education-tag');
    
    // Add hover tilt effect to cards
    educationCards.forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });
    
    // Tag filtering functionality
    let activeTags = new Set();
    
    educationTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const tagText = this.textContent.trim();
            
            if (activeTags.has(tagText)) {
                activeTags.delete(tagText);
                this.style.opacity = '1';
                this.style.transform = 'translateY(0)';
            } else {
                activeTags.add(tagText);
                this.style.opacity = '0.7';
                this.style.transform = 'translateY(-2px)';
            }
            
            filterCards();
        });
    });
    
    function filterCards() {
        educationCards.forEach(card => {
            const cardTags = Array.from(card.querySelectorAll('.education-tag'))
                .map(tag => tag.textContent.trim());
            
            if (activeTags.size === 0) {
                // Show all cards if no tags are selected
                card.style.display = 'block';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            } else {
                // Show only cards that have at least one active tag
                const hasMatchingTag = cardTags.some(tag => activeTags.has(tag));
                
                if (hasMatchingTag) {
                    card.style.display = 'block';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                } else {
                    card.style.display = 'none';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                }
            }
        });
    }
    
    // Smooth scroll to top when clicking on cards
    educationCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Only trigger if clicking on the card itself, not on links
            if (e.target === card || e.target.closest('.education-title-link')) {
                return; // Let the link handle navigation
            }
            
            // Smooth scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
    
    // Add loading animation
    educationCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        const focusedElement = document.activeElement;
        
        if (focusedElement && focusedElement.classList.contains('education-tag')) {
            const tags = Array.from(educationTags);
            const currentIndex = tags.indexOf(focusedElement);
            
            switch(e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    if (currentIndex < tags.length - 1) {
                        tags[currentIndex + 1].focus();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        tags[currentIndex - 1].focus();
                    }
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    focusedElement.click();
                    break;
            }
        }
    });
    
    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    educationCards.forEach(card => {
        observer.observe(card);
    });
    
    // Add success state for interactions
    educationCards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.add('success');
            setTimeout(() => {
                this.classList.remove('success');
            }, 2000);
        });
    });
}); 