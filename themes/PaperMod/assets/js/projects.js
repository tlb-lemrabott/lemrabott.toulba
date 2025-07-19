// Projects Page Interactive Features

document.addEventListener('DOMContentLoaded', function() {
    const projectCards = document.querySelectorAll('.project-card');
    const projectTags = document.querySelectorAll('.project-tag');
    const projectImages = document.querySelectorAll('.project-image');
    
    // Add hover tilt effect to cards
    projectCards.forEach(card => {
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
    
    // Enhanced image interactions
    projectImages.forEach(image => {
        image.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
        });
        
        image.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        });
        
        // Add click to enlarge functionality
        image.addEventListener('click', function() {
            const img = this.querySelector('img');
            if (img) {
                openImageModal(img.src, img.alt);
            }
        });
    });
    
    // Image modal functionality
    function openImageModal(src, alt) {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-content">
                <span class="image-modal-close">&times;</span>
                <img src="${src}" alt="${alt}" class="image-modal-img">
            </div>
        `;
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .image-modal {
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }
            
            .image-modal-content {
                position: relative;
                max-width: 90%;
                max-height: 90%;
                animation: zoomIn 0.3s ease;
            }
            
            .image-modal-close {
                position: absolute;
                top: -40px;
                right: 0;
                color: white;
                font-size: 35px;
                font-weight: bold;
                cursor: pointer;
                z-index: 1001;
            }
            
            .image-modal-img {
                width: 100%;
                height: auto;
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes zoomIn {
                from { transform: scale(0.8); }
                to { transform: scale(1); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        // Close modal functionality
        const closeBtn = modal.querySelector('.image-modal-close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
            style.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                style.remove();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                modal.remove();
                style.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    }
    
    // Tag filtering functionality
    let activeTags = new Set();
    
    projectTags.forEach(tag => {
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
        projectCards.forEach(card => {
            const cardTags = Array.from(card.querySelectorAll('.project-tag'))
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
    projectCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Only trigger if clicking on the card itself, not on links or images
            if (e.target === card || e.target.closest('.project-title-link') || e.target.closest('.project-image')) {
                return; // Let the link or image handle navigation
            }
            
            // Smooth scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
    
    // Add loading animation
    projectCards.forEach((card, index) => {
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
        
        if (focusedElement && focusedElement.classList.contains('project-tag')) {
            const tags = Array.from(projectTags);
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
    
    projectCards.forEach(card => {
        observer.observe(card);
    });
    
    // Add success state for interactions
    projectCards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.add('success');
            setTimeout(() => {
                this.classList.remove('success');
            }, 2000);
        });
    });
    
    // Add image loading optimization
    const images = document.querySelectorAll('.project-image img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        img.addEventListener('error', function() {
            this.style.opacity = '0.5';
            this.style.filter = 'grayscale(100%)';
        });
    });
}); 