require('dotenv').config();
const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

async function setupCORS() {
    const endpoint = process.env.TEBI_ENDPOINT;
    const hostname = new URL(endpoint).hostname;
    const parts = hostname.split('.');
    const region = parts.length >= 3 && parts[0] === 's3' ? parts[1] : 'us-east-1';

    const client = new S3Client({
        region,
        endpoint,
        credentials: {
            accessKeyId: process.env.TEBI_ACCESS_KEY,
            secretAccessKey: process.env.TEBI_SECRET_KEY
        },
        forcePathStyle: true
    });

    const corsConfig = {
        CORSRules: [
            {
                AllowedOrigins: ['*'],
                AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                AllowedHeaders: ['*'],
                ExposeHeaders: ['ETag', 'x-amz-request-id'],
                MaxAgeSeconds: 3600
            }
        ]
    };

    try {
        await client.send(new PutBucketCorsCommand({
            Bucket: process.env.TEBI_BUCKET,
            CORSConfiguration: corsConfig
        }));
        console.log('✅ CORS configured successfully for bucket:', process.env.TEBI_BUCKET);
    } catch (err) {
        console.error('❌ CORS setup failed:', err.message);
        console.error('Full error:', err);
    }
}

setupCORS();
