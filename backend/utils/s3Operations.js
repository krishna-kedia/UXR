const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('./s3Config');

const generateS3Key = (userId, projectId, file) => {
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/\s+/g, '-');
    return `upload-data/users/${userId}/${projectId}/transcripts/${timestamp}-${sanitizedFileName}`;
};

const response = async (userId, projectId, file) => {
    try {
        const s3Key = generateS3Key(userId, projectId, file);
        
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: file.buffer,
            ContentType: file.mimetype,
            Metadata: {
                uploadedAt: new Date().toISOString(),
                originalName: file.originalname,
                fileSize: file.size.toString()
            }
        };

        const response = await s3Client.send(new PutObjectCommand(params));
        console.log(response)
        
        return {
            s3Key,
            s3Url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`
        };
    } catch (error) {
        console.error('S3 upload error:', error);
        throw new Error('Failed to upload file to S3');
    }
};

const getSignedDownloadUrl = async (s3Key) => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key
    });

    try {
        // URL expires in 1 hour
        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw new Error('Failed to generate download URL');
    }
};

const deleteFromS3 = async (s3Key) => {
    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key
        };

        await s3Client.send(new DeleteObjectCommand(params));
    } catch (error) {
        console.error('S3 delete error:', error);
        throw new Error('Failed to delete file from S3');
    }
};

const configureBucketCors = async () => {
    try {
        const corsConfig = {
            Bucket: process.env.AWS_BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: [
                            'content-type',
                            'content-length',
                            'content-disposition'
                        ],
                        AllowedMethods: ['PUT', 'POST', 'GET'],
                        AllowedOrigins: [
                            process.env.FRONTEND_URL || 'http://localhost:3000',
                            // Add additional origins as needed
                        ],
                        ExposeHeaders: ['ETag'],
                        MaxAgeSeconds: 3600
                    }
                ]
            }
        };

        const command = new PutBucketCorsCommand(corsConfig);
        await s3Client.send(command);
        console.log('S3 bucket CORS configuration updated successfully');
    } catch (error) {
        console.error('Error configuring S3 bucket CORS:', error);
        throw error;
    }
};

// Call this when your server starts
const initializeS3 = async () => {
    try {
        await configureBucketCors();
    } catch (error) {
        console.error('Failed to initialize S3:', error);
        // You might want to handle this error based on your needs
    }
};

module.exports = {
    response,
    getSignedDownloadUrl,
    deleteFromS3,
    initializeS3
};