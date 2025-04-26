# Hybrid Deployment Guide for Jason Clark's Portfolio Website

This guide provides detailed instructions for implementing a hybrid deployment approach for your portfolio website, making it accessible through traditional web browsers, Web3 browsers, and the Tor Browser.

## Table of Contents
1. [Traditional Domain Registration](#traditional-domain-registration)
2. [Web3 Domain Acquisition](#web3-domain-acquisition)
3. [Traditional Web Hosting with Netlify](#traditional-web-hosting-with-netlify)
4. [IPFS Deployment for Web3 Access](#ipfs-deployment-for-web3-access)
5. [Maintaining Your Tor Hidden Service](#maintaining-your-tor-hidden-service)
6. [Post-Deployment Tasks](#post-deployment-tasks)

## Traditional Domain Registration

### Registering jasonclarkagain.com with Namecheap

1. **Create an Account**
   - Visit [Namecheap.com](https://www.namecheap.com/)
   - Click "Sign Up" and create an account

2. **Search for Your Domain**
   - Enter "jasonclarkagain.com" in the search bar
   - If available, add it to your cart
   - If unavailable, consider alternatives like jasonclark.io, jasonclark.co, etc.

3. **Complete the Purchase**
   - Select your registration period (1-10 years)
   - Add WhoisGuard privacy protection (free with Namecheap)
   - Complete the checkout process

4. **Configure DNS Settings** (after Netlify setup)
   - In your Namecheap dashboard, go to "Domain List" → jasonclarkagain.com → "Manage"
   - Select the "Advanced DNS" tab
   - Add the following records (you'll get these from Netlify after setup):
     - Type: A Record, Host: @, Value: Netlify's IP address, TTL: Automatic
     - Type: CNAME, Host: www, Value: your-netlify-site.netlify.app, TTL: Automatic

## Web3 Domain Acquisition

### Acquiring a Domain through Unstoppable Domains

1. **Create an Account**
   - Visit [Unstoppable Domains](https://unstoppabledomains.com/)
   - Click "Sign Up" and create an account

2. **Search for Your Domain**
   - Search for "jasonclark" with extensions like .crypto, .nft, .wallet, etc.
   - Select the domain you prefer

3. **Purchase the Domain**
   - Add the domain to your cart
   - Complete the checkout process (one-time payment, no renewals)

4. **Claim Your Domain**
   - Follow Unstoppable Domains' instructions to claim your domain
   - You'll need a crypto wallet (like MetaMask) to complete this process
   - Pay the gas fee to mint your domain on the blockchain

5. **Configure Your Domain** (after IPFS setup)
   - In your Unstoppable Domains dashboard, select your domain
   - Go to "Manage" → "Website"
   - Enter your IPFS hash (CID) from the IPFS deployment step
   - Save changes

## Traditional Web Hosting with Netlify

### Deploying to Netlify

1. **Create a Netlify Account**
   - Visit [Netlify.com](https://www.netlify.com/)
   - Sign up using your email or GitHub account

2. **Prepare Your Website Files**
   - Ensure your website files are ready for deployment
   - The zip archive provided contains all necessary files

3. **Deploy via Drag and Drop**
   - In your Netlify dashboard, go to the "Sites" section
   - Drag and drop your website folder or the unzipped archive onto the designated area
   - Netlify will automatically upload and deploy your site

4. **Configure Your Site**
   - Once deployed, click on your new site
   - Go to "Site settings" → "Change site name" to set a custom subdomain (e.g., jason-clark-portfolio.netlify.app)

5. **Set Up Custom Domain**
   - In your site dashboard, go to "Domain settings" → "Add custom domain"
   - Enter your domain (jasonclarkagain.com)
   - Follow Netlify's instructions to verify domain ownership
   - Netlify will provide DNS records to add to your domain registrar (Namecheap)

6. **Enable HTTPS**
   - In "Domain settings," enable HTTPS
   - Netlify provides free SSL certificates through Let's Encrypt
   - This process may take up to 24 hours to complete

## IPFS Deployment for Web3 Access

### Using Fleek for IPFS Deployment

1. **Create a Fleek Account**
   - Visit [Fleek.co](https://fleek.co/)
   - Sign up using your email or GitHub account

2. **Create a New Site**
   - Click "Add new site"
   - Select "Upload" as your deployment method

3. **Upload Your Website**
   - Upload your website files (the same ones used for Netlify)
   - Configure build settings if necessary (usually not needed for static sites)

4. **Deploy Your Site**
   - Click "Deploy site"
   - Fleek will upload your files to IPFS and provide an IPFS hash (CID)

5. **Connect to Your Unstoppable Domain**
   - Copy the IPFS hash (CID) provided by Fleek
   - Use this hash in the Unstoppable Domains configuration (from the Web3 Domain section)

6. **Verify Your Deployment**
   - Your site should now be accessible via:
     - IPFS gateway: https://ipfs.io/ipfs/[your-ipfs-hash]
     - Fleek URL: [your-site-name].on.fleek.co
     - Unstoppable Domain (requires compatible browser or extension)

## Maintaining Your Tor Hidden Service

### Your Existing Tor Hidden Service

Your Tor hidden service is already set up with the following onion address:
```
h35wtv6ctnrryojyaep4hrhbxqk4wqe6xdvy73uxvf2xryxdwjhgbqid.onion
```

To maintain this service:

1. **Keep the Server Running**
   - Ensure the web server continues running on port 8000
   - The Tor service should start automatically on system boot

2. **Update Content**
   - When you update your website, make sure to update the files in the `/home/ubuntu/portfolio_website` directory
   - This ensures your Tor hidden service stays in sync with your main website

3. **Monitor the Service**
   - Periodically check that your onion site is accessible
   - You can use the Tor Browser to visit your .onion address

4. **Backup Your Keys**
   - Your hidden service private key is stored in `/var/lib/tor/hidden_service/private_key`
   - Consider backing up this file securely to avoid losing access to your .onion address

## Post-Deployment Tasks

1. **Test All Access Methods**
   - Traditional web: https://jasonclarkagain.com
   - Web3: your-domain.crypto (via compatible browser)
   - Tor: h35wtv6ctnrryojyaep4hrhbxqk4wqe6xdvy73uxvf2xryxdwjhgbqid.onion

2. **Set Up Analytics** (optional)
   - Consider privacy-focused analytics like Plausible or Fathom
   - Implement only on the traditional website to respect privacy on Web3 and Tor versions

3. **Create a Content Update Strategy**
   - Develop a process for updating content across all platforms
   - Consider using a Git repository to manage changes

4. **Regular Maintenance**
   - Keep software and dependencies updated
   - Periodically check for broken links or issues
   - Renew your traditional domain name annually

5. **Backup Strategy**
   - Regularly backup your website files
   - Store backups in multiple locations

By following this hybrid deployment approach, your portfolio website will be accessible to the widest possible audience while also offering privacy-focused alternatives through Web3 and Tor technologies.
