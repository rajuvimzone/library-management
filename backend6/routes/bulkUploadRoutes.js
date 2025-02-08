const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { uploadBooks } = require('../controllers/bulkUploadController');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        console.log('Upload directory:', uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const filename = 'books-' + Date.now() + path.extname(file.originalname);
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    console.log('Received file:', file.originalname, 'Type:', file.mimetype);
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/octet-stream') { // Some systems send CSV as octet-stream
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only CSV and Excel files are allowed.`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('file');

// Wrap multer upload in a promise
const handleUpload = (req, res) => {
    return new Promise((resolve, reject) => {
        upload(req, res, (err) => {
            if (err) {
                console.error('Multer error:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// Bulk upload route (admin only)
router.post('/books', authenticate, requireAdmin, async (req, res, next) => {
    try {
        console.log('Starting file upload process');
        await handleUpload(req, res);
        
        if (!req.file) {
            console.error('No file received');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('File uploaded successfully:', req.file);
        await uploadBooks(req, res);
    } catch (error) {
        console.error('Error in bulk upload route:', error);
        if (error instanceof multer.MulterError) {
            return res.status(400).json({
                message: 'File upload error',
                error: error.message
            });
        }
        next(error);
    }
});

module.exports = router;
