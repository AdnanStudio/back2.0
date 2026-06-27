const mongoose = require('mongoose');

// One sub-menu link (dropdown item) under a top-level nav item
const navSubItemSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  dot: {
    type: String,
    default: '#2e7d32' // small color dot shown next to dropdown links
  },
  order: {
    type: Number,
    default: 0
  }
});

// One top-level nav item (pill in the header bar)
const navItemSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true
  },
  path: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#ffffff' // text color on the pill
  },
  bg: {
    type: String,
    default: '#2e7d32' // pill background color
  },
  order: {
    type: Number,
    default: 0
  },
  sub: [navSubItemSchema]
});

const navigationSchema = new mongoose.Schema({
  // Always a single document — like Settings
  items: [navItemSchema],

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Default nav — mirrors what was previously hardcoded in PublicHeader.js,
// used only the first time the app boots and no Navigation doc exists yet.
const DEFAULT_NAV_ITEMS = [
  { label: '🏠︎ হোম', path: '/', color: '#1b5e20', bg: '#e8f5e9', order: 0, sub: [] },
  {
    label: 'প্রতিষ্ঠান পরিচিতি', color: '#ffffff', bg: '#6a1b9a', order: 1,
    sub: [
      { label: 'কলেজের ইতিহাস', path: '/about/history', dot: '#9c27b0', order: 0 },
      { label: 'মিশন ও ভিশন', path: '/about/mission-vision', dot: '#8e24aa', order: 1 },
      { label: 'সুযোগ-সুবিধা', path: '/about/facilities', dot: '#ab47bc', order: 2 },
      { label: 'সাফল্যসমূহ', path: '/about/achievements', dot: '#7b1fa2', order: 3 },
      { label: 'শিক্ষক পরিষদ', path: '/about/faculty-council', dot: '#6a1b9a', order: 4 },
      { label: 'অর্গানোগ্রাম', path: '/about/organogram', dot: '#9c27b0', order: 5 },
      { label: 'স্টাফ ও কর্মচারী', path: '/about/staff', dot: '#8e24aa', order: 6 },
      { label: 'পরিচালনা পর্ষদ', path: '/administration/governing-body', dot: '#ab47bc', order: 7 },
      { label: 'অধ্যক্ষের বাণী', path: '/about/principal', dot: '#7b1fa2', order: 8 },
    ]
  },
  {
    label: 'একাডেমিক', color: '#ffffff', bg: '#1565c0', order: 2,
    sub: [
      { label: 'প্রোগ্রামসমূহ', path: '/academic/programs', dot: '#1565c0', order: 0 },
      { label: 'বিভাগসমূহ', path: '/academic/departments', dot: '#1976d2', order: 1 },
      { label: 'সিলেবাস', path: '/academic/syllabus', dot: '#1e88e5', order: 2 },
      { label: 'একাডেমিক ক্যালেন্ডার', path: '/academic/calendar', dot: '#0d47a1', order: 3 },
      { label: 'এইচএসসি রুটিন', path: '/academic/hsc-routine', dot: '#1565c0', order: 4 },
      { label: 'স্নাতক পাস কোর্স', path: '/academic/degree-pass', dot: '#1976d2', order: 5 },
      { label: 'স্নাতক সম্মান', path: '/academic/degree-honors', dot: '#1e88e5', order: 6 },
    ]
  },
  {
    label: 'প্রশাসন', color: '#ffffff', bg: '#b71c1c', order: 3,
    sub: [
      { label: 'শিক্ষকবৃন্দ', path: '/administration/teachers', dot: '#c62828', order: 0 },
      { label: 'পরিচালনা পর্ষদ', path: '/administration/governing-body', dot: '#d32f2f', order: 1 },
      { label: 'শিক্ষক প্রশিক্ষণ', path: '/administration/teacher-training', dot: '#e53935', order: 2 },
      { label: 'ক্লাব ব্যবস্থাপনা', path: '/administration/club-management', dot: '#ef5350', order: 3 },
    ]
  },
  {
    label: 'ভর্তি', color: '#ffffff', bg: '#e65100', order: 4,
    sub: [
      { label: 'অনলাইনে আবেদন', path: '/admission/apply', dot: '#e65100', order: 0 },
      { label: 'ভর্তির শর্তাবলী', path: '/admission/requirements', dot: '#ef6c00', order: 1 },
      { label: 'ভর্তির পদ্ধতি', path: '/admission/procedure', dot: '#f57c00', order: 2 },
      { label: 'এইচএসসি ভর্তি', path: '/admission/hsc', dot: '#fb8c00', order: 3 },
      { label: 'স্নাতক পাস', path: '/admission/degree-pass', dot: '#e65100', order: 4 },
      { label: 'স্নাতক সম্মান', path: '/admission/degree', dot: '#ef6c00', order: 5 },
    ]
  },
  {
    label: 'গ্যালারি', color: '#ffffff', bg: '#00695c', order: 5,
    sub: [
      { label: 'ফটো গ্যালারি', path: '/gallery/photos', dot: '#00695c', order: 0 },
      { label: 'ভিডিও গ্যালারি', path: '/gallery/videos', dot: '#00796b', order: 1 },
      { label: 'ইভেন্টসমূহ', path: '/gallery/events', dot: '#00897b', order: 2 },
    ]
  },
  { label: 'নোটিশ', path: '/notices', color: '#1a237e', bg: '#e8eaf6', order: 6, sub: [] },
  { label: 'যোগাযোগ', path: '/contact', color: '#ffffff', bg: '#8F6767', order: 7, sub: [] },
];

// Ensure only one Navigation document exists — same pattern as Settings.getSettings()
navigationSchema.statics.getNavigation = async function () {
  let nav = await this.findOne();
  if (!nav) {
    nav = await this.create({ items: DEFAULT_NAV_ITEMS });
  }
  return nav;
};

module.exports = mongoose.model('Navigation', navigationSchema);
