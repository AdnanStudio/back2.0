const Notice = require('../models/Notice');
const { cloudinary } = require('../config/cloudinary');

// @desc    Create notice with file attachments
// @route   POST /api/notices
// @access  Private (Admin/Teacher)
exports.createNotice = async (req, res) => {
  try {
    const { title, description, type, publishDate, expiryDate } = req.body;

    console.log('📝 Creating notice...');
    console.log('Files received:', req.files);

    const attachments = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        console.log('Processing file:', file.originalname);
        
        let fileType = 'image';
        if (file.mimetype === 'application/pdf') {
          fileType = 'pdf';
        }

        const urlParts = file.path.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExt.split('.')[0];

        attachments.push({
          fileUrl: file.path,
          fileType: fileType,
          fileName: file.originalname,
          publicId: `school-management/${publicId}`
        });

        console.log('✅ File uploaded:', file.path);
      }
    }

    const notice = await Notice.create({
      title,
      description,
      type,
      publishDate: publishDate || Date.now(),
      expiryDate,
      attachments,
      createdBy: req.user._id
    });

    const populatedNotice = await Notice.findById(notice._id)
      .populate('createdBy', 'name email');

    console.log('✅ Notice created successfully');

    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: populatedNotice
    });
  } catch (error) {
    console.error('❌ Create Notice Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get all notices (Admin/Teacher)
// @route   GET /api/notices
// @access  Private
exports.getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find()
      .sort({ publishDate: -1 })
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    console.error('Get Notices Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get public notices with pagination - SOB NOTICES (Description ছাড়া)
// @route   GET /api/notices/public?page=1&limit=8
// @access  Public
exports.getPublicNotices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    const currentDate = new Date();
    
    // Query - শুধু active এবং expired না এমন notices
    const query = {
      isActive: true,
      publishDate: { $lte: currentDate },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: currentDate } }
      ]
    };

    console.log('📋 Fetching public notices...');
    console.log('Current Date:', currentDate);
    console.log('Page:', page, 'Limit:', limit, 'Skip:', skip);

    // Total count
    const totalNotices = await Notice.countDocuments(query);
    console.log('✅ Total active notices:', totalNotices);
    
    // Fetch notices - DESCRIPTION বাদ, latest first
    const notices = await Notice.find(query)
      .sort({ publishDate: -1, createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(limit)
      .select('title type publishDate attachments createdAt')
      .lean();

    console.log('✅ Notices returned for page', page, ':', notices.length);

    const totalPages = Math.ceil(totalNotices / limit);

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalNotices: totalNotices,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Get Public Notices Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single notice (Full details with description)
// @route   GET /api/notices/:id
// @access  Public
exports.getNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update notice
// @route   PUT /api/notices/:id
// @access  Private (Admin/Teacher)
exports.updateNotice = async (req, res) => {
  try {
    const { title, description, type, isActive, publishDate, expiryDate } = req.body;

    let notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    if (title) notice.title = title;
    if (description) notice.description = description;
    if (type) notice.type = type;
    if (isActive !== undefined) notice.isActive = isActive;
    if (publishDate) notice.publishDate = publishDate;
    if (expiryDate) notice.expiryDate = expiryDate;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let fileType = 'image';
        if (file.mimetype === 'application/pdf') {
          fileType = 'pdf';
        }

        const urlParts = file.path.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExt.split('.')[0];

        notice.attachments.push({
          fileUrl: file.path,
          fileType: fileType,
          fileName: file.originalname,
          publicId: `school-management/${publicId}`
        });
      }
    }

    await notice.save();

    const updatedNotice = await Notice.findById(notice._id)
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Notice updated successfully',
      data: updatedNotice
    });
  } catch (error) {
    console.error('Update Notice Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin/Teacher)
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    if (notice.attachments && notice.attachments.length > 0) {
      for (const attachment of notice.attachments) {
        try {
          if (attachment.publicId) {
            await cloudinary.uploader.destroy(attachment.publicId);
            console.log('✅ Deleted from Cloudinary:', attachment.publicId);
          }
        } catch (error) {
          console.log('⚠️ Error deleting file from Cloudinary:', error.message);
        }
      }
    }

    await Notice.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Delete Notice Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete single attachment from notice
// @route   DELETE /api/notices/:id/attachments/:attachmentId
// @access  Private (Admin/Teacher)
exports.deleteAttachment = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    const attachment = notice.attachments.id(req.params.attachmentId);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    try {
      if (attachment.publicId) {
        await cloudinary.uploader.destroy(attachment.publicId);
        console.log('✅ Attachment deleted from Cloudinary');
      }
    } catch (error) {
      console.log('⚠️ Error deleting file from Cloudinary:', error.message);
    }

    notice.attachments.pull(req.params.attachmentId);
    await notice.save();

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
      data: notice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};


// const Notice = require('../models/Notice');
// const { cloudinary } = require('../config/cloudinary');

// // @desc    Create notice with file attachments
// // @route   POST /api/notices
// // @access  Private (Admin/Teacher)
// exports.createNotice = async (req, res) => {
//   try {
//     const { title, description, type, publishDate, expiryDate } = req.body;

//     console.log('📝 Creating notice...');
//     console.log('Files received:', req.files);

//     // Prepare attachments array
//     const attachments = [];

//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         console.log('Processing file:', file.originalname);
        
//         // Determine file type
//         let fileType = 'image';
//         if (file.mimetype === 'application/pdf') {
//           fileType = 'pdf';
//         }

//         // Extract Cloudinary public ID
//         const urlParts = file.path.split('/');
//         const publicIdWithExt = urlParts[urlParts.length - 1];
//         const publicId = publicIdWithExt.split('.')[0];

//         attachments.push({
//           fileUrl: file.path, // Cloudinary URL
//           fileType: fileType,
//           fileName: file.originalname,
//           publicId: `school-management/${publicId}`
//         });

//         console.log('✅ File uploaded:', file.path);
//       }
//     }

//     const notice = await Notice.create({
//       title,
//       description,
//       type,
//       publishDate: publishDate || Date.now(),
//       expiryDate,
//       attachments,
//       createdBy: req.user._id
//     });

//     const populatedNotice = await Notice.findById(notice._id)
//       .populate('createdBy', 'name email');

//     console.log('✅ Notice created successfully');

//     res.status(201).json({
//       success: true,
//       message: 'Notice created successfully',
//       data: populatedNotice
//     });
//   } catch (error) {
//     console.error('❌ Create Notice Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get all notices (Admin/Teacher)
// // @route   GET /api/notices
// // @access  Private
// exports.getAllNotices = async (req, res) => {
//   try {
//     const notices = await Notice.find()
//       .sort({ publishDate: -1 })
//       .populate('createdBy', 'name email');

//     res.status(200).json({
//       success: true,
//       count: notices.length,
//       data: notices
//     });
//   } catch (error) {
//     console.error('Get Notices Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get public notices (for PublicHome.js - latest 10 active notices)
// // @route   GET /api/notices/public
// // @access  Public
// exports.getPublicNotices = async (req, res) => {
//   try {
//     const currentDate = new Date();
    
//     const notices = await Notice.find({
//       isActive: true,
//       publishDate: { $lte: currentDate },
//       $or: [
//         { expiryDate: { $exists: false } },
//         { expiryDate: null },
//         { expiryDate: { $gte: currentDate } }
//       ]
//     })
//       .sort({ publishDate: -1 })
//       .limit(10)
//       .select('title description type publishDate attachments')
//       .lean();

//     res.status(200).json({
//       success: true,
//       count: notices.length,
//       data: notices
//     });
//   } catch (error) {
//     console.error('Get Public Notices Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: error.message
//     });
//   }
// };

// // @desc    Get single notice
// // @route   GET /api/notices/:id
// // @access  Public
// exports.getNotice = async (req, res) => {
//   try {
//     const notice = await Notice.findById(req.params.id)
//       .populate('createdBy', 'name email');

//     if (!notice) {
//       return res.status(404).json({
//         success: false,
//         message: 'Notice not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: notice
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: error.message
//     });
//   }
// };

// // @desc    Update notice
// // @route   PUT /api/notices/:id
// // @access  Private (Admin/Teacher)
// exports.updateNotice = async (req, res) => {
//   try {
//     const { title, description, type, isActive, publishDate, expiryDate } = req.body;

//     let notice = await Notice.findById(req.params.id);

//     if (!notice) {
//       return res.status(404).json({
//         success: false,
//         message: 'Notice not found'
//       });
//     }

//     // Update basic fields
//     if (title) notice.title = title;
//     if (description) notice.description = description;
//     if (type) notice.type = type;
//     if (isActive !== undefined) notice.isActive = isActive;
//     if (publishDate) notice.publishDate = publishDate;
//     if (expiryDate) notice.expiryDate = expiryDate;

//     // Add new attachments if provided
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         let fileType = 'image';
//         if (file.mimetype === 'application/pdf') {
//           fileType = 'pdf';
//         }

//         const urlParts = file.path.split('/');
//         const publicIdWithExt = urlParts[urlParts.length - 1];
//         const publicId = publicIdWithExt.split('.')[0];

//         notice.attachments.push({
//           fileUrl: file.path,
//           fileType: fileType,
//           fileName: file.originalname,
//           publicId: `school-management/${publicId}`
//         });
//       }
//     }

//     await notice.save();

//     const updatedNotice = await Notice.findById(notice._id)
//       .populate('createdBy', 'name email');

//     res.status(200).json({
//       success: true,
//       message: 'Notice updated successfully',
//       data: updatedNotice
//     });
//   } catch (error) {
//     console.error('Update Notice Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: error.message
//     });
//   }
// };

// // @desc    Delete notice
// // @route   DELETE /api/notices/:id
// // @access  Private (Admin/Teacher)
// exports.deleteNotice = async (req, res) => {
//   try {
//     const notice = await Notice.findById(req.params.id);

//     if (!notice) {
//       return res.status(404).json({
//         success: false,
//         message: 'Notice not found'
//       });
//     }

//     // Delete attachments from Cloudinary
//     if (notice.attachments && notice.attachments.length > 0) {
//       for (const attachment of notice.attachments) {
//         try {
//           if (attachment.publicId) {
//             await cloudinary.uploader.destroy(attachment.publicId);
//             console.log('✅ Deleted from Cloudinary:', attachment.publicId);
//           }
//         } catch (error) {
//           console.log('⚠️ Error deleting file from Cloudinary:', error.message);
//         }
//       }
//     }

//     await Notice.findByIdAndDelete(req.params.id);

//     res.status(200).json({
//       success: true,
//       message: 'Notice deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete Notice Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: error.message
//     });
//   }
// };

// // @desc    Delete single attachment from notice
// // @route   DELETE /api/notices/:id/attachments/:attachmentId
// // @access  Private (Admin/Teacher)
// exports.deleteAttachment = async (req, res) => {
//   try {
//     const notice = await Notice.findById(req.params.id);

//     if (!notice) {
//       return res.status(404).json({
//         success: false,
//         message: 'Notice not found'
//       });
//     }

//     const attachment = notice.attachments.id(req.params.attachmentId);

//     if (!attachment) {
//       return res.status(404).json({
//         success: false,
//         message: 'Attachment not found'
//       });
//     }

//     // Delete from Cloudinary
//     try {
//       if (attachment.publicId) {
//         await cloudinary.uploader.destroy(attachment.publicId);
//         console.log('✅ Attachment deleted from Cloudinary');
//       }
//     } catch (error) {
//       console.log('⚠️ Error deleting file from Cloudinary:', error.message);
//     }

//     // Remove from array
//     notice.attachments.pull(req.params.attachmentId);
//     await notice.save();

//     res.status(200).json({
//       success: true,
//       message: 'Attachment deleted successfully',
//       data: notice
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: error.message
//     });
//   }
// };