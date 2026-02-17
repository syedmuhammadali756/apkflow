require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

async function testTebiSpeed() {
    console.log('=== Tebi.io Upload Speed Test ===');
    console.log('Endpoint:', process.env.TEBI_ENDPOINT);
    console.log('Bucket:', process.env.TEBI_BUCKET);
    console.log('Key set:', !!process.env.TEBI_ACCESS_KEY);

    const client = new S3Client({
        region: 'global',
        endpoint: process.env.TEBI_ENDPOINT || 'https://s3.tebi.io',
        credentials: {
            accessKeyId: process.env.TEBI_ACCESS_KEY,
            secretAccessKey: process.env.TEBI_SECRET_KEY
        },
        forcePathStyle: true
    });

    // Create a 1MB test file
    const testData = crypto.randomBytes(1024 * 1024); // 1MB
    const key = `test/speed-test-${Date.now()}.bin`;

    console.log(`\nUploading 1MB test file to ${key}...`);
    const start = Date.now();

    try {
        await client.send(new PutObjectCommand({
            Bucket: process.env.TEBI_BUCKET || 'apk-files',
            Key: key,
            Body: testData,
            ContentType: 'application/octet-stream'
        }));

        const elapsed = (Date.now() - start) / 1000;
        const speedMBps = (1 / elapsed).toFixed(2);
        console.log(`✅ Upload completed in ${elapsed.toFixed(1)}s (${speedMBps} MB/s)`);

        if (elapsed > 30) {
            console.log('⚠️  VERY SLOW - Tebi servers are degraded. Consider switching provider.');
        } else if (elapsed > 10) {
            console.log('⚠️  Slow upload. Tebi may be throttling.');
        } else {
            console.log('✅ Speed is acceptable.');
        }
    } catch (err) {
        console.error('❌ Upload FAILED:', err.message);
        console.error('Full error:', err);
    }
}

testTebiSpeed();
