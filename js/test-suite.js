// Test Suite for Portfolio Website
document.addEventListener('DOMContentLoaded', function() {
    console.log('Starting website functionality tests...');
    
    // Test results container
    const testResults = {
        passed: 0,
        failed: 0,
        total: 0,
        details: []
    };
    
    // Test function
    function runTest(testName, testFunction) {
        console.log(`Running test: ${testName}`);
        testResults.total++;
        
        try {
            const result = testFunction();
            if (result === true) {
                console.log(`✅ Test passed: ${testName}`);
                testResults.passed++;
                testResults.details.push({
                    name: testName,
                    status: 'passed'
                });
            } else {
                console.error(`❌ Test failed: ${testName}`);
                testResults.failed++;
                testResults.details.push({
                    name: testName,
                    status: 'failed',
                    message: result || 'Test returned false'
                });
            }
        } catch (error) {
            console.error(`❌ Test error: ${testName}`, error);
            testResults.failed++;
            testResults.details.push({
                name: testName,
                status: 'failed',
                message: error.message
            });
        }
    }
    
    // Navigation Tests
    runTest('Navigation links exist', function() {
        const navLinks = document.querySelectorAll('nav ul li a');
        return navLinks.length > 0;
    });
    
    runTest('Mobile menu button exists', function() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        return !!mobileMenuBtn;
    });
    
    runTest('Mobile menu toggle works', function() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!mobileMenuBtn || !navMenu) return 'Mobile menu elements not found';
        
        // Initial state
        const initialState = navMenu.classList.contains('active');
        
        // Click to toggle
        mobileMenuBtn.click();
        
        // Check if toggled
        const toggledState = navMenu.classList.contains('active');
        
        // Reset to initial state
        if (toggledState !== initialState) {
            mobileMenuBtn.click();
        }
        
        return initialState !== toggledState;
    });
    
    // Responsive Design Tests
    runTest('Responsive CSS is loaded', function() {
        const responsiveCSS = Array.from(document.styleSheets).some(sheet => 
            sheet.href && sheet.href.includes('responsive.css')
        );
        return responsiveCSS;
    });
    
    runTest('Viewport meta tag exists', function() {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        return !!viewportMeta;
    });
    
    // Interactive Elements Tests
    runTest('Birds animation canvas exists', function() {
        const canvas = document.getElementById('birds-canvas');
        return !!canvas;
    });
    
    runTest('Form validation works', function() {
        const forms = document.querySelectorAll('form');
        if (forms.length === 0) return 'No forms found';
        
        // Check if at least one form has required fields
        let hasRequiredFields = false;
        forms.forEach(form => {
            if (form.querySelectorAll('[required]').length > 0) {
                hasRequiredFields = true;
            }
        });
        
        return hasRequiredFields;
    });
    
    // Image Loading Tests
    runTest('Images load correctly', function() {
        const images = document.querySelectorAll('img');
        if (images.length === 0) return 'No images found';
        
        let allImagesValid = true;
        images.forEach(img => {
            // Skip images that are still loading or using data-src
            if (img.hasAttribute('data-src')) return;
            
            if (!img.complete || img.naturalWidth === 0) {
                allImagesValid = false;
            }
        });
        
        return allImagesValid;
    });
    
    // Performance Tests
    runTest('Page load performance', function() {
        if (window.performance) {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            
            console.log(`Page load time: ${pageLoadTime}ms`);
            
            // Consider test passed if page loads in less than 3 seconds
            return pageLoadTime < 3000;
        }
        
        return 'Performance API not supported';
    });
    
    // Accessibility Tests
    runTest('Accessibility: Alt tags for images', function() {
        const images = document.querySelectorAll('img');
        if (images.length === 0) return 'No images found';
        
        let allImagesHaveAlt = true;
        images.forEach(img => {
            if (!img.hasAttribute('alt')) {
                allImagesHaveAlt = false;
                console.warn('Image missing alt tag:', img);
            }
        });
        
        return allImagesHaveAlt;
    });
    
    runTest('Accessibility: Form labels', function() {
        const formInputs = document.querySelectorAll('input, textarea, select');
        if (formInputs.length === 0) return 'No form inputs found';
        
        let allInputsHaveLabels = true;
        formInputs.forEach(input => {
            // Skip hidden inputs and submit buttons
            if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return;
            
            const id = input.id;
            if (!id) {
                allInputsHaveLabels = false;
                console.warn('Input missing ID:', input);
                return;
            }
            
            const label = document.querySelector(`label[for="${id}"]`);
            if (!label) {
                allInputsHaveLabels = false;
                console.warn('Input missing label:', input);
            }
        });
        
        return allInputsHaveLabels;
    });
    
    // Feature-specific Tests
    
    // Photo Gallery Test
    runTest('Photo gallery functionality', function() {
        const galleryItems = document.querySelectorAll('.gallery-item, .portfolio-item');
        return galleryItems.length > 0;
    });
    
    // Music Player Test
    runTest('Music player elements exist', function() {
        const musicPlayer = document.querySelector('.music-player');
        return !!musicPlayer;
    });
    
    // Blog Functionality Test
    runTest('Blog elements exist', function() {
        const blogItems = document.querySelectorAll('.blog-item');
        return blogItems.length > 0;
    });
    
    // Contact Form Test
    runTest('Contact form exists', function() {
        const contactForm = document.querySelector('form');
        return !!contactForm;
    });
    
    // Donation Elements Test
    runTest('Donation elements exist', function() {
        const donationElements = document.querySelectorAll('.donate, .donation');
        return donationElements.length > 0;
    });
    
    // Professional Marketing Elements Test
    runTest('Professional marketing elements exist', function() {
        const marketingElements = document.querySelectorAll('.services, .hire-me-section, .premium-services');
        return marketingElements.length > 0;
    });
    
    // Display test results
    console.log('Test Results:', testResults);
    console.log(`Passed: ${testResults.passed}/${testResults.total} (${Math.round(testResults.passed/testResults.total*100)}%)`);
    
    // Create visual test report if in test mode
    if (window.location.search.includes('test=true')) {
        createTestReport(testResults);
    }
    
    function createTestReport(results) {
        const reportContainer = document.createElement('div');
        reportContainer.className = 'test-report';
        reportContainer.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            width: 300px;
            max-height: 100vh;
            overflow-y: auto;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            font-family: monospace;
            z-index: 9999;
        `;
        
        const header = document.createElement('h2');
        header.textContent = `Tests: ${results.passed}/${results.total} passed`;
        header.style.cssText = `
            margin-top: 0;
            color: ${results.failed > 0 ? '#ff5555' : '#55ff55'};
        `;
        
        const list = document.createElement('ul');
        list.style.cssText = `
            padding-left: 20px;
        `;
        
        results.details.forEach(test => {
            const item = document.createElement('li');
            item.textContent = test.name;
            item.style.color = test.status === 'passed' ? '#55ff55' : '#ff5555';
            
            if (test.message) {
                const message = document.createElement('div');
                message.textContent = test.message;
                message.style.cssText = `
                    font-size: 0.8em;
                    color: #ffaa55;
                    margin-left: 10px;
                `;
                item.appendChild(message);
            }
            
            list.appendChild(item);
        });
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = `
            background-color: #333;
            color: white;
            border: none;
            padding: 5px 10px;
            margin-top: 10px;
            cursor: pointer;
        `;
        closeButton.addEventListener('click', function() {
            document.body.removeChild(reportContainer);
        });
        
        reportContainer.appendChild(header);
        reportContainer.appendChild(list);
        reportContainer.appendChild(closeButton);
        
        document.body.appendChild(reportContainer);
    }
});
