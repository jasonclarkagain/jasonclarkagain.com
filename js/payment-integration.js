// Stripe Payment Integration
const stripeIntegration = {
  // Initialize Stripe with publishable key
  init: function(publishableKey) {
    this.stripe = Stripe(publishableKey);
    this.elements = this.stripe.elements();
    this.setupCardElement();
    this.setupEventListeners();
  },
  
  // Set up card element
  setupCardElement: function() {
    const cardElement = document.getElementById('card-element');
    if (!cardElement) return;
    
    this.card = this.elements.create('card', {
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
    
    this.card.mount('#card-element');
    
    // Handle card errors
    this.card.on('change', function(event) {
      const cardErrors = document.getElementById('card-errors');
      if (cardErrors) {
        if (event.error) {
          cardErrors.textContent = event.error.message;
        } else {
          cardErrors.textContent = '';
        }
      }
    });
  },
  
  // Set up event listeners
  setupEventListeners: function() {
    const donationForm = document.getElementById('donation-form');
    if (donationForm) {
      donationForm.addEventListener('submit', this.handleDonationSubmit.bind(this));
    }
    
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
      paymentForm.addEventListener('submit', this.handlePaymentSubmit.bind(this));
    }
  },
  
  // Handle donation form submission
  handleDonationSubmit: async function(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submit-donation');
    const donationStatus = document.getElementById('donation-status');
    const amountInput = document.getElementById('donation-amount');
    
    if (!amountInput || !amountInput.value || isNaN(amountInput.value) || amountInput.value <= 0) {
      this.showStatus(donationStatus, 'Please enter a valid donation amount', 'error');
      return;
    }
    
    const amount = parseFloat(amountInput.value);
    
    // Disable submit button
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Processing...';
    }
    
    try {
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
      const result = await this.stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: this.card,
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
        await this.recordDonation(amount, 'card', result.paymentIntent.id);
        
        this.showStatus(donationStatus, 'Thank you for your donation!', 'success');
        donationForm.reset();
      }
    } catch (error) {
      console.error('Payment error:', error);
      this.showStatus(donationStatus, error.message || 'An error occurred during payment processing', 'error');
    } finally {
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Complete Donation';
      }
    }
  },
  
  // Handle payment form submission
  handlePaymentSubmit: async function(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submit-payment');
    const paymentStatus = document.getElementById('payment-status');
    const amountInput = document.getElementById('payment-amount');
    
    if (!amountInput || !amountInput.value || isNaN(amountInput.value) || amountInput.value <= 0) {
      this.showStatus(paymentStatus, 'Please enter a valid payment amount', 'error');
      return;
    }
    
    const amount = parseFloat(amountInput.value);
    
    // Disable submit button
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Processing...';
    }
    
    try {
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
      const result = await this.stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: this.card,
          billing_details: {
            name: document.getElementById('card-name').value
          }
        }
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      if (result.paymentIntent.status === 'succeeded') {
        // Record payment
        await this.recordPayment(amount, 'card', result.paymentIntent.id);
        
        this.showStatus(paymentStatus, 'Payment successful!', 'success');
        paymentForm.reset();
      }
    } catch (error) {
      console.error('Payment error:', error);
      this.showStatus(paymentStatus, error.message || 'An error occurred during payment processing', 'error');
    } finally {
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Complete Payment';
      }
    }
  },
  
  // Record donation in database
  recordDonation: async function(amount, paymentMethod, transactionId) {
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
  },
  
  // Record payment in database
  recordPayment: async function(amount, paymentMethod, transactionId) {
    const customerName = document.getElementById('customer-name')?.value || '';
    const customerEmail = document.getElementById('customer-email')?.value || '';
    const serviceId = document.getElementById('service-id')?.value || '';
    
    const response = await fetch('/api/payments/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token') || ''
      },
      body: JSON.stringify({
        amount,
        paymentMethod,
        customerName,
        customerEmail,
        serviceId,
        transactionId
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to record payment');
    }
    
    return await response.json();
  },
  
  // Show status message
  showStatus: function(statusElement, message, type) {
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.className = 'status';
    statusElement.classList.add(type);
    statusElement.style.display = 'block';
    
    // Hide status message after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 5000);
    }
  }
};

// Cryptocurrency Payment Integration
const cryptoIntegration = {
  // Initialize cryptocurrency payment options
  init: function() {
    this.setupEventListeners();
    this.generateWalletAddresses();
  },
  
  // Set up event listeners
  setupEventListeners: function() {
    const cryptoForm = document.getElementById('crypto-form');
    if (cryptoForm) {
      cryptoForm.addEventListener('submit', this.handleCryptoSubmit.bind(this));
    }
    
    const cryptoSelect = document.getElementById('crypto-select');
    if (cryptoSelect) {
      cryptoSelect.addEventListener('change', this.handleCryptoChange.bind(this));
    }
  },
  
  // Generate wallet addresses for different cryptocurrencies
  generateWalletAddresses: function() {
    // In a real implementation, these would be your actual wallet addresses
    this.walletAddresses = {
      bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      ethereum: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      litecoin: 'LTU2YTRhYTFjNjQ2MzRjMDUzMjkyNWEzYjg0NGJjNDU0ZTQ0Mzh',
      dogecoin: 'D8K5cZ7Y3Upt9NboQzpUjKHZmfnGEUz3Pj',
      ripple: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    };
    
    // Display wallet addresses
    for (const [crypto, address] of Object.entries(this.walletAddresses)) {
      const addressElement = document.getElementById(`${crypto}-address`);
      if (addressElement) {
        addressElement.textContent = address;
      }
      
      const qrElement = document.getElementById(`${crypto}-qr`);
      if (qrElement) {
        // In a real implementation, you would generate a QR code for the address
        qrElement.innerHTML = `<div class="qr-placeholder">QR Code for ${address}</div>`;
      }
    }
  },
  
  // Handle cryptocurrency selection change
  handleCryptoChange: function(e) {
    const selectedCrypto = e.target.value;
    
    // Hide all crypto payment details
    const cryptoDetails = document.querySelectorAll('.crypto-details');
    cryptoDetails.forEach(detail => {
      detail.style.display = 'none';
    });
    
    // Show selected crypto payment details
    const selectedDetails = document.getElementById(`${selectedCrypto}-details`);
    if (selectedDetails) {
      selectedDetails.style.display = 'block';
    }
  },
  
  // Handle cryptocurrency form submission
  handleCryptoSubmit: async function(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submit-crypto');
    const cryptoStatus = document.getElementById('crypto-status');
    const amountInput = document.getElementById('crypto-amount');
    const cryptoSelect = document.getElementById('crypto-select');
    const transactionIdInput = document.getElementById('transaction-id');
    
    if (!amountInput || !amountInput.value || isNaN(amountInput.value) || amountInput.value <= 0) {
      this.showStatus(cryptoStatus, 'Please enter a valid amount', 'error');
      return;
    }
    
    if (!transactionIdInput || !transactionIdInput.value) {
      this.showStatus(cryptoStatus, 'Please enter the transaction ID', 'error');
      return;
    }
    
    const amount = parseFloat(amountInput.value);
    const currency = cryptoSelect.value;
    const transactionId = transactionIdInput.value;
    
    // Disable submit button
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Processing...';
    }
    
    try {
      // Record cryptocurrency donation
      const response = await fetch('/api/payments/donations/crypto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || ''
        },
        body: JSON.stringify({
          amount,
          currency,
          donorName: document.getElementById('crypto-donor-name')?.value || '',
          donorEmail: document.getElementById('crypto-donor-email')?.value || '',
          message: document.getElementById('crypto-message')?.value || '',
          transactionId
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to record donation');
      }
      
      this.showStatus(cryptoStatus, 'Thank you for your cryptocurrency donation!', 'success');
      e.target.reset();
    } catch (error) {
      console.error('Crypto donation error:', error);
      this.showStatus(cryptoStatus, error.message || 'An error occurred while processing your donation', 'error');
    } finally {
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Complete Donation';
      }
    }
  },
  
  // Show status message
  showStatus: function(statusElement, message, type) {
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.className = 'status';
    statusElement.classList.add(type);
    statusElement.style.display = 'block';
    
    // Hide status message after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 5000);
    }
  }
};

// PayPal Integration
const paypalIntegration = {
  // Initialize PayPal
  init: function(clientId) {
    this.loadPayPalScript(clientId);
  },
  
  // Load PayPal JavaScript SDK
  loadPayPalScript: function(clientId) {
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.addEventListener('load', this.setupPayPalButtons.bind(this));
    document.body.appendChild(script);
  },
  
  // Set up PayPal buttons
  setupPayPalButtons: function() {
    const donateButtonContainer = document.getElementById('paypal-donate-button');
    const payButtonContainer = document.getElementById('paypal-pay-button');
    
    if (donateButtonContainer) {
      this.setupDonateButton(donateButtonContainer);
    }
    
    if (payButtonContainer) {
      this.setupPayButton(payButtonContainer);
    }
  },
  
  // Set up PayPal donate button
  setupDonateButton: function(container) {
    const amountInput = document.getElementById('donation-amount');
    const donationStatus = document.getElementById('donation-status');
    
    paypal.Buttons({
      createOrder: function(data, actions) {
        if (!amountInput || !amountInput.value || isNaN(amountInput.value) || amountInput.value <= 0) {
          paypalIntegration.showStatus(donationStatus, 'Please enter a valid donation amount', 'error');
          return null;
        }
        
        const amount = parseFloat(amountInput.value);
        
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amount.toFixed(2)
            },
            description: 'Donation'
          }]
        });
      },
      onApprove: async function(data, actions) {
        try {
          const order = await actions.order.capture();
          
          // Record donation
          await paypalIntegration.recordDonation(
            parseFloat(order.purchase_units[0].amount.value),
            'paypal',
            order.id
          );
          
          paypalIntegration.showStatus(donationStatus, 'Thank you for your donation!', 'success');
          document.getElementById('donation-form')?.reset();
        } catch (error) {
          console.error('PayPal donation error:', error);
          paypalIntegration.showStatus(donationStatus, 'An error occurred while processing your donation', 'error');
        }
      },
      onError: function(err) {
        console.error('PayPal error:', err);
        paypalIntegration.showStatus(donationStatus, 'An error occurred with PayPal', 'error');
      }
    }).render(container);
  },
  
  // Set up PayPal payment button
  setupPayButton: function(container) {
    const amountInput = document.getElementById('payment-amount');
    const paymentStatus = document.getElementById('payment-status');
    
    paypal.Buttons({
      createOrder: function(data, actions) {
        if (!amountInput || !amountInput.value || isNaN(amountInput.value) || amountInput.value <= 0) {
          paypalIntegration.showStatus(paymentStatus, 'Please enter a valid payment amount', 'error');
          return null;
        }
        
        const amount = parseFloat(amountInput.value);
        
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amount.toFixed(2)
            },
            description: 'Service Payment'
          }]
        });
      },
      onApprove: async function(data, actions) {
        try {
          const order = await actions.order.capture();
          
          // Record payment
          await paypalIntegration.recordPayment(
            parseFloat(order.purchase_units[0].amount.value),
            'paypal',
            order.id
          );
          
          paypalIntegration.showStatus(paymentStatus, 'Payment successful!', 'success');
          document.getElementById('payment-form')?.reset();
        } catch (error) {
          console.error('PayPal payment error:', error);
          paypalIntegration.showStatus(paymentStatus, 'An error occurred while processing your payment', 'error');
        }
      },
      onError: function(err) {
        console.error('PayPal error:', err);
        paypalIntegration.showStatus(paymentStatus, 'An error occurred with PayPal', 'error');
      }
    }).render(container);
  },
  
  // Record donation in database
  recordDonation: async function(amount, paymentMethod, transactionId) {
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
  },
  
  // Record payment in database
  recordPayment: async function(amount, paymentMethod, transactionId) {
    const customerName = document.getElementById('customer-name')?.value || '';
    const customerEmail = document.getElementById('customer-email')?.value || '';
    const serviceId = document.getElementById('service-id')?.value || '';
    
    const response = await fetch('/api/payments/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token') || ''
      },
      body: JSON.stringify({
        amount,
        paymentMethod,
        customerName,
        customerEmail,
        serviceId,
        transactionId
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to record payment');
    }
    
    return await response.json();
  },
  
  // Show status message
  showStatus: function(statusElement, message, type) {
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.className = 'status';
    statusElement.classList.add(type);
    statusElement.style.display = 'block';
    
    // Hide status message after 5 seconds for success messages
    if (type === 'success') {
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 5000);
    }
  }
};

// Initialize payment integrations
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Stripe
  stripeIntegration.init('pk_test_your_publishable_key');
  
  // Initialize cryptocurrency payments
  cryptoIntegration.init();
  
  // Initialize PayPal
  paypalIntegration.init('your_paypal_client_id');
  
  // Handle payment method selection
  const paymentOptions = document.querySelectorAll('.payment-option');
  if (paymentOptions) {
    paymentOptions.forEach(option => {
      option.addEventListener('click', function() {
        // Remove active class from all options
        paymentOptions.forEach(opt => opt.classList.remove('active'));
        
        // Add active class to clicked option
        this.classList.add('active');
        
        // Update selected payment method
        const selectedMethod = this.getAttribute('data-method');
        
        // Show/hide appropriate payment form
        const paymentForms = document.querySelectorAll('.payment-form-section');
        paymentForms.forEach(form => {
          form.style.display = 'none';
        });
        
        const selectedForm = document.getElementById(`${selectedMethod}-payment-form`);
        if (selectedForm) {
          selectedForm.style.display = 'block';
        }
      });
    });
  }
});
