const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Scrolling Text
  scrollingTexts: [{
    text: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  }],

  // Hero Images (Maximum 10)
  heroImages: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      default: 0
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // About Section Image
  aboutImage: {
    url: String,
    publicId: String
  },

  // Chairman/Principal Image
  chairmanImage: {
    url: String,
    publicId: String
  },

  // Notice Side Image
  noticeImage: {
    url: String,
    publicId: String
  },

  // Important Links — shown on the public home page, admin editable
  importantLinks: [{
    label: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      default: 0
    }
  }],

  // Other Settings (existing)
  schoolName: String,
  schoolAddress: String,
  schoolPhone: String,
  schoolEmail: String,
  logo: {
    url: String,
    publicId: String
  },
  aboutText: String,
  visionMission: String,
  totalStudents: Number,
  totalTeachers: Number,
  totalStaff: Number,
  facebookLink: String,
  youtubeLink: String,
  playStoreLink: String,
  appStoreLink: String,

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      scrollingTexts: [
        { text: 'Welcome to our school website', order: 1 }
      ],
      heroImages: [],
      schoolName: 'MALKHANAGAR COLLEGE',
      schoolAddress: 'Malkhanagar, Sirajdikhan, Dhaka',
      importantLinks: [
        { label: 'শিক্ষা মন্ত্রণালয়', url: 'https://moedu.gov.bd', order: 0 },
        { label: 'মাধ্যমিক ও উচ্চশিক্ষা বোর্ড', url: 'https://dhakaeducationboard.gov.bd', order: 1 },
        { label: 'জাতীয় বিশ্ববিদ্যালয়', url: 'https://nu.ac.bd', order: 2 },
        { label: 'শিক্ষা বোর্ড রেজাল্ট', url: 'http://www.educationboardresults.gov.bd', order: 3 },
      ]
    });
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
