const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    unique: true
  },
  admissionType: {
    type: String,
    enum: ['inter_first_year', 'honours_first_year', 'degree_first_year'],
    required: true
  },
  
  // Personal Information
  studentNameBangla: {
    type: String,
    required: true
  },
  studentNameEnglish: {
    type: String,
    required: true
  },
  fatherNameBangla: {
    type: String,
    required: true
  },
  fatherNameEnglish: {
    type: String,
    required: true
  },
  motherNameBangla: {
    type: String,
    required: true
  },
  motherNameEnglish: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  religion: {
    type: String,
    enum: ['islam', 'hinduism', 'buddhism', 'christianity', 'other'],
    required: true
  },
  nationality: {
    type: String,
    default: 'Bangladeshi',
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  },
  nidNumber: String,
  birthCertificateNumber: {
    type: String,
    required: true
  },

  // Contact Information
  mobileNumber: {
    type: String,
    required: true
  },
  guardianMobileNumber: {
    type: String,
    required: true
  },
  email: String,

  // Address Information
  presentAddress: {
    village: {
      type: String,
      required: true
    },
    postOffice: {
      type: String,
      required: true
    },
    upazila: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    }
  },
  permanentAddress: {
    village: {
      type: String,
      required: true
    },
    postOffice: {
      type: String,
      required: true
    },
    upazila: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    }
  },

  // Educational Information (SSC/Equivalent)
  sscExamination: {
    type: String,
    enum: ['ssc', 'dakhil', 'equivalent'],
    required: true
  },
  sscBoard: {
    type: String,
    required: true
  },
  sscRoll: {
    type: String,
    required: true
  },
  sscRegistration: {
    type: String,
    required: true
  },
  sscPassingYear: {
    type: String,
    required: true
  },
  sscGPA: {
    type: Number,
    required: true
  },
  sscInstitution: {
    type: String,
    required: true
  },

  // For Honors/Degree - HSC Information
  hscExamination: {
    type: String,
    enum: ['hsc', 'alim', 'equivalent', 'none']
  },
  hscBoard: String,
  hscRoll: String,
  hscRegistration: String,
  hscPassingYear: String,
  hscGPA: Number,
  hscInstitution: String,
  hscGroup: {
    type: String,
    enum: ['science', 'humanities', 'business_studies', 'none']
  },

  // Admission Preferences (for Inter) - NOT REQUIRED, can be empty
  preferredGroup: {
    type: String,
    enum: ['science', 'humanities', 'business_studies', '']
  },
  
  // Admission Preferences (for Honours) - NOT REQUIRED, can be empty
  preferredSubject: {
    type: String,
    enum: ['bangla', 'english', 'history', 'political_science', 'economics', 'management', 'accounting', 'marketing', '']
  },

  // Guardian Information
  guardianName: {
    type: String,
    required: true
  },
  guardianRelation: {
    type: String,
    required: true
  },
  guardianOccupation: String,
  guardianIncome: String,

  // Documents (Cloudinary URLs)
  profilePicture: {
    url: String,
    publicId: String
  },
  sscCertificate: {
    url: String,
    publicId: String
  },
  hscCertificate: {
    url: String,
    publicId: String
  },
  testimonial: {
    url: String,
    publicId: String
  },
  nidCopy: {
    url: String,
    publicId: String
  },
  birthCertificate: {
    url: String,
    publicId: String
  },

  // Application Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-generate 6-digit registration number BEFORE save
admissionSchema.pre('save', async function() {
  if (this.isNew && !this.registrationNumber) {
    try {
      const count = await this.constructor.countDocuments();
      this.registrationNumber = String(count + 1).padStart(6, '0');
      console.log('✅ Generated registration number:', this.registrationNumber);
    } catch (error) {
      console.error('❌ Error generating registration number:', error);
      throw error;
    }
  }
});

// Auto-generate registration number BEFORE save
// admissionSchema.pre('save', async function() {
//   if (this.isNew && !this.registrationNumber) {
//     try {
//       const year = new Date().getFullYear().toString().substr(-2);
//       const count = await this.constructor.countDocuments();
//       this.registrationNumber = `ADM${year}${String(count + 1).padStart(5, '0')}`;
//       console.log('✅ Generated registration number:', this.registrationNumber);
//     } catch (error) {
//       console.error('❌ Error generating registration number:', error);
//       throw error; // Throw error instead of calling next(error)
//     }
//   }
// });

module.exports = mongoose.model('Admission', admissionSchema);

// const mongoose = require('mongoose');

// const admissionSchema = new mongoose.Schema({
//   registrationNumber: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   admissionType: {
//     type: String,
//     enum: ['inter_first_year', 'honours_first_year', 'degree_first_year'],
//     required: true
//   },
  
//   // Personal Information
//   studentNameBangla: {
//     type: String,
//     required: true
//   },
//   studentNameEnglish: {
//     type: String,
//     required: true
//   },
//   fatherNameBangla: {
//     type: String,
//     required: true
//   },
//   fatherNameEnglish: {
//     type: String,
//     required: true
//   },
//   motherNameBangla: {
//     type: String,
//     required: true
//   },
//   motherNameEnglish: {
//     type: String,
//     required: true
//   },
//   dateOfBirth: {
//     type: Date,
//     required: true
//   },
//   gender: {
//     type: String,
//     enum: ['male', 'female', 'other'],
//     required: true
//   },
//   religion: {
//     type: String,
//     enum: ['islam', 'hinduism', 'buddhism', 'christianity', 'other'],
//     required: true
//   },
//   nationality: {
//     type: String,
//     default: 'Bangladeshi',
//     required: true
//   },
//   bloodGroup: {
//     type: String,
//     enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
//   },
//   nidNumber: String,
//   birthCertificateNumber: {
//     type: String,
//     required: true
//   },

//   // Contact Information
//   mobileNumber: {
//     type: String,
//     required: true
//   },
//   guardianMobileNumber: {
//     type: String,
//     required: true
//   },
//   email: String,

//   // Address Information
//   presentAddress: {
//     village: String,
//     postOffice: String,
//     upazila: String,
//     district: String,
//     required: true
//   },
//   permanentAddress: {
//     village: String,
//     postOffice: String,
//     upazila: String,
//     district: String,
//     required: true
//   },

//   // Educational Information (SSC/Equivalent)
//   sscExamination: {
//     type: String,
//     enum: ['ssc', 'dakhil', 'equivalent'],
//     required: true
//   },
//   sscBoard: {
//     type: String,
//     required: true
//   },
//   sscRoll: {
//     type: String,
//     required: true
//   },
//   sscRegistration: {
//     type: String,
//     required: true
//   },
//   sscPassingYear: {
//     type: String,
//     required: true
//   },
//   sscGPA: {
//     type: Number,
//     required: true
//   },
//   sscInstitution: {
//     type: String,
//     required: true
//   },

//   // For Honors/Degree - HSC Information
//   hscExamination: {
//     type: String,
//     enum: ['hsc', 'alim', 'equivalent', 'none']
//   },
//   hscBoard: String,
//   hscRoll: String,
//   hscRegistration: String,
//   hscPassingYear: String,
//   hscGPA: Number,
//   hscInstitution: String,
//   hscGroup: {
//     type: String,
//     enum: ['science', 'humanities', 'business_studies', 'none']
//   },

//   // Admission Preferences (for Inter)
//   preferredGroup: {
//     type: String,
//     enum: ['science', 'humanities', 'business_studies']
//   },
  
//   // Admission Preferences (for Honours)
//   preferredSubject: {
//     type: String,
//     enum: ['bangla', 'english', 'history', 'political_science', 'economics', 'management', 'accounting', 'marketing']
//   },

//   // Guardian Information
//   guardianName: {
//     type: String,
//     required: true
//   },
//   guardianRelation: {
//     type: String,
//     required: true
//   },
//   guardianOccupation: String,
//   guardianIncome: String,

//   // Documents (Cloudinary URLs)
//   profilePicture: {
//     url: String,
//     publicId: String
//   },
//   sscCertificate: {
//     url: String,
//     publicId: String
//   },
//   hscCertificate: {
//     url: String,
//     publicId: String
//   },
//   testimonial: {
//     url: String,
//     publicId: String
//   },
//   nidCopy: {
//     url: String,
//     publicId: String
//   },
//   birthCertificate: {
//     url: String,
//     publicId: String
//   },

//   // Application Status
//   status: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected'],
//     default: 'pending'
//   },
  
//   submittedAt: {
//     type: Date,
//     default: Date.now
//   }
// }, {
//   timestamps: true
// });

// // Auto-generate registration number
// admissionSchema.pre('save', async function(next) {
//   if (this.isNew && !this.registrationNumber) {
//     const year = new Date().getFullYear().toString().substr(-2);
//     const count = await mongoose.model('Admission').countDocuments();
//     this.registrationNumber = `ADM${year}${String(count + 1).padStart(5, '0')}`;
//   }
//   next();
// });

// module.exports = mongoose.model('Admission', admissionSchema);
