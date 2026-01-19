# Blackjack Leaderboard Cross-Computer Setup

To enable the leaderboard to save across computers, follow these steps:

## Option 1: Using JSONBin (Recommended - Free & Easy)

1. Go to https://jsonbin.io
2. Click "Create Bin"
3. Paste this template:
```json
[]
```
4. Copy your BIN_ID from the URL (it will be in the URL like: https://jsonbin.io/b/YOUR_BIN_ID)
5. Open `blackjack.html` and replace `'your-bin-id'` with your actual BIN_ID in this line:
```javascript
const JSONBIN_BIN_ID = 'your-bin-id'; // Replace with your actual BIN_ID
```

That's it! The leaderboard will now sync across computers.

## Option 2: Using Firebase (Free with Google Account)

1. Go to https://firebase.google.com
2. Create a new project
3. Go to Realtime Database and create one in "Test mode"
4. Update the code in `blackjack.html` with your Firebase URL

## How It Works

- **Local Storage**: Saves to your computer automatically
- **Cloud Sync**: When connected to internet, syncs with the cloud
- **Merge Logic**: Takes the highest scores across all devices
- **Offline Support**: Works perfectly offline, syncs when connection returns

## Troubleshooting

If the leaderboard isn't syncing:
1. Check your BIN_ID is correct
2. Open browser console (F12) to see any error messages
3. Make sure you're connected to the internet
4. Try refreshing the page

The game will still work perfectly with or without cloud sync - your scores will always be saved locally!
