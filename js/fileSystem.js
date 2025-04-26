// File Upload and Sharing Functionality
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const auth = require('./auth');

// Initialize router
const router = express.Router();

// Set up multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.user.id;
        const userDir = path.join(__dirname, '../uploads', userId);
        
        // Create user directory if it doesn't exist
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images, documents, audio, video, and archives
    const allowedFileTypes = [
        // Images
        '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp',
        // Documents
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md',
        // Audio
        '.mp3', '.wav', '.ogg', '.flac',
        // Video
        '.mp4', '.webm', '.avi', '.mov',
        // Archives
        '.zip', '.rar', '.7z', '.tar', '.gz'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes.includes(ext)) {
        return cb(null, true);
    }
    
    cb(new Error('Invalid file type. Only images, documents, audio, video, and archives are allowed.'));
};

// Set up multer upload
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max file size
    }
});

// File Schema
const fileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    mimetype: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: false },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    uploadDate: { type: Date, default: Date.now },
    category: { type: String, enum: ['image', 'document', 'audio', 'video', 'archive'], required: true }
});

// File model
const File = mongoose.model('File', fileSchema);

// Routes
// Upload file
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        // Determine file category
        const ext = path.extname(req.file.originalname).toLowerCase();
        let category;
        
        if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) {
            category = 'image';
        } else if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'].includes(ext)) {
            category = 'document';
        } else if (['.mp3', '.wav', '.ogg', '.flac'].includes(ext)) {
            category = 'audio';
        } else if (['.mp4', '.webm', '.avi', '.mov'].includes(ext)) {
            category = 'video';
        } else {
            category = 'archive';
        }
        
        // Create new file record
        const newFile = new File({
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
            user: req.user.id,
            category: category
        });
        
        await newFile.save();
        
        res.json(newFile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get all files for current user
router.get('/files', auth, async (req, res) => {
    try {
        const files = await File.find({ user: req.user.id }).sort({ uploadDate: -1 });
        res.json(files);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get files by category
router.get('/files/:category', auth, async (req, res) => {
    try {
        const { category } = req.params;
        
        if (!['image', 'document', 'audio', 'video', 'archive', 'all'].includes(category)) {
            return res.status(400).json({ message: 'Invalid category' });
        }
        
        let files;
        if (category === 'all') {
            files = await File.find({ user: req.user.id }).sort({ uploadDate: -1 });
        } else {
            files = await File.find({ user: req.user.id, category }).sort({ uploadDate: -1 });
        }
        
        res.json(files);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Download file
router.get('/download/:id', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        // Check if user has access to file
        if (file.user.toString() !== req.user.id && 
            !file.isPublic && 
            !file.sharedWith.includes(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        res.download(file.path, file.originalName);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Share file with other users
router.post('/share/:id', auth, async (req, res) => {
    try {
        const { emails } = req.body;
        
        if (!emails || !Array.isArray(emails)) {
            return res.status(400).json({ message: 'Please provide an array of email addresses' });
        }
        
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        // Check if user owns the file
        if (file.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Find users by email
        const users = await User.find({ email: { $in: emails } });
        
        // Get user IDs
        const userIds = users.map(user => user._id);
        
        // Update file's sharedWith array
        file.sharedWith = [...new Set([...file.sharedWith, ...userIds])];
        await file.save();
        
        res.json(file);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Make file public/private
router.put('/visibility/:id', auth, async (req, res) => {
    try {
        const { isPublic } = req.body;
        
        if (typeof isPublic !== 'boolean') {
            return res.status(400).json({ message: 'isPublic must be a boolean value' });
        }
        
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        // Check if user owns the file
        if (file.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        file.isPublic = isPublic;
        await file.save();
        
        res.json(file);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Delete file
router.delete('/files/:id', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        // Check if user owns the file
        if (file.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Delete file from filesystem
        fs.unlink(file.path, async (err) => {
            if (err) {
                console.error('Error deleting file:', err);
            }
            
            // Delete file from database
            await File.findByIdAndDelete(req.params.id);
            
            res.json({ message: 'File deleted successfully' });
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
