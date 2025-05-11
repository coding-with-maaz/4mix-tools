const fs = require('fs');
const path = require('path');

const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');

exports.ensureDownloadsDir = () => {
    if (!fs.existsSync(DOWNLOADS_DIR)) {
        fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
    }
    return DOWNLOADS_DIR;
};

exports.getDownloadPath = (filename) => {
    const downloadsDir = exports.ensureDownloadsDir();
    return path.join(downloadsDir, filename);
}; 