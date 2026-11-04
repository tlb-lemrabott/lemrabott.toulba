// Contact Page Interactive Features

document.addEventListener('DOMContentLoaded', function() {
    const emailForm = document.getElementById('emailForm');
    const emailInput = document.getElementById('fromEmail');
    const subjectInput = document.getElementById('subject');
    const contentInput = document.getElementById('content');
    const submitButton = document.getElementById('submitButton');
    const emailError = document.getElementById('emailError');
    const subjectError = document.getElementById('subjectError');
    const contentError = document.getElementById('contentError');
    const formError = document.getElementById('formError');
    const contactContent = document.querySelector('.contact-content');
    const buttonText = submitButton.querySelector('.button-text');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const touched = { email: false, subject: false, message: false };
    let submitAttempted = false;

    function emailMessage(value) {
        if (!value) return 'Email is required.';
        if (!emailRegex.test(value)) return 'Enter a valid email address, such as name@example.com.';
        return '';
    }

    function setFieldError(input, errorEl, message) {
        errorEl.textContent = message;
        errorEl.hidden = !message;
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function validateForm(showAll) {
        const email = emailInput.value.trim();
        const subject = subjectInput.value.trim();
        const message = contentInput.value.trim();
        const errors = {
            email: emailMessage(email),
            subject: subject ? '' : 'Subject is required.',
            message: message ? '' : 'Message is required.'
        };

        if (showAll || touched.email) setFieldError(emailInput, emailError, errors.email);
        if (showAll || touched.subject) setFieldError(subjectInput, subjectError, errors.subject);
        if (showAll || touched.message) setFieldError(contentInput, contentError, errors.message);

        return !errors.email && !errors.subject && !errors.message;
    }

    function refreshErrors() {
        if (formError) formError.hidden = true;
        validateForm(false);
    }

    emailInput.addEventListener('input', refreshErrors);
    subjectInput.addEventListener('input', refreshErrors);
    contentInput.addEventListener('input', refreshErrors);
    emailInput.addEventListener('blur', () => { touched.email = true; refreshErrors(); });
    subjectInput.addEventListener('blur', () => { touched.subject = true; refreshErrors(); });
    contentInput.addEventListener('blur', () => { touched.message = true; refreshErrors(); });

    [emailInput, subjectInput, contentInput].forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });

        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });

        // Add character count for textarea
        if (input === contentInput) {
            input.addEventListener('input', function() {
                const charCount = this.value.length;
                const maxChars = 1000;
                
                if (charCount > maxChars * 0.8) {
                    this.style.borderColor = '#f59e0b';
                } else {
                    this.style.borderColor = '';
                }
                
                if (charCount > maxChars) {
                    this.value = this.value.substring(0, maxChars);
                }
            });
        }
    });

    // Form submission with enhanced UX
    async function submitForm(event) {
        event.preventDefault();
        
        submitAttempted = true;
        if (!validateForm(true)) {
            const firstInvalid = emailForm.querySelector('[aria-invalid="true"]');
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        if (formError) formError.hidden = true;

        // Show loading state
        submitButton.disabled = true;
        buttonText.textContent = 'Sending...';
        contactContent.classList.add('loading');

        const formData = {
            sender: emailInput.value.trim(),
            subject: subjectInput.value.trim(),
            message: contentInput.value.trim()
        };

        try {
            const response = await fetch('https://ctpq256z93.execute-api.us-east-1.amazonaws.com/v1/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            await response.json().catch(() => ({}));
            showSuccessMessage();
        } catch (error) {
            submitButton.disabled = false;
            buttonText.textContent = 'Send Message';
            contactContent.classList.remove('loading');
            if (formError) {
                formError.textContent = 'The message could not be sent. Try again, or email lemrabott.toulba@gmail.com.';
                formError.hidden = false;
            }
        }
    }

    // Success message with animation
    function showSuccessMessage() {
        // Reset form
        emailForm.reset();
        touched.email = false;
        touched.subject = false;
        touched.message = false;
        submitAttempted = false;
        [emailError, subjectError, contentError].forEach((el) => {
            el.textContent = '';
            el.hidden = true;
        });
        [emailInput, subjectInput, contentInput].forEach((input) => {
            input.setAttribute('aria-invalid', 'false');
        });
        submitButton.disabled = true;
        buttonText.textContent = 'Message Sent!';
        
        // Add success animation to container
        contactContent.classList.remove('loading');
        contactContent.classList.add('success');
        
        // Show success notification
        showNotification('Message sent successfully!', 'success');
        
        // Reset button after 3 seconds
        setTimeout(() => {
            buttonText.textContent = 'Send Message';
            submitButton.disabled = false;
            submitButton.style.background = '';
            contactContent.classList.remove('success');
        }, 3000);
    }

    // Notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : 'ℹ️'}</span>
                <span class="notification-text">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add notification styles
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                animation: slideInRight 0.3s ease;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem 1.5rem;
                background: ${type === 'success' ? '#10b981' : '#3b82f6'};
                color: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                min-width: 300px;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                margin-left: auto;
                opacity: 0.8;
                transition: opacity 0.2s ease;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(notification);

        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        }, 5000);

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        });
    }

    // Enhanced form submission
    emailForm.addEventListener('submit', submitForm);

    // Add hover effects to info items
    const infoItems = document.querySelectorAll('.info-item');
    infoItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });

        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        const focusedElement = document.activeElement;
        
        if (focusedElement && focusedElement.classList.contains('form-input') || 
            focusedElement && focusedElement.classList.contains('form-textarea')) {
            
            if (e.key === 'Tab') {
                // Allow normal tab navigation
                return;
            }
            
            if (e.key === 'Enter' && focusedElement === contentInput) {
                // Allow Enter in textarea
                return;
            }
            
            if (e.key === 'Enter') {
                e.preventDefault();
                // Move to next input or submit form
                const inputs = [emailInput, subjectInput, contentInput];
                const currentIndex = inputs.indexOf(focusedElement);
                
                if (currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else {
                    submitAttempted = true;
                    if (validateForm(true)) {
                        submitForm(new Event('submit'));
                    }
                }
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

    // Observe contact content
    if (contactContent) {
        observer.observe(contactContent);
    }

    // Add loading animation
    contactContent.style.opacity = '0';
    contactContent.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        contactContent.style.transition = 'all 0.6s ease-out';
        contactContent.style.opacity = '1';
        contactContent.style.transform = 'translateY(0)';
    }, 100);

    // Add copy email functionality
    const emailInfo = document.querySelector('.info-item:first-child');
    if (emailInfo) {
        emailInfo.style.cursor = 'pointer';
        emailInfo.addEventListener('click', function() {
            navigator.clipboard.writeText('lemrabott.toulba@gmail.com').then(() => {
                showNotification('Email copied to clipboard!', 'success');
            }).catch(() => {
                showNotification('Failed to copy email', 'error');
            });
        });
        
        // Add visual feedback
        emailInfo.addEventListener('mouseenter', function() {
            this.querySelector('.info-content p').textContent = 'Click to copy';
        });
        
        emailInfo.addEventListener('mouseleave', function() {
            this.querySelector('.info-content p').textContent = 'lemrabott.toulba@gmail.com';
        });
    }
}); 