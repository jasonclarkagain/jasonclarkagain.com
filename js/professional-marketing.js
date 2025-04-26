// Professional Marketing and Services Section
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const servicePackages = document.querySelectorAll('.service-package');
    const testimonialSlider = document.querySelector('.testimonial-slider');
    const featuredProjects = document.querySelectorAll('.featured-project');
    const ctaButtons = document.querySelectorAll('.cta-button');
    
    // Initialize service package hover effects
    if (servicePackages) {
        servicePackages.forEach(package => {
            package.addEventListener('mouseenter', function() {
                this.classList.add('active');
            });
            
            package.addEventListener('mouseleave', function() {
                this.classList.remove('active');
            });
        });
    }
    
    // Initialize testimonial slider
    if (testimonialSlider) {
        let currentSlide = 0;
        const testimonials = testimonialSlider.querySelectorAll('.testimonial');
        const totalSlides = testimonials.length;
        const nextBtn = testimonialSlider.querySelector('.next-btn');
        const prevBtn = testimonialSlider.querySelector('.prev-btn');
        const indicators = testimonialSlider.querySelectorAll('.indicator');
        
        // Show initial slide
        showSlide(currentSlide);
        
        // Next button
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                currentSlide = (currentSlide + 1) % totalSlides;
                showSlide(currentSlide);
            });
        }
        
        // Previous button
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
                showSlide(currentSlide);
            });
        }
        
        // Indicators
        if (indicators) {
            indicators.forEach((indicator, index) => {
                indicator.addEventListener('click', function() {
                    currentSlide = index;
                    showSlide(currentSlide);
                });
            });
        }
        
        // Auto slide
        setInterval(function() {
            currentSlide = (currentSlide + 1) % totalSlides;
            showSlide(currentSlide);
        }, 5000);
        
        // Show slide function
        function showSlide(index) {
            testimonials.forEach(testimonial => {
                testimonial.style.display = 'none';
            });
            
            indicators.forEach(indicator => {
                indicator.classList.remove('active');
            });
            
            testimonials[index].style.display = 'block';
            indicators[index].classList.add('active');
        }
    }
    
    // Initialize featured projects
    if (featuredProjects) {
        featuredProjects.forEach(project => {
            project.addEventListener('mouseenter', function() {
                this.querySelector('.project-details').style.opacity = '1';
            });
            
            project.addEventListener('mouseleave', function() {
                this.querySelector('.project-details').style.opacity = '0';
            });
        });
    }
    
    // Initialize CTA buttons
    if (ctaButtons) {
        ctaButtons.forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.classList.add('pulse');
            });
            
            button.addEventListener('mouseleave', function() {
                this.classList.remove('pulse');
            });
            
            button.addEventListener('click', function() {
                const target = this.getAttribute('data-target');
                if (target) {
                    document.querySelector(target).scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    // Initialize service filter
    const serviceFilters = document.querySelectorAll('.service-filter');
    const serviceItems = document.querySelectorAll('.service-item');
    
    if (serviceFilters && serviceItems) {
        serviceFilters.forEach(filter => {
            filter.addEventListener('click', function() {
                // Remove active class from all filters
                serviceFilters.forEach(f => f.classList.remove('active'));
                
                // Add active class to clicked filter
                this.classList.add('active');
                
                // Get filter value
                const filterValue = this.getAttribute('data-filter');
                
                // Show/hide service items based on filter
                serviceItems.forEach(item => {
                    if (filterValue === 'all') {
                        item.style.display = 'block';
                    } else if (item.classList.contains(filterValue)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }
    
    // Initialize skill bars animation
    const skillBars = document.querySelectorAll('.skill-progress');
    
    function animateSkillBars() {
        skillBars.forEach(bar => {
            const targetWidth = bar.getAttribute('data-width');
            bar.style.width = targetWidth + '%';
        });
    }
    
    // Animate skill bars when they come into view
    const skillsSection = document.querySelector('.skills-section');
    
    if (skillsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSkillBars();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(skillsSection);
    }
    
    // Initialize counter animation
    const counters = document.querySelectorAll('.counter');
    
    function animateCounters() {
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000; // 2 seconds
            const step = target / (duration / 16); // 60fps
            let current = 0;
            
            const updateCounter = () => {
                current += step;
                if (current < target) {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };
            
            updateCounter();
        });
    }
    
    // Animate counters when they come into view
    const statsSection = document.querySelector('.stats-section');
    
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(statsSection);
    }
    
    // Initialize service booking form
    const bookingForm = document.getElementById('booking-form');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formStatus = document.getElementById('booking-status');
            const submitButton = document.getElementById('booking-submit');
            
            // Disable submit button
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Processing...';
            }
            
            try {
                // Get form data
                const formData = new FormData(bookingForm);
                const data = Object.fromEntries(formData.entries());
                
                // Validate form
                if (!data.name || !data.email || !data.service || !data.message) {
                    throw new Error('Please fill in all required fields');
                }
                
                // In a real implementation, you would send this data to your server
                console.log('Booking form data:', data);
                
                // Simulate server response
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Show success message
                if (formStatus) {
                    formStatus.textContent = 'Thank you for your booking request! I will contact you shortly to discuss the details.';
                    formStatus.className = 'form-status success';
                    formStatus.style.display = 'block';
                }
                
                // Reset form
                bookingForm.reset();
            } catch (error) {
                // Show error message
                if (formStatus) {
                    formStatus.textContent = error.message || 'An error occurred. Please try again.';
                    formStatus.className = 'form-status error';
                    formStatus.style.display = 'block';
                }
            } finally {
                // Re-enable submit button
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Book Now';
                }
            }
        });
    }
});
