// Contact Form with Email Integration
const express = require('express');
const nodemailer = require('nodemailer');
const auth = require('./auth');

// Initialize router
const router = express.Router();

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Replace with actual email in production
        pass: 'your-password' // Replace with actual password in production
    }
});

// Contact form submission
router.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Validate input
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Email options
        const mailOptions = {
            from: email,
            to: 'realjasontclark@gmail.com', // Site owner's email
            subject: `Portfolio Contact: ${subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        };
        
        // Send email
        // In development, we'll just log the email content
        console.log('Email would be sent with the following content:');
        console.log(mailOptions);
        
        // In production, uncomment this to actually send the email
        /*
        await transporter.sendMail(mailOptions);
        */
        
        // Store contact submission in database (optional)
        
        res.json({ message: 'Your message has been sent successfully!' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get all contact submissions (admin only)
router.get('/contact/submissions', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // In a real implementation, this would fetch submissions from a database
        // For now, we'll return a mock response
        const mockSubmissions = [
            {
                id: '1',
                name: 'John Doe',
                email: 'john@example.com',
                subject: 'Collaboration Opportunity',
                message: 'I would like to discuss a potential collaboration on a photography project.',
                date: new Date('2025-04-01')
            },
            {
                id: '2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                subject: 'Book Inquiry',
                message: 'I really enjoyed your latest book and would like to know when your next one will be released.',
                date: new Date('2025-04-05')
            }
        ];
        
        res.json(mockSubmissions);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Frontend JavaScript for Contact Form
const contactFormFrontend = `
// Contact Form with Email Integration
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // Validate form
            if (!name || !email || !subject || !message) {
                showStatus('Please fill in all fields', 'error');
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showStatus('Please enter a valid email address', 'error');
                return;
            }
            
            // Show loading status
            showStatus('Sending message...', 'loading');
            
            try {
                // Send form data to server
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        subject,
                        message
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Show success message
                    showStatus(data.message, 'success');
                    
                    // Reset form
                    contactForm.reset();
                } else {
                    // Show error message
                    showStatus(data.message || 'An error occurred. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                showStatus('An error occurred. Please try again.', 'error');
            }
        });
    }
    
    // Show status message
    function showStatus(message, type) {
        if (!formStatus) return;
        
        formStatus.textContent = message;
        formStatus.className = 'form-status';
        formStatus.classList.add(type);
        formStatus.style.display = 'block';
        
        // Hide status message after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                formStatus.style.display = 'none';
            }, 5000);
        }
    }
    
    // Initialize Google Maps
    function initMap() {
        const mapElement = document.getElementById('contact-map');
        
        if (mapElement) {
            // Willard, UT coordinates
            const location = { lat: 41.410185, lng: -112.059539 };
            
            const map = new google.maps.Map(mapElement, {
                zoom: 14,
                center: location,
                styles: [
                    {
                        "featureType": "all",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#242f3e"
                            }
                        ]
                    },
                    {
                        "featureType": "all",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#746855"
                            }
                        ]
                    },
                    {
                        "featureType": "all",
                        "elementType": "labels.text.stroke",
                        "stylers": [
                            {
                                "color": "#242f3e"
                            }
                        ]
                    },
                    {
                        "featureType": "administrative.locality",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#d59563"
                            }
                        ]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#d59563"
                            }
                        ]
                    },
                    {
                        "featureType": "poi.park",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#263c3f"
                            }
                        ]
                    },
                    {
                        "featureType": "poi.park",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#6b9a76"
                            }
                        ]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#38414e"
                            }
                        ]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry.stroke",
                        "stylers": [
                            {
                                "color": "#212a37"
                            }
                        ]
                    },
                    {
                        "featureType": "road",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#9ca5b3"
                            }
                        ]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#746855"
                            }
                        ]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "geometry.stroke",
                        "stylers": [
                            {
                                "color": "#1f2835"
                            }
                        ]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#f3d19c"
                            }
                        ]
                    },
                    {
                        "featureType": "transit",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#2f3948"
                            }
                        ]
                    },
                    {
                        "featureType": "transit.station",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#d59563"
                            }
                        ]
                    },
                    {
                        "featureType": "water",
                        "elementType": "geometry",
                        "stylers": [
                            {
                                "color": "#17263c"
                            }
                        ]
                    },
                    {
                        "featureType": "water",
                        "elementType": "labels.text.fill",
                        "stylers": [
                            {
                                "color": "#515c6d"
                            }
                        ]
                    },
                    {
                        "featureType": "water",
                        "elementType": "labels.text.stroke",
                        "stylers": [
                            {
                                "color": "#17263c"
                            }
                        ]
                    }
                ]
            });
            
            const marker = new google.maps.Marker({
                position: location,
                map: map,
                title: 'Jason Clark'
            });
        }
    }
    
    // Load Google Maps API
    if (document.getElementById('contact-map')) {
        // In a real implementation, you would include the Google Maps API with your API key
        // For this demo, we'll just call the init function directly
        // window.initMap = initMap;
        // const script = document.createElement('script');
        // script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap';
        // script.async = true;
        // document.head.appendChild(script);
        
        // For demo purposes, we'll just initialize a basic map container
        const mapElement = document.getElementById('contact-map');
        mapElement.innerHTML = '<div class="map-placeholder">Interactive Map Would Load Here</div>';
    }
});
`;

// Export router and frontend script
module.exports = {
    router,
    contactFormFrontend
};
