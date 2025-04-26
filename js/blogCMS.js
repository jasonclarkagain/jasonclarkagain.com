// Blog Content Management System
const express = require('express');
const mongoose = require('mongoose');
const auth = require('./auth');
const slugify = require('slugify');

// Initialize router
const router = express.Router();

// Blog Post Schema
const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: { type: String },
    featuredImage: { type: String },
    category: { type: String, required: true },
    tags: [{ type: String }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    publishDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    views: { type: Number, default: 0 },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String, required: true },
        email: { type: String, required: true },
        content: { type: String, required: true },
        date: { type: Date, default: Date.now },
        approved: { type: Boolean, default: false }
    }]
});

// Generate slug before saving
postSchema.pre('save', function(next) {
    if (!this.isModified('title')) return next();
    
    this.slug = slugify(this.title, {
        lower: true,
        strict: true
    });
    
    next();
});

// Blog Post model
const Post = mongoose.model('Post', postSchema);

// Blog Category Schema
const blogCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String }
});

// Generate slug before saving
blogCategorySchema.pre('save', function(next) {
    if (!this.isModified('name')) return next();
    
    this.slug = slugify(this.name, {
        lower: true,
        strict: true
    });
    
    next();
});

// Blog Category model
const BlogCategory = mongoose.model('BlogCategory', blogCategorySchema);

// Routes
// Get all published posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find({ status: 'published' })
            .sort({ publishDate: -1 })
            .populate('author', 'name');
        
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get all posts (admin only)
router.get('/admin/posts', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const posts = await Post.find()
            .sort({ publishDate: -1 })
            .populate('author', 'name');
        
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get posts by category
router.get('/posts/category/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        const category = await BlogCategory.findOne({ slug });
        
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        const posts = await Post.find({ 
            category: category.name,
            status: 'published'
        })
        .sort({ publishDate: -1 })
        .populate('author', 'name');
        
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get posts by tag
router.get('/posts/tag/:tag', async (req, res) => {
    try {
        const { tag } = req.params;
        
        const posts = await Post.find({ 
            tags: tag,
            status: 'published'
        })
        .sort({ publishDate: -1 })
        .populate('author', 'name');
        
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get single post by slug
router.get('/posts/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        const post = await Post.findOne({ slug, status: 'published' })
            .populate('author', 'name')
            .populate('comments.user', 'name');
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        // Increment view count
        post.views += 1;
        await post.save();
        
        res.json(post);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Create new post (admin only)
router.post('/posts', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const { title, content, excerpt, featuredImage, category, tags, status } = req.body;
        
        // Check if category exists, create if not
        let blogCategory = await BlogCategory.findOne({ name: category });
        
        if (!blogCategory) {
            blogCategory = new BlogCategory({
                name: category,
                description: `Posts in the ${category} category`
            });
            
            await blogCategory.save();
        }
        
        // Create new post
        const newPost = new Post({
            title,
            content,
            excerpt: excerpt || content.substring(0, 200) + '...',
            featuredImage,
            category,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            author: req.user.id,
            status: status || 'draft'
        });
        
        await newPost.save();
        
        res.json(newPost);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Update post (admin only)
router.put('/posts/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const { title, content, excerpt, featuredImage, category, tags, status } = req.body;
        
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        // Check if category exists, create if not
        if (category && category !== post.category) {
            let blogCategory = await BlogCategory.findOne({ name: category });
            
            if (!blogCategory) {
                blogCategory = new BlogCategory({
                    name: category,
                    description: `Posts in the ${category} category`
                });
                
                await blogCategory.save();
            }
        }
        
        // Update post
        post.title = title || post.title;
        post.content = content || post.content;
        post.excerpt = excerpt || (content ? content.substring(0, 200) + '...' : post.excerpt);
        post.featuredImage = featuredImage || post.featuredImage;
        post.category = category || post.category;
        post.tags = tags ? tags.split(',').map(tag => tag.trim()) : post.tags;
        post.status = status || post.status;
        
        await post.save();
        
        res.json(post);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Delete post (admin only)
router.delete('/posts/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        await Post.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Add comment to post
router.post('/posts/:slug/comments', async (req, res) => {
    try {
        const { name, email, content } = req.body;
        
        const post = await Post.findOne({ slug: req.params.slug });
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        // Create new comment
        const newComment = {
            name,
            email,
            content,
            approved: false
        };
        
        // If user is logged in, associate comment with user
        if (req.user) {
            newComment.user = req.user.id;
            
            // Auto-approve comments from admin users
            if (req.user.isAdmin) {
                newComment.approved = true;
            }
        }
        
        post.comments.push(newComment);
        await post.save();
        
        res.json(post);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Approve comment (admin only)
router.put('/posts/:id/comments/:commentId/approve', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        // Find comment
        const comment = post.comments.id(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        
        // Approve comment
        comment.approved = true;
        await post.save();
        
        res.json(post);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Delete comment (admin only)
router.delete('/posts/:id/comments/:commentId', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        // Find and remove comment
        post.comments.id(req.params.commentId).remove();
        await post.save();
        
        res.json(post);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await BlogCategory.find().sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Create new category (admin only)
router.post('/categories', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const { name, description } = req.body;
        
        // Check if category already exists
        let category = await BlogCategory.findOne({ name });
        
        if (category) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        
        // Create new category
        category = new BlogCategory({
            name,
            description
        });
        
        await category.save();
        
        res.json(category);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
