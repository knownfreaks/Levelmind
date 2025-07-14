// config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define storage for profile images (existing)
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/profiles');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Define storage for certificates (existing)
const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/certificates');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// NEW: Define storage for resumes/documents (e.g., DOC, DOCX, PDF)
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/resumes');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});


// File filter for images (existing)
const imageFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed!'), false);
  }
  cb(null, true);
};

// File filter for certificates (existing)
const certificateFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(pdf|jpg|jpeg|png)$/i)) {
    return cb(new Error('Only PDF, JPG, JPEG, PNG files are allowed for certificates!'), false);
  }
  cb(null, true);
};

// NEW: File filter for resumes (PDF, DOC, DOCX)
const resumeFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(pdf|doc|docx)$/i)) {
    return cb(new Error('Only PDF, DOC, DOCX files are allowed for resumes!'), false);
  }
  cb(null, true);
};


// Multer instances for different upload types (existing)
const uploadProfileImage = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

const uploadCertificate = multer({
  storage: certificateStorage,
  fileFilter: certificateFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// NEW: Multer instance for resume upload
const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit for resumes
});

module.exports = {
  uploadProfileImage,
  uploadCertificate,
  uploadResume // Export new multer instance
};