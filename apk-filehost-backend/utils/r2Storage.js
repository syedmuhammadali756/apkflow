const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Configure R2 client (S3-compatible)
const r2Client = new S3Client({
    region: 'auto', // Cloudflare R2 uses 'auto'
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

/**
 * Upload file to R2 storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} key - Storage key (path)
 * @param {string} contentType - MIME type
 * @returns {Promise<Object>} - Upload result
 */
async function uploadToR2(fileBuffer, key, contentType) {
    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
            // Optional: Make file publicly readable
            // ACL: 'public-read'
        });

        const result = await r2Client.send(command);

        return {
            success: true,
            key: key,
            etag: result.ETag,
            location: `${process.env.R2_PUBLIC_URL}/${key}`
        };
    } catch (error) {
        console.error('R2 upload error:', error);
        throw new Error(`Failed to upload file to storage: ${error.message}`);
    }
}

/**
 * Download file from R2 storage
 * @param {string} key - Storage key
 * @returns {Promise<ReadableStream>} - File stream
 */
async function downloadFromR2(key) {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        const result = await r2Client.send(command);

        return {
            stream: result.Body,
            contentType: result.ContentType,
            contentLength: result.ContentLength
        };
    } catch (error) {
        console.error('R2 download error:', error);
        throw new Error(`Failed to download file from storage: ${error.message}`);
    }
}

/**
 * Delete file from R2 storage
 * @param {string} key - Storage key
 * @returns {Promise<boolean>} - Success status
 */
async function deleteFromR2(key) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        await r2Client.send(command);

        return true;
    } catch (error) {
        console.error('R2 delete error:', error);
        throw new Error(`Failed to delete file from storage: ${error.message}`);
    }
}

module.exports = {
    uploadToR2,
    downloadFromR2,
    deleteFromR2
};
