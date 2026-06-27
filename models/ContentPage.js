const mongoose = require('mongoose');

// A single content "block". Only the fields relevant to `type` are used by the
// frontend renderer, but we keep one flexible schema so admins can mix and
// match block types freely per page (paragraph, cards, stats, timeline,
// numbered steps, infobox, alert, table, list, calendar, faq, orgchart).
const blockSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'paragraph', 'cards', 'stats', 'timeline', 'numbered',
      'infobox', 'alert', 'table', 'list', 'calendar', 'faq', 'orgchart'
    ]
  },
  heading: String,        // optional heading shown above the block
  intro: String,          // optional short paragraph shown under the heading
  color: String,          // accent color (infobox border, etc.)
  alertType: {            // used only when type === 'alert'
    type: String,
    enum: ['info', 'success', 'warning', 'danger'],
    default: 'info'
  },
  text: String,           // used by 'alert' (the message) and simple one-liners
  body: [String],         // used by 'paragraph' (one entry per paragraph)
  headers: [String],      // used by 'table'
  rows: [[String]],       // used by 'table'
  departments: [String],  // used by 'orgchart'

  // Generic repeating items — shape depends on block type:
  //   cards:    { icon, title, text, meta: [String], lists: [{ heading, items:[String] }] }
  //   stats:    { icon, value, label }
  //   timeline: { year, title, text }
  //   numbered: { title, date, text, note, meta:[String] }
  //   list:     plain strings (use `items` as string array instead)
  //   calendar: { month, day, title, text, eventType }
  //   faq:      { question, answer }
  items: [mongoose.Schema.Types.Mixed],

  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

const breadcrumbItemSchema = new mongoose.Schema({
  label: String,
  path: String
}, { _id: false });

const contentPageSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  title: {
    type: String,
    required: true
  },
  banglaTitle: String,
  icon: {
    type: String,
    default: '📄'
  },
  breadcrumb: [breadcrumbItemSchema],
  blocks: [blockSchema],

  isPublished: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ContentPage', contentPageSchema);
