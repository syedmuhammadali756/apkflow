const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'apk-files';

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
}) : null;

/**
 * Upload file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} path - File path in bucket
 * @param {string} contentType - Mime type
 */
async function uploadToSupabase(fileBuffer, path, contentType) {
    if (!supabase) throw new Error('Supabase client not initialized. Check your environment variables.');

    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(path, fileBuffer, {
            contentType: contentType,
            upsert: true
        });

    if (error) {
        console.error('Supabase upload error:', error);
        throw error;
    }

    return {
        key: path,
        location: data.path
    };
}

/**
 * Get public URL for a file
 * @param {string} path - File path in bucket
 */
function getSupabasePublicUrl(path) {
    if (!supabase) return null;
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Delete file from Supabase Storage
 * @param {string} path - File path in bucket
 */
async function deleteFromSupabase(path) {
    if (!supabase) return;
    const { error } = await supabase.storage.from(bucketName).remove([path]);
    if (error) {
        console.error('Supabase delete error:', error);
        throw error;
    }
    return true;
}

module.exports = {
    uploadToSupabase,
    getSupabasePublicUrl,
    deleteFromSupabase
};
