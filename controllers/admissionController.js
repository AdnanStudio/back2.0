const Admission = require('../models/Admission');
const { cloudinary } = require('../config/cloudinary');
const XLSX = require('xlsx');
const fs = require('fs');

// Create new admission
exports.createAdmission = async (req, res) => {
  try {
    const admissionData = JSON.parse(req.body.data);

    // Handle file uploads
    const fileUploads = {};
    const uploadedFiles = []; // Track uploaded files for cleanup
    
    if (req.files) {
      for (const [fieldName, fileArray] of Object.entries(req.files)) {
        if (fileArray && fileArray[0]) {
          try {
            console.log(`Uploading ${fieldName}:`, fileArray[0].path);
            
            // Upload to cloudinary
            const result = await cloudinary.uploader.upload(fileArray[0].path, {
              folder: 'school-management/admissions',
              resource_type: 'auto'
            });
            
            console.log(`✅ ${fieldName} uploaded:`, result.secure_url);
            
            fileUploads[fieldName] = {
              url: result.secure_url,
              publicId: result.public_id
            };

            // Track uploaded file path for cleanup
            uploadedFiles.push(fileArray[0].path);
          } catch (uploadError) {
            console.error(`❌ Upload error for ${fieldName}:`, uploadError);
          }
        }
      }
    }

    // Create admission
    const admission = await Admission.create({
      ...admissionData,
      ...fileUploads
    });

    // Cleanup: Delete all local files after successful database save
    uploadedFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted local file: ${filePath}`);
        }
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Admission application submitted successfully',
      data: admission
    });
  } catch (error) {
    console.error('Create Admission Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit admission'
    });
  }
};

// Get all admissions with pagination
exports.getAllAdmissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const admissions = await Admission.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Admission.countDocuments();

    res.json({
      success: true,
      data: admissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete single admission
exports.deleteAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);
    
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found'
      });
    }

    // Delete files from cloudinary
    const fieldsToDelete = ['profilePicture', 'sscCertificate', 'hscCertificate', 
                            'testimonial', 'nidCopy', 'birthCertificate'];
    
    for (const field of fieldsToDelete) {
      if (admission[field]?.publicId) {
        try {
          await cloudinary.uploader.destroy(admission[field].publicId);
        } catch (deleteError) {
          console.error(`Failed to delete ${field}:`, deleteError);
        }
      }
    }

    await Admission.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Admission deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete all admissions
exports.deleteAllAdmissions = async (req, res) => {
  try {
    const admissions = await Admission.find();

    // Delete all files from cloudinary
    for (const admission of admissions) {
      const fieldsToDelete = ['profilePicture', 'sscCertificate', 'hscCertificate', 
                              'testimonial', 'nidCopy', 'birthCertificate'];
      
      for (const field of fieldsToDelete) {
        if (admission[field]?.publicId) {
          try {
            await cloudinary.uploader.destroy(admission[field].publicId);
          } catch (deleteError) {
            console.error(`Failed to delete ${field}:`, deleteError);
          }
        }
      }
    }

    await Admission.deleteMany({});

    res.json({
      success: true,
      message: 'All admissions deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Export to Excel
exports.exportAdmissions = async (req, res) => {
  try {
    const admissions = await Admission.find().select('-__v').lean();

    const data = admissions.map(adm => ({
      'Registration No': adm.registrationNumber,
      'Admission Type': adm.admissionType,
      'Name (Bangla)': adm.studentNameBangla,
      'Name (English)': adm.studentNameEnglish,
      'Father Name': adm.fatherNameEnglish,
      'Mother Name': adm.motherNameEnglish,
      'Date of Birth': new Date(adm.dateOfBirth).toLocaleDateString(),
      'Gender': adm.gender,
      'Religion': adm.religion,
      'Mobile': adm.mobileNumber,
      'Email': adm.email || 'N/A',
      'SSC Board': adm.sscBoard,
      'SSC Roll': adm.sscRoll,
      'SSC GPA': adm.sscGPA,
      'SSC Year': adm.sscPassingYear,
      'Status': adm.status,
      'Submitted Date': new Date(adm.submittedAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Admissions');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=admissions.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// const Admission = require('../models/Admission');
// const cloudinary = require('../config/cloudinary');
// const XLSX = require('xlsx');

// // Create new admission
// exports.createAdmission = async (req, res) => {
//   try {
//     const admissionData = JSON.parse(req.body.data);

//     // Handle file uploads
//     const fileUploads = {};
    
//     if (req.files) {
//       for (const [fieldName, fileArray] of Object.entries(req.files)) {
//         if (fileArray && fileArray[0]) {
//           const result = await cloudinary.uploader.upload(fileArray[0].path, {
//             folder: 'admissions',
//             resource_type: 'auto'
//           });
          
//           fileUploads[fieldName] = {
//             url: result.secure_url,
//             publicId: result.public_id
//           };
//         }
//       }
//     }

//     const admission = await Admission.create({
//       ...admissionData,
//       ...fileUploads
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Admission application submitted successfully',
//       data: admission
//     });
//   } catch (error) {
//     console.error('Create Admission Error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to submit admission'
//     });
//   }
// };

// // Get all admissions with pagination
// exports.getAllAdmissions = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = 20;
//     const skip = (page - 1) * limit;

//     const admissions = await Admission.find()
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const total = await Admission.countDocuments();

//     res.json({
//       success: true,
//       data: admissions,
//       pagination: {
//         page,
//         limit,
//         total,
//         pages: Math.ceil(total / limit)
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // Delete single admission
// exports.deleteAdmission = async (req, res) => {
//   try {
//     const admission = await Admission.findById(req.params.id);
    
//     if (!admission) {
//       return res.status(404).json({
//         success: false,
//         message: 'Admission not found'
//       });
//     }

//     // Delete files from cloudinary
//     const fieldsToDelete = ['profilePicture', 'sscCertificate', 'hscCertificate', 
//                             'testimonial', 'nidCopy', 'birthCertificate'];
    
//     for (const field of fieldsToDelete) {
//       if (admission[field]?.publicId) {
//         await cloudinary.uploader.destroy(admission[field].publicId);
//       }
//     }

//     await Admission.findByIdAndDelete(req.params.id);

//     res.json({
//       success: true,
//       message: 'Admission deleted successfully'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // Delete all admissions
// exports.deleteAllAdmissions = async (req, res) => {
//   try {
//     const admissions = await Admission.find();

//     // Delete all files from cloudinary
//     for (const admission of admissions) {
//       const fieldsToDelete = ['profilePicture', 'sscCertificate', 'hscCertificate', 
//                               'testimonial', 'nidCopy', 'birthCertificate'];
      
//       for (const field of fieldsToDelete) {
//         if (admission[field]?.publicId) {
//           await cloudinary.uploader.destroy(admission[field].publicId);
//         }
//       }
//     }

//     await Admission.deleteMany({});

//     res.json({
//       success: true,
//       message: 'All admissions deleted successfully'
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // Export to Excel
// exports.exportAdmissions = async (req, res) => {
//   try {
//     const admissions = await Admission.find().select('-__v').lean();

//     const data = admissions.map(adm => ({
//       'Registration No': adm.registrationNumber,
//       'Admission Type': adm.admissionType,
//       'Name (Bangla)': adm.studentNameBangla,
//       'Name (English)': adm.studentNameEnglish,
//       'Father Name': adm.fatherNameEnglish,
//       'Mother Name': adm.motherNameEnglish,
//       'Date of Birth': new Date(adm.dateOfBirth).toLocaleDateString(),
//       'Gender': adm.gender,
//       'Religion': adm.religion,
//       'Mobile': adm.mobileNumber,
//       'Email': adm.email || 'N/A',
//       'SSC Board': adm.sscBoard,
//       'SSC Roll': adm.sscRoll,
//       'SSC GPA': adm.sscGPA,
//       'SSC Year': adm.sscPassingYear,
//       'Status': adm.status,
//       'Submitted Date': new Date(adm.submittedAt).toLocaleDateString()
//     }));

//     const worksheet = XLSX.utils.json_to_sheet(data);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Admissions');

//     const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

//     res.setHeader('Content-Disposition', 'attachment; filename=admissions.xlsx');
//     res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     res.send(buffer);
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
