// Music Player with Playlist Functionality
const express = require('express');
const mongoose = require('mongoose');
const auth = require('./auth');
const path = require('path');
const fs = require('fs');

// Initialize router
const router = express.Router();

// Track Schema
const trackSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: String, required: true },
    album: { type: String },
    genre: { type: String },
    duration: { type: String },
    releaseYear: { type: Number },
    coverArt: { type: String },
    audioFile: { type: String, required: true },
    featured: { type: Boolean, default: false },
    plays: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    uploadDate: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Track model
const Track = mongoose.model('Track', trackSchema);

// Playlist Schema
const playlistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    coverArt: { type: String },
    tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
    isPublic: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Playlist model
const Playlist = mongoose.model('Playlist', playlistSchema);

// Routes
// Get all tracks
router.get('/tracks', async (req, res) => {
    try {
        const tracks = await Track.find().sort({ uploadDate: -1 });
        res.json(tracks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get featured tracks
router.get('/tracks/featured', async (req, res) => {
    try {
        const tracks = await Track.find({ featured: true }).sort({ uploadDate: -1 });
        res.json(tracks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get tracks by genre
router.get('/tracks/genre/:genre', async (req, res) => {
    try {
        const { genre } = req.params;
        const tracks = await Track.find({ genre }).sort({ uploadDate: -1 });
        res.json(tracks);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get single track
router.get('/tracks/:id', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        
        if (!track) {
            return res.status(404).json({ message: 'Track not found' });
        }
        
        res.json(track);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Play track (increment play count)
router.post('/tracks/:id/play', async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        
        if (!track) {
            return res.status(404).json({ message: 'Track not found' });
        }
        
        // Increment play count
        track.plays += 1;
        await track.save();
        
        res.json(track);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Like track
router.post('/tracks/:id/like', auth, async (req, res) => {
    try {
        const track = await Track.findById(req.params.id);
        
        if (!track) {
            return res.status(404).json({ message: 'Track not found' });
        }
        
        // Increment like count
        track.likes += 1;
        await track.save();
        
        res.json(track);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Add new track (admin only)
router.post('/tracks', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const { title, artist, album, genre, duration, releaseYear, coverArt, audioFile, featured } = req.body;
        
        // Create new track
        const newTrack = new Track({
            title,
            artist,
            album,
            genre,
            duration,
            releaseYear,
            coverArt,
            audioFile,
            featured: featured || false,
            user: req.user.id
        });
        
        await newTrack.save();
        
        res.json(newTrack);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Update track (admin only)
router.put('/tracks/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const { title, artist, album, genre, duration, releaseYear, coverArt, featured } = req.body;
        
        const track = await Track.findById(req.params.id);
        
        if (!track) {
            return res.status(404).json({ message: 'Track not found' });
        }
        
        // Update track
        track.title = title || track.title;
        track.artist = artist || track.artist;
        track.album = album || track.album;
        track.genre = genre || track.genre;
        track.duration = duration || track.duration;
        track.releaseYear = releaseYear || track.releaseYear;
        track.coverArt = coverArt || track.coverArt;
        track.featured = featured !== undefined ? featured : track.featured;
        
        await track.save();
        
        res.json(track);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Delete track (admin only)
router.delete('/tracks/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const track = await Track.findById(req.params.id);
        
        if (!track) {
            return res.status(404).json({ message: 'Track not found' });
        }
        
        // Delete audio file
        if (fs.existsSync(track.audioFile)) {
            fs.unlinkSync(track.audioFile);
        }
        
        // Delete cover art if it exists
        if (track.coverArt && fs.existsSync(track.coverArt)) {
            fs.unlinkSync(track.coverArt);
        }
        
        // Delete track from database
        await Track.findByIdAndDelete(req.params.id);
        
        // Remove track from all playlists
        await Playlist.updateMany(
            { tracks: req.params.id },
            { $pull: { tracks: req.params.id } }
        );
        
        res.json({ message: 'Track deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get all playlists
router.get('/playlists', async (req, res) => {
    try {
        const playlists = await Playlist.find({ isPublic: true })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name');
        
        res.json(playlists);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get user's playlists
router.get('/playlists/user', auth, async (req, res) => {
    try {
        const playlists = await Playlist.find({ createdBy: req.user.id })
            .sort({ createdAt: -1 });
        
        res.json(playlists);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Get single playlist with tracks
router.get('/playlists/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate('tracks')
            .populate('createdBy', 'name');
        
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }
        
        // Check if playlist is private and user is not the creator
        if (!playlist.isPublic && (!req.user || playlist.createdBy.toString() !== req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        res.json(playlist);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Create new playlist
router.post('/playlists', auth, async (req, res) => {
    try {
        const { name, description, coverArt, tracks, isPublic } = req.body;
        
        // Create new playlist
        const newPlaylist = new Playlist({
            name,
            description,
            coverArt,
            tracks: tracks || [],
            isPublic: isPublic !== undefined ? isPublic : true,
            createdBy: req.user.id
        });
        
        await newPlaylist.save();
        
        res.json(newPlaylist);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Update playlist
router.put('/playlists/:id', auth, async (req, res) => {
    try {
        const { name, description, coverArt, isPublic } = req.body;
        
        const playlist = await Playlist.findById(req.params.id);
        
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }
        
        // Check if user is the creator or admin
        if (playlist.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Update playlist
        playlist.name = name || playlist.name;
        playlist.description = description || playlist.description;
        playlist.coverArt = coverArt || playlist.coverArt;
        playlist.isPublic = isPublic !== undefined ? isPublic : playlist.isPublic;
        playlist.updatedAt = Date.now();
        
        await playlist.save();
        
        res.json(playlist);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Add track to playlist
router.post('/playlists/:id/tracks', auth, async (req, res) => {
    try {
        const { trackId } = req.body;
        
        const playlist = await Playlist.findById(req.params.id);
        
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }
        
        // Check if user is the creator or admin
        if (playlist.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Check if track exists
        const track = await Track.findById(trackId);
        
        if (!track) {
            return res.status(404).json({ message: 'Track not found' });
        }
        
        // Check if track is already in playlist
        if (playlist.tracks.includes(trackId)) {
            return res.status(400).json({ message: 'Track already in playlist' });
        }
        
        // Add track to playlist
        playlist.tracks.push(trackId);
        playlist.updatedAt = Date.now();
        
        await playlist.save();
        
        res.json(playlist);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Remove track from playlist
router.delete('/playlists/:id/tracks/:trackId', auth, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }
        
        // Check if user is the creator or admin
        if (playlist.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Remove track from playlist
        playlist.tracks = playlist.tracks.filter(
            track => track.toString() !== req.params.trackId
        );
        playlist.updatedAt = Date.now();
        
        await playlist.save();
        
        res.json(playlist);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Delete playlist
router.delete('/playlists/:id', auth, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }
        
        // Check if user is the creator or admin
        if (playlist.createdBy.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Delete playlist
        await Playlist.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Playlist deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Frontend JavaScript for Music Player
const musicPlayerFrontend = `
// Music Player with Playlist Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const audioPlayer = document.getElementById('audio-player');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const trackCover = document.getElementById('track-cover');
    const playlistContainer = document.getElementById('playlist-container');
    const playlistSelect = document.getElementById('playlist-select');
    
    // Variables
    let tracks = [];
    let playlists = [];
    let currentTrackIndex = 0;
    let isPlaying = false;
    let currentPlaylistId = null;
    
    // Fetch tracks from API
    async function fetchTracks() {
        try {
            const response = await fetch('/api/music/tracks');
            const data = await response.json();
            
            tracks = data;
            renderPlaylist(tracks);
            
            if (tracks.length > 0) {
                loadTrack(0);
            }
        } catch (error) {
            console.error('Error fetching tracks:', error);
        }
    }
    
    // Fetch playlists from API
    async function fetchPlaylists() {
        try {
            const response = await fetch('/api/music/playlists');
            const data = await response.json();
            
            playlists = data;
            renderPlaylistOptions(playlists);
        } catch (error) {
            console.error('Error fetching playlists:', error);
        }
    }
    
    // Fetch tracks for a specific playlist
    async function fetchPlaylistTracks(playlistId) {
        try {
            const response = await fetch(\`/api/music/playlists/\${playlistId}\`);
            const data = await response.json();
            
            tracks = data.tracks;
            renderPlaylist(tracks);
            currentPlaylistId = playlistId;
            
            if (tracks.length > 0) {
                loadTrack(0);
            }
        } catch (error) {
            console.error('Error fetching playlist tracks:', error);
        }
    }
    
    // Render playlist options
    function renderPlaylistOptions(playlistsToRender) {
        if (!playlistSelect) return;
        
        playlistSelect.innerHTML = '<option value="">All Tracks</option>';
        
        playlistsToRender.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist._id;
            option.textContent = playlist.name;
            playlistSelect.appendChild(option);
        });
    }
    
    // Render playlist
    function renderPlaylist(tracksToRender) {
        if (!playlistContainer) return;
        
        playlistContainer.innerHTML = '';
        
        tracksToRender.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'playlist-item';
            trackItem.dataset.index = index;
            
            trackItem.innerHTML = \`
                <div class="playlist-item-cover">
                    <img src="\${track.coverArt || '/images/default-cover.jpg'}" alt="\${track.title}">
                </div>
                <div class="playlist-item-info">
                    <h4>\${track.title}</h4>
                    <p>\${track.artist}</p>
                </div>
                <div class="playlist-item-duration">\${track.duration || '0:00'}</div>
            \`;
            
            trackItem.addEventListener('click', () => {
                loadTrack(index);
                playTrack();
            });
            
            playlistContainer.appendChild(trackItem);
        });
    }
    
    // Load track
    function loadTrack(index) {
        if (!tracks.length) return;
        
        currentTrackIndex = index;
        const track = tracks[currentTrackIndex];
        
        if (audioPlayer) {
            audioPlayer.src = track.audioFile;
            audioPlayer.load();
        }
        
        if (trackTitle) trackTitle.textContent = track.title;
        if (trackArtist) trackArtist.textContent = track.artist;
        if (trackCover) trackCover.src = track.coverArt || '/images/default-cover.jpg';
        
        // Update active track in playlist
        const playlistItems = document.querySelectorAll('.playlist-item');
        playlistItems.forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.dataset.index) === currentTrackIndex) {
                item.classList.add('active');
            }
        });
        
        // Record play count via API
        fetch(\`/api/music/tracks/\${track._id}/play\`, { method: 'POST' })
            .catch(error => console.error('Error updating play count:', error));
    }
    
    // Play track
    function playTrack() {
        if (!audioPlayer) return;
        
        audioPlayer.play();
        isPlaying = true;
        
        if (playBtn) playBtn.style.display = 'none';
        if (pauseBtn) pauseBtn.style.display = 'inline-block';
    }
    
    // Pause track
    function pauseTrack() {
        if (!audioPlayer) return;
        
        audioPlayer.pause();
        isPlaying = false;
        
        if (playBtn) playBtn.style.display = 'inline-block';
        if (pauseBtn) pauseBtn.style.display = 'none';
    }
    
    // Play previous track
    function playPrevTrack() {
        if (!tracks.length) return;
        
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        loadTrack(currentTrackIndex);
        playTrack();
    }
    
    // Play next track
    function playNextTrack() {
        if (!tracks.length) return;
        
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        loadTrack(currentTrackIndex);
        playTrack();
    }
    
    // Update progress bar
    function updateProgress() {
        if (!audioPlayer || !progressBar || !progressFill || !currentTimeDisplay || !durationDisplay) return;
        
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration || 0;
        
        // Update progress bar
        const progressPercent = (currentTime / duration) * 100;
        progressFill.style.width = \`\${progressPercent}%\`;
        
        // Update time displays
        currentTimeDisplay.textContent = formatTime(currentTime);
        durationDisplay.textContent = formatTime(duration);
    }
    
    // Format time in MM:SS
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return \`\${mins}:\${secs < 10 ? '0' : ''}\${secs}\`;
    }
    
    // Set progress when clicking on progress bar
    function setProgress(e) {
        if (!audioPlayer || !progressBar) return;
        
        const width = progressBar.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        
        audioPlayer.currentTime = (clickX / width) * duration;
    }
    
    // Event listeners
    if (playBtn) {
        playBtn.addEventListener('click', playTrack);
    }
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', pauseTrack);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', playPrevTrack);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', playNextTrack);
    }
    
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            if (audioPlayer) {
                audioPlayer.volume = this.value / 100;
            }
        });
    }
    
    if (progressBar) {
        progressBar.addEventListener('click', setProgress);
    }
    
    if (audioPlayer) {
        audioPlayer.addEventListener('timeupdate', updateProgress);
        audioPlayer.addEventListener('ended', playNextTrack);
    }
    
    if (playlistSelect) {
        playlistSelect.addEventListener('change', function() {
            const playlistId = this.value;
            
            if (playlistId) {
                fetchPlaylistTracks(playlistId);
            } else {
                fetchTracks();
            }
        });
    }
    
    // Initialize
    fetchTracks();
    fetchPlaylists();
});
`;

// Export router and frontend script
module.exports = {
    router,
    musicPlayerFrontend
};
