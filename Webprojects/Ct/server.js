const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Path to leaderboard file
const leaderboardPath = path.join(__dirname, 'leaderboard.json');

// Initialize leaderboard file if it doesn't exist
function initializeLeaderboard() {
    if (!fs.existsSync(leaderboardPath)) {
        fs.writeFileSync(leaderboardPath, JSON.stringify([], null, 2));
    }
}

// GET - Load leaderboard
app.get('/api/leaderboard', (req, res) => {
    try {
        initializeLeaderboard();
        const data = fs.readFileSync(leaderboardPath, 'utf8');
        const leaderboard = JSON.parse(data);
        res.json(leaderboard);
    } catch (error) {
        console.error('Error reading leaderboard:', error);
        res.status(500).json({ error: 'Failed to read leaderboard' });
    }
});

// POST - Save leaderboard
app.post('/api/leaderboard', (req, res) => {
    try {
        const leaderboard = req.body;
        fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboard, null, 2));
        res.json({ success: true, message: 'Leaderboard saved' });
    } catch (error) {
        console.error('Error writing leaderboard:', error);
        res.status(500).json({ error: 'Failed to save leaderboard' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🎰 Blackjack Server running at http://localhost:${PORT}`);
    console.log(`📊 Leaderboard file: ${leaderboardPath}`);
});
