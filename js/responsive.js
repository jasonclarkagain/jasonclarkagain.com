// Mobile Navigation Menu
document.addEventListener('DOMContentLoaded', function() {
    // Add js-enabled class to body
    document.body.classList.add('js-enabled');
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Toggle icon
            const icon = this.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target) && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }
    
    // Sticky header
    const header = document.querySelector('header');
    
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
    
    // Responsive image loading
    const responsiveImages = document.querySelectorAll('[data-src]');
    
    if (responsiveImages.length > 0) {
        const loadImage = function(img) {
            const src = img.getAttribute('data-src');
            if (!src) return;
            
            img.src = src;
            img.removeAttribute('data-src');
        };
        
        // Lazy loading with Intersection Observer
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver(function(entries, observer) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        loadImage(entry.target);
                        imageObserver.unobserve(entry.target);
                    }
                });
            });
            
            responsiveImages.forEach(function(img) {
                imageObserver.observe(img);
            });
        } else {
            // Fallback for browsers that don't support Intersection Observer
            responsiveImages.forEach(function(img) {
                loadImage(img);
            });
        }
    }
    
    // Touch device detection
    const isTouchDevice = function() {
        return (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));
    };
    
    if (isTouchDevice()) {
        document.body.classList.add('touch-device');
    }
    
    // Responsive tables
    const tables = document.querySelectorAll('table');
    
    if (tables.length > 0) {
        tables.forEach(function(table) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('table-responsive');
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });
    }
    
    // Responsive video embeds
    const videoEmbeds = document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"]');
    
    if (videoEmbeds.length > 0) {
        videoEmbeds.forEach(function(embed) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('video-responsive');
            embed.parentNode.insertBefore(wrapper, embed);
            wrapper.appendChild(embed);
        });
    }
    
    // Responsive gallery
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (galleryItems.length > 0) {
        // Adjust gallery layout based on screen size
        const adjustGallery = function() {
            const screenWidth = window.innerWidth;
            
            if (screenWidth < 576) {
                galleryItems.forEach(function(item) {
                    item.style.width = '100%';
                });
            } else if (screenWidth < 768) {
                galleryItems.forEach(function(item) {
                    item.style.width = '50%';
                });
            } else if (screenWidth < 992) {
                galleryItems.forEach(function(item) {
                    item.style.width = '33.333%';
                });
            } else {
                galleryItems.forEach(function(item) {
                    item.style.width = '25%';
                });
            }
        };
        
        // Initial adjustment
        adjustGallery();
        
        // Adjust on resize
        window.addEventListener('resize', adjustGallery);
    }
    
    // Responsive form validation
    const forms = document.querySelectorAll('form');
    
    if (forms.length > 0) {
        forms.forEach(function(form) {
            form.addEventListener('submit', function(e) {
                const requiredFields = form.querySelectorAll('[required]');
                let isValid = true;
                
                requiredFields.forEach(function(field) {
                    if (!field.value.trim()) {
                        isValid = false;
                        field.classList.add('error');
                        
                        // Add error message if it doesn't exist
                        let errorMessage = field.nextElementSibling;
                        if (!errorMessage || !errorMessage.classList.contains('error-message')) {
                            errorMessage = document.createElement('div');
                            errorMessage.classList.add('error-message');
                            errorMessage.textContent = 'This field is required';
                            field.parentNode.insertBefore(errorMessage, field.nextSibling);
                        }
                    } else {
                        field.classList.remove('error');
                        
                        // Remove error message if it exists
                        const errorMessage = field.nextElementSibling;
                        if (errorMessage && errorMessage.classList.contains('error-message')) {
                            errorMessage.remove();
                        }
                    }
                });
                
                if (!isValid) {
                    e.preventDefault();
                    
                    // Scroll to first error
                    const firstError = form.querySelector('.error');
                    if (firstError) {
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        firstError.focus();
                    }
                }
            });
        });
    }
    
    // Detect screen orientation change
    window.addEventListener('orientationchange', function() {
        // Refresh layout after orientation change
        setTimeout(function() {
            window.dispatchEvent(new Event('resize'));
        }, 200);
    });
    
    // Handle viewport height on mobile devices (fix for address bar)
    const setVhProperty = function() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVhProperty();
    
    window.addEventListener('resize', setVhProperty);
    window.addEventListener('orientationchange', setVhProperty);
    
    // Responsive navigation highlighting
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav ul li a');
    
    if (sections.length > 0 && navLinks.length > 0) {
        window.addEventListener('scroll', function() {
            let current = '';
            const scrollPosition = window.scrollY;
            
            sections.forEach(function(section) {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(function(link) {
                link.classList.remove('active');
                if (link.getAttribute('href').includes(current)) {
                    link.classList.add('active');
                }
            });
        });
    }
});
