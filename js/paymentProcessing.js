// Payment Processing for Donations
const express = require('express');
const mongoose = require('mongoose');
const stripe = require('stripe')('your_stripe_secret_key'); // Replace with actual key in production
const auth = require('./auth');

// Initialize router
const router = express.Router();

// Donation Schema
const donationSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    paymentMethod: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    donorName: { type: String },
    donorEmail: { type: String },
    message: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    transactionId: { type: String }
});

// Donation model
const Donation = mongoose.model('Donation', donationSchema);

// Routes
// Create Stripe payment intent
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'usd' } = req.body;
        
        // Validate amount
        if (!amount || amount < 1) {
            return res.status(400).json({ message: 'Invalid donation amount' });
        }
        
        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency,
            metadata: {
                integration_check: 'accept_a_payment'
            }
        });
        
        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Process donation
router.post('/donations', async (req, res) => {
    try {
        const { amount, paymentMethod, donorName, donorEmail, message, transactionId } = req.body;
        
        // Validate amount
        if (!amount || amount < 1) {
            return res.status(400).json({ message: 'Invalid donation amount' });
        }
        
        // Create new donation
        const newDonation = new Donation({
            amount,
            paymentMethod,
            donorName,
            donorEmail,
            message,
            status: 'completed',
            transactionId,
            user: req.user ? req.user.id : null
        });
        
        await newDonation.save();
        
        res.json(newDonation);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Process cryptocurrency donation
router.post('/donations/crypto', async (req, res) => {
    try {
        const { amount, currency, donorName, donorEmail, message, transactionId } = req.body;
        
        // Validate amount
        if (!amount || amount < 0.00001) {
            return res.status(400).json({ message: 'Invalid donation amount' });
        }
        
        // Create new donation
        const newDonation = new Donation({
            amount,
            currency,
            paymentMethod: 'cryptocurrency',
            donorName,
            donorEmail,
            message,
            status: 'completed',
            transactionId,
            user: req.user ? req.user.id : null
        });
        
        await newDonation.save();
        
        res.json(newDonation);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get all donations (admin only)
router.get('/donations', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const donations = await Donation.find().sort({ date: -1 });
        res.json(donations);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get donation statistics (admin only)
router.get('/donations/stats', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const totalDonations = await Donation.countDocuments({ status: 'completed' });
        
        const totalAmount = await Donation.aggregate([
            { $match: { status: 'completed', currency: 'usd' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const recentDonations = await Donation.find({ status: 'completed' })
            .sort({ date: -1 })
            .limit(5);
        
        res.json({
            totalDonations,
            totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
            recentDonations
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Frontend JavaScript for Payment Processing
const paymentProcessingFrontend = `
// Payment Processing for Donations
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const donationForm = document.getElementById('donation-form');
    const amountInput = document.getElementById('donation-amount');
    const paymentOptions = document.querySelectorAll('.payment-option');
    const cardElement = document.getElementById('card-element');
    const cardErrors = document.getElementById('card-errors');
    const submitButton = document.getElementById('submit-donation');
    const donationStatus = document.getElementById('donation-status');
    
    // Variables
    let stripe;
    let elements;
    let card;
    let selectedPaymentMethod = 'card';
    
    // Initialize Stripe
    function initializeStripe() {
        // In a real implementation, you would use your actual publishable key
        stripe = Stripe('pk_test_your_publishable_key');
        elements = stripe.elements();
        
        // Create card element
        if (cardElement) {
            card = elements.create('card', {
                style: {
                    base: {
                        color: '#32325d',
                        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                        fontSmoothing: 'antialiased',
                        fontSize: '16px',
                        '::placeholder': {
                            color: '#aab7c4'
                        }
                    },
                    invalid: {
                        color: '#fa755a',
                        iconColor: '#fa755a'
                    }
                }
            });
            
            card.mount('#card-element');
            
            // Handle card errors
            card.on('change', function(event) {
                if (cardErrors) {
                    if (event.error) {
                        cardErrors.textContent = event.error.message;
                    } else {
                        cardErrors.textContent = '';
                    }
                }
            });
        }
    }
    
    // Handle payment method selection
    if (paymentOptions) {
        paymentOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove active class from all options
                paymentOptions.forEach(opt => opt.classList.remove('active'));
                
                // Add active class to clicked option
                this.classList.add('active');
                
                // Update selected payment method
                selectedPaymentMethod = this.getAttribute('data-method');
                
                // Show/hide appropriate payment form
                const paymentForms = document.querySelectorAll('.payment-form-section');
                paymentForms.forEach(form => {
                    form.style.display = 'none';
                });
                
                const selectedForm = document.getElementById(\`\${selectedPaymentMethod}-payment-form\`);
                if (selectedForm) {
                    selectedForm.style.display = 'block';
                }
            });
        });
    }
    
    // Handle tier selection
    const tierButtons = document.querySelectorAll('.tier-btn');
    if (tierButtons) {
        tierButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                const amount = this.getAttribute('data-amount');
                if (amountInput) {
                    amountInput.value = amount;
                }
                
                // Scroll to payment form
                const paymentForm = document.getElementById('payment-form');
                if (paymentForm) {
                    paymentForm.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }
    
    // Handle custom amount
    const customAmountInput = document.getElementById('custom-amount');
    const customAmountBtn = document.getElementById('custom-amount-btn');
    
    if (customAmountInput && customAmountBtn && amountInput) {
        customAmountBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const customAmount = customAmountInput.value;
            if (customAmount && !isNaN(customAmount) && customAmount > 0) {
                amountInput.value = customAmount;
                
                // Scroll to payment form
                const paymentForm = document.getElementById('payment-form');
                if (paymentForm) {
                    paymentForm.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                showStatus('Please enter a valid donation amount', 'error');
            }
        });
    }
    
    // Handle form submission
    if (donationForm) {
        donationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!amountInput || !amountInput.value || isNaN(amountInput.value) || amountInput.value <= 0) {
                showStatus('Please enter a valid donation amount', 'error');
                return;
            }
            
            const amount = parseFloat(amountInput.value);
            
            // Disable submit button
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Processing...';
            }
            
            try {
                if (selectedPaymentMethod === 'card') {
                    // Create payment intent
                    const response = await fetch('/api/payments/create-payment-intent', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            amount: amount
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (!response.ok) {
                        throw new Error(data.message || 'An error occurred');
                    }
                    
                    // Confirm card payment
                    const result = await stripe.confirmCardPayment(data.clientSecret, {
                        payment_method: {
                            card: card,
                            billing_details: {
                                name: document.getElementById('card-name').value
                            }
                        }
                    });
                    
                    if (result.error) {
                        throw new Error(result.error.message);
                    }
                    
                    if (result.paymentIntent.status === 'succeeded') {
                        // Record donation
                        await recordDonation(amount, 'card', result.paymentIntent.id);
                        
                        showStatus('Thank you for your donation!', 'success');
                        donationForm.reset();
                    }
                } else if (selectedPaymentMethod === 'crypto') {
                    // For demo purposes, we'll just simulate a crypto payment
                    // In a real implementation, you would integrate with a crypto payment provider
                    
                    // Simulate transaction ID
                    const transactionId = 'crypto_' + Date.now();
                    
                    // Record donation
                    await recordDonation(amount, 'cryptocurrency', transactionId);
                    
                    showStatus('Thank you for your cryptocurrency donation!', 'success');
                    donationForm.reset();
                } else if (selectedPaymentMethod === 'paypal') {
                    // For demo purposes, we'll just simulate a PayPal payment
                    // In a real implementation, you would integrate with PayPal
                    
                    // Simulate transaction ID
                    const transactionId = 'paypal_' + Date.now();
                    
                    // Record donation
                    await recordDonation(amount, 'paypal', transactionId);
                    
                    showStatus('Thank you for your PayPal donation!', 'success');
                    donationForm.reset();
                } else {
                    // Handle other payment methods (Venmo, Cash App, Zelle)
                    // For demo purposes, we'll just simulate these payments
                    
                    // Simulate transaction ID
                    const transactionId = selectedPaymentMethod + '_' + Date.now();
                    
                    // Record donation
                    await recordDonation(amount, selectedPaymentMethod, transactionId);
                    
                    showStatus(\`Thank you for your \${selectedPaymentMethod} donation!\`, 'success');
                    donationForm.reset();
                }
            } catch (error) {
                console.error('Payment error:', error);
                showStatus(error.message || 'An error occurred during payment processing', 'error');
            } finally {
                // Re-enable submit button
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Complete Donation';
                }
            }
        });
    }
    
    // Record donation in database
    async function recordDonation(amount, paymentMethod, transactionId) {
        const donorName = document.getElementById('donor-name')?.value || '';
        const donorEmail = document.getElementById('donor-email')?.value || '';
        const message = document.getElementById('donor-message')?.value || '';
        
        const response = await fetch('/api/payments/donations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token') || ''
            },
            body: JSON.stringify({
                amount,
                paymentMethod,
                donorName,
                donorEmail,
                message,
                transactionId
            })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to record donation');
        }
        
        return await response.json();
    }
    
    // Show status message
    function showStatus(message, type) {
        if (!donationStatus) return;
        
        donationStatus.textContent = message;
        donationStatus.className = 'donation-status';
        donationStatus.classList.add(type);
        donationStatus.style.display = 'block';
        
        // Hide status message after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                donationStatus.style.display = 'none';
            }, 5000);
        }
    }
    
    // Initialize
    initializeStripe();
});
`;

// Export router and frontend script
module.exports = {
    router,
    paymentProcessingFrontend
};
