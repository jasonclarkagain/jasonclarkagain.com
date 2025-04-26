// Interactive Photo Gallery with Lightbox
const express = require('express');
const mongoose = require('mongoose');
const auth = require('./auth');
const path = require('path');
const fs = require('fs');

// Initialize router
const router = express.Router();

// Photo Schema
const photoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    thumbnailPath: { type: String, required: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    uploadDate: { type: Date, default: Date.now },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Photo model
const Photo = mongoose.model('Photo', photoSchema);

// Photo Category Schema
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    coverImage: { type: String },
    count: { type: Number, default: 0 }
});

// Category model
const Category = mongoose.model('Category', categorySchema);

// Routes
// Get all photos
router.get('/photos', async (req, res) => {
    try {
        const photos = await Photo.find().sort({ uploadDate: -1 });
        res.json(photos);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get featured photos
router.get('/photos/featured', async (req, res) => {
    try {
        const photos = await Photo.find({ featured: true }).sort({ uploadDate: -1 });
        res.json(photos);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get photos by category
router.get('/photos/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const photos = await Photo.find({ category }).sort({ uploadDate: -1 });
        res.json(photos);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get photos by tag
router.get('/photos/tag/:tag', async (req, res) => {
    try {
        const { tag } = req.params;
        const photos = await Photo.find({ tags: tag }).sort({ uploadDate: -1 });
        res.json(photos);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get single photo
router.get('/photos/:id', async (req, res) => {
    try {
        const photo = await Photo.findById(req.params.id);
        
        if (!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }
        
        // Increment view count
        photo.views += 1;
        await photo.save();
        
        res.json(photo);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Add new photo (admin only)
router.post('/photos', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const { title, description, filename, path, thumbnailPath, category, tags, featured } = req.body;
        
        // Create new photo
        const newPhoto = new Photo({
            title,
            description,
            filename,
            path,
            thumbnailPath,
            category,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            featured: featured || false,
            user: req.user.id
        });
        
        await newPhoto.save();
        
        // Update category count
        let photoCategory = await Category.findOne({ name: category });
        
        if (photoCategory) {
            photoCategory.count += 1;
            await photoCategory.save();
        } else {
            // Create new category if it doesn't exist
            photoCategory = new Category({
                name: category,
                description: `Photos in the ${category} category`,
                count: 1
            });
            
            await photoCategory.save();
        }
        
        res.json(newPhoto);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Update photo (admin only)
router.put('/photos/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const { title, description, category, tags, featured } = req.body;
        
        const photo = await Photo.findById(req.params.id);
        
        if (!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }
        
        // Check if category is being changed
        const oldCategory = photo.category;
        const newCategory = category;
        
        // Update photo
        photo.title = title || photo.title;
        photo.description = description || photo.description;
        photo.category = category || photo.category;
        photo.tags = tags ? tags.split(',').map(tag => tag.trim()) : photo.tags;
        photo.featured = featured !== undefined ? featured : photo.featured;
        
        await photo.save();
        
        // Update category counts if category changed
        if (oldCategory !== newCategory) {
            // Decrement old category count
            let oldPhotoCategory = await Category.findOne({ name: oldCategory });
            if (oldPhotoCategory) {
                oldPhotoCategory.count -= 1;
                await oldPhotoCategory.save();
            }
            
            // Increment new category count
            let newPhotoCategory = await Category.findOne({ name: newCategory });
            
            if (newPhotoCategory) {
                newPhotoCategory.count += 1;
                await newPhotoCategory.save();
            } else {
                // Create new category if it doesn't exist
                newPhotoCategory = new Category({
                    name: newCategory,
                    description: `Photos in the ${newCategory} category`,
                    count: 1
                });
                
                await newPhotoCategory.save();
            }
        }
        
        res.json(photo);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Delete photo (admin only)
router.delete('/photos/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const photo = await Photo.findById(req.params.id);
        
        if (!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }
        
        // Delete photo files
        if (fs.existsSync(photo.path)) {
            fs.unlinkSync(photo.path);
        }
        
        if (fs.existsSync(photo.thumbnailPath)) {
            fs.unlinkSync(photo.thumbnailPath);
        }
        
        // Update category count
        const category = await Category.findOne({ name: photo.category });
        if (category) {
            category.count -= 1;
            await category.save();
        }
        
        // Delete photo from database
        await Photo.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Like photo
router.post('/photos/:id/like', auth, async (req, res) => {
    try {
        const photo = await Photo.findById(req.params.id);
        
        if (!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }
        
        // Increment like count
        photo.likes += 1;
        await photo.save();
        
        res.json(photo);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Frontend JavaScript for Interactive Gallery
const galleryFrontend = `
// Interactive Photo Gallery with Lightbox
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const gallery = document.querySelector('.photo-gallery');
    const lightbox = document.querySelector('.lightbox');
    const lightboxImage = document.querySelector('.lightbox-image');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxTitle = document.querySelector('.lightbox-title');
    const lightboxDescription = document.querySelector('.lightbox-description');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    const categoryFilters = document.querySelectorAll('.category-filter');
    
    // Variables
    let currentIndex = 0;
    let photos = [];
    
    // Fetch photos from API
    async function fetchPhotos(category = null) {
        try {
            let url = '/api/gallery/photos';
            
            if (category && category !== 'all') {
                url = \`/api/gallery/photos/category/\${category}\`;
            }
            
            const response = await fetch(url);
            const data = await response.json();
            
            photos = data;
            renderGallery(photos);
        } catch (error) {
            console.error('Error fetching photos:', error);
        }
    }
    
    // Render gallery
    function renderGallery(photosToRender) {
        gallery.innerHTML = '';
        
        photosToRender.forEach((photo, index) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            
            photoItem.innerHTML = \`
                <img src="\${photo.thumbnailPath}" alt="\${photo.title}">
                <div class="photo-overlay">
                    <h3>\${photo.title}</h3>
                    <span class="photo-category">\${photo.category}</span>
                </div>
            \`;
            
            photoItem.addEventListener('click', () => openLightbox(index));
            
            gallery.appendChild(photoItem);
        });
    }
    
    // Open lightbox
    function openLightbox(index) {
        if (!photos.length) return;
        
        currentIndex = index;
        updateLightboxContent();
        
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Close lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Update lightbox content
    function updateLightboxContent() {
        const photo = photos[currentIndex];
        
        lightboxImage.src = photo.path;
        lightboxTitle.textContent = photo.title;
        lightboxDescription.textContent = photo.description || '';
        
        // Update like count via API
        fetch(\`/api/gallery/photos/\${photo._id}\`, { method: 'GET' })
            .catch(error => console.error('Error updating view count:', error));
    }
    
    // Navigate to previous photo
    function prevPhoto() {
        currentIndex = (currentIndex - 1 + photos.length) % photos.length;
        updateLightboxContent();
    }
    
    // Navigate to next photo
    function nextPhoto() {
        currentIndex = (currentIndex + 1) % photos.length;
        updateLightboxContent();
    }
    
    // Filter photos by category
    function filterByCategory(category) {
        categoryFilters.forEach(filter => {
            filter.classList.remove('active');
            if (filter.dataset.category === category) {
                filter.classList.add('active');
            }
        });
        
        fetchPhotos(category);
    }
    
    // Event listeners
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', prevPhoto);
    }
    
    if (lightboxNext) {
        lightboxNext.addEventListener('click', nextPhoto);
    }
    
    // Close lightbox when clicking outside the image
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            prevPhoto();
        } else if (e.key === 'ArrowRight') {
            nextPhoto();
        }
    });
    
    // Category filter event listeners
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            const category = this.dataset.category;
            filterByCategory(category);
        });
    });
    
    // Like button
    document.querySelector('.lightbox-like').addEventListener('click', function() {
        const photo = photos[currentIndex];
        
        fetch(\`/api/gallery/photos/\${photo._id}/like\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            }
        })
        .then(response => response.json())
        .then(data => {
            photos[currentIndex] = data;
            this.querySelector('span').textContent = data.likes;
        })
        .catch(error => console.error('Error liking photo:', error));
    });
    
    // Initialize gallery
    fetchPhotos();
});
`;

// Export router and frontend script
module.exports = {
    router,
    galleryFrontend
};
