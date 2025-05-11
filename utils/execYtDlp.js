const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const execAsync = promisify(exec);

const YT_DLP_PATH = path.join(__dirname, '..', 'yt-dlp.exe');

// Increase maxBuffer size to handle larger outputs
const MAX_BUFFER_SIZE = 50 * 1024 * 1024; // 50MB

const checkYtDlp = async () => {
    try {
        console.log('Checking yt-dlp installation...');
        const { stdout, stderr } = await execAsync(`"${YT_DLP_PATH}" --version`, {
            maxBuffer: MAX_BUFFER_SIZE
        });
        if (stderr) {
            console.warn('yt-dlp version check stderr:', stderr);
        }
        console.log('yt-dlp version:', stdout.trim());
        return true;
    } catch (error) {
        console.error('yt-dlp check failed:', error);
        throw new Error('yt-dlp is not installed or not accessible. Please ensure yt-dlp.exe is in the project root directory.');
    }
};

exports.execYtDlp = async (command) => {
    try {
        console.log('Executing yt-dlp command:', command);
        const { stdout, stderr } = await execAsync(command, {
            maxBuffer: MAX_BUFFER_SIZE,
            windowsHide: true
        });

        if (stderr) {
            console.warn('yt-dlp stderr output:', stderr);
        }

        if (!stdout) {
            console.warn('No stdout output from yt-dlp command');
        } else {
            console.log('yt-dlp command executed successfully');
        }

        return stdout;
    } catch (error) {
        console.error('Error executing yt-dlp command:', error);
        console.error('Command that failed:', command);
        console.error('Error details:', {
            code: error.code,
            signal: error.signal,
            stdout: error.stdout,
            stderr: error.stderr
        });
        throw new Error(`yt-dlp command failed: ${error.message}`);
    }
}; 