const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Lazy-init Storj S3 client
let storjClient = null;

function getStorjClient() {
    if (!storjClient && process.env.STORJ_ACCESS_KEY) {
        storjClient = new S3Client({
            region: 'global',
            endpoint: process.env.STORJ_ENDPOINT || 'https://gateway.storjshare.io',
            credentials: {
                accessKeyId: process.env.STORJ_ACCESS_KEY,
                secretAccessKey: process.env.STORJ_SECRET_KEY
            },
            forcePathStyle: true // Required for S3-compatible services
        });
    }
    if (!storjClient) throw new Error('Storj storage is not configured. Check STORJ_ACCESS_KEY env var.');
    return storjClient;
}

const BUCKET = process.env.STORJ_BUCKET || 'apk-files';

/**
 * Upload file to Storj storage
 */
async function uploadToStorj(fileBuffer, key, contentType) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType
    });

    const result = await getStorjClient().send(command);

    return {
        success: true,
        key: key,
        etag: result.ETag,
        location: getStorjPublicUrl(key)
    };
}

/**
 * Generate presigned PUT URL for direct frontend upload
 */
async function getPresignedUploadUrl(key, contentType) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(getStorjClient(), command, { expiresIn: 3600 }); // 1 hour

    return {
        uploadUrl,
        storageKey: key,
        publicUrl: getStorjPublicUrl(key)
    };
}

/**
 * Generate presigned GET URL for downloads (Storj uses link sharing)
 */
async function getPresignedDownloadUrl(key) {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key
    });

    return await getSignedUrl(getStorjClient(), command, { expiresIn: 3600 });
}

/**
 * Download file from Storj storage
 */
async function downloadFromStorj(key) {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key
    });

    const result = await getStorjClient().send(command);

    return {
        stream: result.Body,
        contentType: result.ContentType,
        contentLength: result.ContentLength
    };
}

/**
 * Delete file from Storj storage
 */
async function deleteFromStorj(key) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key
    });

    await getStorjClient().send(command);
    return true;
}

/**
 * Get public URL for a file (using Storj linksharing)
 */
function getStorjPublicUrl(key) {
    // Storj public URLs go through linksharing service
    // Format: https://link.storjshare.io/s/<access-grant>/<bucket>/<key>
    // But for S3 gateway, presigned URLs are used instead
    const endpoint = process.env.STORJ_ENDPOINT || 'https://gateway.storjshare.io';
    return `${endpoint}/${BUCKET}/${key}`;
}

module.exports = {
    uploadToStorj,
    downloadFromStorj,
    deleteFromStorj,
    getStorjPublicUrl,
    getPresignedUploadUrl,
    getPresignedDownloadUrl
};
