const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Lazy-init Tebi S3 client
let tebiClient = null;

function getTebiClient() {
    if (!tebiClient && process.env.TEBI_ACCESS_KEY) {
        const endpoint = process.env.TEBI_ENDPOINT || 'https://s3.tebi.io';
        // Extract region from endpoint (e.g., s3.us-east-005.backblazeb2.com -> us-east-005)
        let region = 'us-east-1';
        try {
            const hostname = new URL(endpoint).hostname;
            const parts = hostname.split('.');
            if (parts.length >= 3 && parts[0] === 's3') {
                region = parts[1]; // e.g., 'us-east-005'
            }
        } catch (e) { /* fallback to us-east-1 */ }

        tebiClient = new S3Client({
            region,
            endpoint,
            credentials: {
                accessKeyId: process.env.TEBI_ACCESS_KEY,
                secretAccessKey: process.env.TEBI_SECRET_KEY
            },
            forcePathStyle: true
        });
    }
    if (!tebiClient) throw new Error('Storage is not configured. Check TEBI_ACCESS_KEY env var.');
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
        ContentType: contentType
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
    // Don't sign ContentType — browser sets its own Content-Type header
    // which can mismatch the signed value and cause 403/stalled uploads
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key
    });

    const uploadUrl = await getSignedUrl(getTebiClient(), command, { expiresIn: 3600 });

    return {
        uploadUrl,
        storageKey: key,
        publicUrl: getTebiPublicUrl(key)
    };
}

/**
 * Generate presigned GET URL for downloads
 */
async function getPresignedDownloadUrl(key) {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key
    });

    return await getSignedUrl(getTebiClient(), command, { expiresIn: 3600 });
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
 * Initiate Multipart Upload
 */
async function createMultipartUpload(key, contentType) {
    const command = new CreateMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType
    });

    const result = await getTebiClient().send(command);
    return {
        uploadId: result.UploadId,
        key: key
    };
}

/**
 * Get Presigned URL for a Multipart Part
 */
async function getMultipartPresignedUrl(key, uploadId, partNumber) {
    const command = new UploadPartCommand({
        Bucket: BUCKET,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber
    });

    const uploadUrl = await getSignedUrl(getTebiClient(), command, { expiresIn: 3600 });
    return { uploadUrl, partNumber };
}

/**
 * Complete Multipart Upload
 */
async function completeMultipartUpload(key, uploadId, parts) {
    // parts must be an array of { ETag, PartNumber }
    // Sort parts by PartNumber (required by S3)
    parts.sort((a, b) => a.PartNumber - b.PartNumber);

    const command = new CompleteMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts }
    });

    const result = await getTebiClient().send(command);
    return {
        success: true,
        location: getTebiPublicUrl(key),
        key: key
    };
}

/**
 * Abort Multipart Upload (Cleanup)
 */
async function abortMultipartUpload(key, uploadId) {
    const command = new AbortMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        UploadId: uploadId
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
    getPresignedUploadUrl,
    getPresignedDownloadUrl,
    createMultipartUpload,
    getMultipartPresignedUrl,
    completeMultipartUpload,
    abortMultipartUpload
};
