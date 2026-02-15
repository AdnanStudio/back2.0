const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ===================== STORAGE CONFIGURATIONS =====================

// 1. Settings Storage (PDFs, images) - Higher limit for official documents
const settingsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let resourceType = 'image';
    let format = undefined;
    
    if (file.mimetype === 'application/pdf') {
      resourceType = 'raw';
      format = 'pdf';
    } else if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
      format = file.mimetype.split('/')[1];
    }

    return {
      folder: 'school-management/settings',
      resource_type: resourceType,
      format: format,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
      transformation: resourceType === 'image' ? [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto' }
      ] : undefined
    };
  }
});

// 2. User Profile Storage (Teachers, Staff, Admin) - Optimized for quality
const userProfileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'school-management/users',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 600, height: 600, crop: 'fill', gravity: 'face', quality: 'auto:good' }
    ]
  }
});

// 3. Student Profile Storage - OPTIMIZED FOR 10,000+ STUDENTS
const studentProfileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Dynamic folder structure for better organization
    // Example: students/2024/class-10/student-id
    const year = new Date().getFullYear();
    const studentClass = req.body.class || 'unassigned';
    const folderPath = `school-management/students/${year}/${studentClass}`;
    
    return {
      folder: folderPath,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        // Optimized for storage: smaller size, good quality
        { width: 500, height: 500, crop: 'fill', gravity: 'face', quality: 'auto:good', fetch_format: 'auto' }
      ]
    };
  }
});

// 4. Book Images Storage
const bookImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'school-management/books',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 600, height: 800, crop: 'limit', quality: 'auto:good' }
    ]
  }
});

// 5. Governing Body Members Storage
const governingBodyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'school-management/governing-body',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'fill', gravity: 'face', quality: 'auto:best' }
    ]
  }
});

// 6. Teacher Training Storage
const teacherTrainingStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'school-management/teacher-training',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 800, crop: 'fill', quality: 'auto:good' }
    ]
  }
});

// 7. Club Management Storage
const clubMemberStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'school-management/clubs',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 800, crop: 'fill', quality: 'auto:good' }
    ]
  }
});

// 8. Teacher List Storage
const teacherListStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'school-management/teachers',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 600, height: 600, crop: 'fill', gravity: 'face', quality: 'auto:best' }
    ]
  }
});

// ===================== MULTER UPLOADS WITH OPTIMIZED LIMITS =====================

// Settings Upload - 20MB (for official PDFs and high-res documents)
const uploadSettings = multer({ 
  storage: settingsStorage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed!'), false);
    }
  }
});

// User Profile Upload - 10MB (Teachers, Staff, Admin)
const uploadUserProfile = multer({
  storage: userProfileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Student Profile Upload - 10MB (Optimized for 10,000+ students)
const uploadStudentProfile = multer({
  storage: studentProfileStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB - Higher limit for quality
    files: 1 // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP image files are allowed!'), false);
    }
  }
});

// Book Image Upload - 10MB
const uploadBookImage = multer({
  storage: bookImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Governing Body Upload - 10MB
const uploadGoverningBody = multer({
  storage: governingBodyStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Teacher Training Upload - 15MB (for event photos)
const uploadTeacherTraining = multer({
  storage: teacherTrainingStorage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Club Member Upload - 10MB
const uploadClubMember = multer({
  storage: clubMemberStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Teacher List Upload - 10MB
const uploadTeacherList = multer({
  storage: teacherListStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log('✅ Image deleted from Cloudinary:', publicId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting image from Cloudinary:', error);
    return false;
  }
};

// Helper function to delete multiple images (for bulk operations)
const deleteMultipleImages = async (publicIds) => {
  try {
    await cloudinary.api.delete_resources(publicIds);
    console.log(`✅ ${publicIds.length} images deleted from Cloudinary`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting multiple images:', error);
    return false;
  }
};

// Helper function to get storage info
const getStorageInfo = async () => {
  try {
    const usage = await cloudinary.api.usage();
    return {
      credits: usage.credits,
      used_percent: usage.used_percent,
      limit: usage.limit,
      plan: usage.plan
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return null;
  }
};

// LEGACY SUPPORT: Keep 'upload' for backward compatibility
const upload = uploadUserProfile;

module.exports = { 
  cloudinary,
  uploadSettings,
  uploadUserProfile,
  uploadStudentProfile,  // ✅ OPTIMIZED for 10,000+ students
  uploadBookImage,
  uploadGoverningBody,
  uploadTeacherTraining,
  uploadClubMember,
  uploadTeacherList,
  deleteImage,
  deleteMultipleImages,  // ✅ NEW - Bulk delete
  getStorageInfo,        // ✅ NEW - Monitor usage
  upload                 // For backward compatibility
};




// ========past code 6 Jan 2026===========
// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const multer = require('multer');

// // Cloudinary Configuration
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // Storage for settings files (PDFs, images)
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: async (req, file) => {
//     let resourceType = 'image';
//     let format = undefined;
    
//     if (file.mimetype === 'application/pdf') {
//       resourceType = 'raw';
//       format = 'pdf';
//     } else if (file.mimetype.startsWith('image/')) {
//       resourceType = 'image';
//       format = file.mimetype.split('/')[1];
//     }

//     return {
//       folder: 'school-management/settings',
//       resource_type: resourceType,
//       format: format,
//       allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
//       transformation: resourceType === 'image' ? [
//         { width: 1920, height: 1080, crop: 'limit' }
//       ] : undefined
//     };
//   }
// });

// // ✅ Storage for user profile pictures
// const userProfileStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'school-management/users',
//     resource_type: 'image',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
//     transformation: [
//       { width: 500, height: 500, crop: 'fill', gravity: 'face' }
//     ]
//   }
// });

// // ✅ NEW: Storage for book images
// const bookImageStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'school-management/books',
//     resource_type: 'image',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
//     transformation: [
//       { width: 600, height: 800, crop: 'limit' }
//     ]
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files and PDFs are allowed!'), false);
//     }
//   }
// });

// // ✅ Upload for user profile pictures
// const uploadUserProfile = multer({
//   storage: userProfileStorage,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   }
// });

// // ✅ NEW: Upload for book images
// const uploadBookImage = multer({
//   storage: bookImageStorage,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   }
// });

// module.exports = { 
//   cloudinary, 
//   upload, 
//   uploadUserProfile,
//   uploadBookImage // ✅ NEW
// };
// ===============





// const cloudinary = require('cloudinary').v2;
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const multer = require('multer');

// // Cloudinary Configuration
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// // Storage for settings files (PDFs, images)
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: async (req, file) => {
//     let resourceType = 'image';
//     let format = undefined;
    
//     if (file.mimetype === 'application/pdf') {
//       resourceType = 'raw';
//       format = 'pdf';
//     } else if (file.mimetype.startsWith('image/')) {
//       resourceType = 'image';
//       format = file.mimetype.split('/')[1];
//     }

//     return {
//       folder: 'school-management/settings',
//       resource_type: resourceType,
//       format: format,
//       allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
//       transformation: resourceType === 'image' ? [
//         { width: 1920, height: 1080, crop: 'limit' }
//       ] : undefined
//     };
//   }
// });

// // ✅ Storage for user profile pictures
// const userProfileStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'school-management/users',
//     resource_type: 'image',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
//     transformation: [
//       { width: 500, height: 500, crop: 'fill', gravity: 'face' }
//     ]
//   }
// });

// // ✅ NEW: Storage for book images
// const bookImageStorage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'school-management/books',
//     resource_type: 'image',
//     allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
//     transformation: [
//       { width: 600, height: 800, crop: 'limit' }
//     ]
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files and PDFs are allowed!'), false);
//     }
//   }
// });

// // ✅ Upload for user profile pictures
// const uploadUserProfile = multer({
//   storage: userProfileStorage,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   }
// });

// // ✅ NEW: Upload for book images
// const uploadBookImage = multer({
//   storage: bookImageStorage,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   }
// });

// module.exports = { 
//   cloudinary, 
//   upload, 
//   uploadUserProfile,
//   uploadBookImage // ✅ NEW
// };