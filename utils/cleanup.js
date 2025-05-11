const fs = require('fs').promises;
const path = require('path');

const MAX_FILE_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const cleanupOldFiles = async () => {
    try {
        const downloadsDir = path.join(__dirname, '../downloads');
        
        // Create downloads directory if it doesn't exist
        await fs.mkdir(downloadsDir, { recursive: true });
        
        const files = await fs.readdir(downloadsDir);
        const now = Date.now();
        
        for (const file of files) {
            const filePath = path.join(downloadsDir, file);
            const stats = await fs.stat(filePath);
            const fileAge = now - stats.mtime.getTime();
            
            if (fileAge > MAX_FILE_AGE) {
                await fs.unlink(filePath);
                console.log(`Cleaned up old file: ${file}`);
            }
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
};

// Run cleanup every hour
setInterval(cleanupOldFiles, 60 * 60 * 1000);

module.exports = {
    cleanupOldFiles
}; 