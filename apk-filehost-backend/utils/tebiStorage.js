const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Lazy-init Tebi S3 client
let tebiClient = null;

function getTebiClient() {
    if (!tebiClient && process.env.TEBI_ACCESS_KEY) {
        tebiClient = new S3Client({
            region: 'global',
            endpoint: process.env.TEBI_ENDPOINT || 'https://s3.tebi.io',
            credentials: {
                accessKeyId: process.env.TEBI_ACCESS_KEY,
                secretAccessKey: process.env.TEBI_SECRET_KEY
            },
            forcePathStyle: true // Required for S3-compatible services
        });
    }
    if (!tebiClient) throw new Error('Tebi storage is not configured. Check TEBI_ACCESS_KEY env var.');
    return tebiClient;
}

const BUCKET = process.env.TEBI_BUCKET || 'apk-files';

/**
 * Upload file to Tebi storage
 */
async function uploadToTebi(fileBuffer, key, contentType) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read'
    });

    const result = await getTebiClient().send(command);

    return {
        success: true,
        key: key,
        etag: result.ETag,
        location: getTebiPublicUrl(key)
    };
}

/**
 * Generate presigned PUT URL for direct frontend upload
 */
async function getPresignedUploadUrl(key, contentType) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
        ACL: 'public-read'
    });

    const uploadUrl = await getSignedUrl(getTebiClient(), command, { expiresIn: 3600 }); // 1 hour

    return {
        uploadUrl,
        storageKey: key,
        publicUrl: getTebiPublicUrl(key)
    };
}

/**
 * Download file from Tebi storage
 */
async function downloadFromTebi(key) {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key
    });

    const result = await getTebiClient().send(command);

    return {
        stream: result.Body,
        contentType: result.ContentType,
        contentLength: result.ContentLength
    };
}

/**
 * Delete file from Tebi storage
 */
async function deleteFromTebi(key) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key
    });

    await getTebiClient().send(command);
    return true;
}

/**
 * Get public URL for a file
 */
function getTebiPublicUrl(key) {
    const endpoint = process.env.TEBI_ENDPOINT || 'https://s3.tebi.io';
    return `${endpoint}/${BUCKET}/${key}`;
}

module.exports = {
    uploadToTebi,
    downloadFromTebi,
    deleteFromTebi,
    getTebiPublicUrl,
    getPresignedUploadUrl
};
