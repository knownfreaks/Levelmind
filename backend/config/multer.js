// backend/config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the main 'uploads' directory exists
const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdirSync(uploadsDir, { recursive: true }); // Ensure this top-level directory exists

// Define storage for different types of uploads
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadsDir, 'profiles'); // Use uploadsDir constant
    fs.mkdirSync(dir, { recursive: true }); // Ensure subdirectory exists
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // filename: profile-<timestamp>.<ext>
    cb(null, `profile-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadsDir, 'resumes'); // Use uploadsDir constant
    fs.mkdirSync(dir, { recursive: true }); // Ensure subdirectory exists
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // filename: resume-<timestamp>.<ext>
    cb(null, `resume-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadsDir, 'certificates'); // Use uploadsDir constant
    fs.mkdirSync(dir, { recursive: true }); // Ensure subdirectory exists
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // filename: certificate-<timestamp>.<ext>
    cb(null, `certificate-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Multer instances for specific upload types
const uploadProfileImage = multer({
  storage: profileStorage,
  fileFilter: (req, file, cb) => {
    // Use mimetype.startsWith for more robust image type checking
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, JPEG, PNG, GIF) are allowed for profile pictures!'), false);
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit (Common for profile images)
});

const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: (req, file, cb) => {
    // Check for common PDF, DOC, DOCX mimetypes
    if (file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' || // .doc
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, or DOCX files are allowed for resumes!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadCertificate = multer({
  storage: certificateStorage,
  fileFilter: (req, file, cb) => {
    // Allow images or PDF for certificates
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image (JPG, JPEG, PNG, GIF) or PDF files are allowed for certificates!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Export all configured multer instances
module.exports = {
  uploadProfileImage,
  uploadResume,
  uploadCertificate
};
