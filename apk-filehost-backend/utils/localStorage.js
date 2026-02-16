const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Promisify fs methods
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);

// Uploads directory
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Ensure uploads directory exists (skip on read-only serverless environments)
try {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
} catch (e) {
    // Read-only filesystem (e.g., Vercel serverless) - local storage won't work
    console.warn('Cannot create uploads directory - local storage unavailable');
}

/**
 * Save file to local storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} key - Unique file key
 * @returns {Promise<string>} - File path
 */
async function uploadToLocal(fileBuffer, key) {
    try {
        const filePath = path.join(UPLOADS_DIR, key);

        // Ensure directory exists for the file
        const dir = path.dirname(filePath);
        if (!await exists(dir)) {
            await mkdir(dir, { recursive: true });
        }

        await writeFile(filePath, fileBuffer);
        return {
            key: key,
            location: `/uploads/${key}`
        };
    } catch (error) {
        console.error('Local upload error:', error);
        throw new Error('Failed to save file locally');
    }
}

/**
 * Get file stream from local storage
 * @param {string} key - File key
 * @returns {Promise<ReadStream>} - File stream
 */
async function downloadFromLocal(key) {
    try {
        const filePath = path.join(UPLOADS_DIR, key);
        if (!fs.existsSync(filePath)) {
            throw new Error('File not found');
        }

        const stats = fs.statSync(filePath);
        const stream = fs.createReadStream(filePath);

        return {
            stream,
            contentLength: stats.size
        };
    } catch (error) {
        console.error('Local download error:', error);
        throw new Error('Failed to read file locally');
    }
}

/**
 * Delete file from local storage
 * @param {string} key - File key
 */
async function deleteFromLocal(key) {
    try {
        const filePath = path.join(UPLOADS_DIR, key);
        if (fs.existsSync(filePath)) {
            await unlink(filePath);
        }
        return true;
    } catch (error) {
        console.error('Local delete error:', error);
        throw new Error('Failed to delete local file');
    }
}

module.exports = {
    uploadToLocal,
    downloadFromLocal,
    deleteFromLocal
};
