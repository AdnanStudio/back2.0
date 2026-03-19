// // FILE PATH: controllers/noticeController.js  ← BACKEND
// const Notice = require('../models/Notice');
// const { cloudinary } = require('../config/cloudinary');

// // ── Helper: convert drive share link → embed URL ─────────
// const getDriveEmbedUrl = (url) => {
//   if (!url) return url;
//   const m = url.match(/\/d\/([^/]+)/);
//   if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
//   const m2 = url.match(/[?&]id=([^&]+)/);
//   if (m2) return `https://drive.google.com/file/d/${m2[1]}/preview`;
//   return url;
// };

// // @desc  Create notice   POST /api/notices   Private
// exports.createNotice = async (req, res) => {
//   try {
//     const { title, description, type, publishDate, expiryDate, driveLinks } = req.body;

//     const attachments = [];
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         let fileType = file.mimetype === 'application/pdf' ? 'pdf' : 'image';
//         const urlParts = file.path.split('/');
//         const publicId = urlParts[urlParts.length - 1].split('.')[0];
//         attachments.push({
//           fileUrl: file.path,
//           fileType,
//           fileName: file.originalname,
//           publicId: `school-management/${publicId}`
//         });
//       }
//     }

//     // Parse driveLinks from JSON string or array
//     let parsedDriveLinks = [];
//     if (driveLinks) {
//       try {
//         parsedDriveLinks = typeof driveLinks === 'string'
//           ? JSON.parse(driveLinks)
//           : driveLinks;
//       } catch { parsedDriveLinks = []; }
//     }

//     const notice = await Notice.create({
//       title, description, type,
//       publishDate: publishDate || Date.now(),
//       expiryDate,
//       attachments,
//       driveLinks: parsedDriveLinks,
//       createdBy: req.user._id
//     });

//     const populated = await Notice.findById(notice._id).populate('createdBy', 'name email');
//     res.status(201).json({ success: true, message: 'Notice created successfully', data: populated });
//   } catch (error) {
//     console.error('❌ Create Notice Error:', error);
//     res.status(500).json({ success: false, message: 'Server Error', error: error.message });
//   }
// };

// // @desc  Get all notices (Admin/Teacher)   GET /api/notices   Private
// exports.getAllNotices = async (req, res) => {
//   try {
//     const page  = parseInt(req.query.page)  || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip  = (page - 1) * limit;

//     const total   = await Notice.countDocuments();
//     const notices = await Notice.find()
//       .sort({ publishDate: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate('createdBy', 'name email');

//     res.status(200).json({
//       success: true,
//       count: notices.length,
//       data: notices,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(total / limit),
//         totalNotices: total,
//         hasNextPage: page < Math.ceil(total / limit),
//         hasPrevPage: page > 1
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server Error', error: error.message });
//   }
// };

// // @desc  Get public notices with pagination   GET /api/notices/public   Public
// exports.getPublicNotices = async (req, res) => {
//   try {
//     const page  = parseInt(req.query.page)  || 1;
//     const limit = parseInt(req.query.limit) || 8;
//     const skip  = (page - 1) * limit;

//     const currentDate = new Date();

//     const query = {
//       isActive: true,
//       publishDate: { $lte: currentDate },
//       $or: [
//         { expiryDate: { $exists: false } },
//         { expiryDate: null },
//         { expiryDate: { $gte: currentDate } },
//       ],
//     };

//     const totalNotices = await Notice.countDocuments(query);

//     // ✅ Include description and expiryDate
//     const notices = await Notice.find(query)
//       .sort({ publishDate: -1, createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .select('title description type publishDate expiryDate attachments createdAt')
//       .lean();

//     const totalPages = Math.ceil(totalNotices / limit);

//     res.status(200).json({
//       success: true,
//       count: notices.length,
//       data: notices,
//       pagination: {
//         currentPage:  page,
//         totalPages:   totalPages,
//         totalNotices: totalNotices,
//         hasNextPage:  page < totalPages,
//         hasPrevPage:  page > 1,
//       },
//     });
//   } catch (error) {
//     console.error('❌ Get Public Notices Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server Error',
//       error: error.message,
//     });
//   }
// };



// // @desc  Get single notice   GET /api/notices/:id   Public
// exports.getNotice = async (req, res) => {
//   try {
//     const notice = await Notice.findById(req.params.id).populate('createdBy', 'name email');
//     if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
//     res.status(200).json({ success: true, data: notice });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server Error', error: error.message });
//   }
// };

// // @desc  Update notice   PUT /api/notices/:id   Private
// exports.updateNotice = async (req, res) => {
//   try {
//     const { title, description, type, isActive, publishDate, expiryDate, driveLinks } = req.body;
//     let notice = await Notice.findById(req.params.id);
//     if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

//     if (title)       notice.title       = title;
//     if (description) notice.description = description;
//     if (type)        notice.type        = type;
//     if (isActive !== undefined) notice.isActive = isActive;
//     if (publishDate) notice.publishDate = publishDate;
//     if (expiryDate)  notice.expiryDate  = expiryDate;

//     // Update driveLinks
//     if (driveLinks !== undefined) {
//       try {
//         notice.driveLinks = typeof driveLinks === 'string'
//           ? JSON.parse(driveLinks)
//           : driveLinks;
//       } catch { notice.driveLinks = []; }
//     }

//     // New file uploads
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         let fileType = file.mimetype === 'application/pdf' ? 'pdf' : 'image';
//         const urlParts = file.path.split('/');
//         const publicId = urlParts[urlParts.length - 1].split('.')[0];
//         notice.attachments.push({
//           fileUrl: file.path, fileType,
//           fileName: file.originalname,
//           publicId: `school-management/${publicId}`
//         });
//       }
//     }

//     await notice.save();
//     const updated = await Notice.findById(notice._id).populate('createdBy', 'name email');
//     res.status(200).json({ success: true, message: 'Notice updated successfully', data: updated });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server Error', error: error.message });
//   }
// };

// // @desc  Delete notice   DELETE /api/notices/:id   Private
// exports.deleteNotice = async (req, res) => {
//   try {
//     const notice = await Notice.findById(req.params.id);
//     if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

//     for (const att of notice.attachments || []) {
//       try {
//         if (att.publicId) await cloudinary.uploader.destroy(att.publicId);
//       } catch (e) { console.log('⚠️ Cloudinary delete error:', e.message); }
//     }

//     await Notice.findByIdAndDelete(req.params.id);
//     res.status(200).json({ success: true, message: 'Notice deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server Error', error: error.message });
//   }
// };

// // @desc  Delete attachment   DELETE /api/notices/:id/attachments/:attachmentId   Private
// exports.deleteAttachment = async (req, res) => {
//   try {
//     const notice = await Notice.findById(req.params.id);
//     if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

//     const attachment = notice.attachments.id(req.params.attachmentId);
//     if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });

//     try {
//       if (attachment.publicId) await cloudinary.uploader.destroy(attachment.publicId);
//     } catch (e) { console.log('⚠️ Cloudinary error:', e.message); }

//     notice.attachments.pull(req.params.attachmentId);
//     await notice.save();
//     res.status(200).json({ success: true, message: 'Attachment deleted successfully', data: notice });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server Error', error: error.message });
//   }
// };

// // @desc  Delete drive link   DELETE /api/notices/:id/drivelinks/:linkId   Private
// exports.deleteDriveLink = async (req, res) => {
//   try {
//     const notice = await Notice.findById(req.params.id);
//     if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
//     notice.driveLinks.pull(req.params.linkId);
//     await notice.save();
//     res.status(200).json({ success: true, message: 'Drive link deleted', data: notice });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Server Error', error: error.message });
//   }
// };


// FILE PATH: controllers/noticeController.js  ← BACKEND
const Notice = require('../models/Notice');
const { cloudinary } = require('../config/cloudinary');

/* ─── Helpers ──────────────────────────────────────────────── */

/** Extract Google Drive file ID from any Drive URL */
function extractDriveId(url = '') {
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  const m3 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m3) return m3[1];
  return null;
}

/** Build a direct-download URL from any Drive share URL */
function buildDownloadUrl(url = '') {
  if (!url) return '';
  if (url.includes('export=download')) return url;          // already a download URL
  const id = extractDriveId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}

/** Normalise driveLinks array — filter blanks + auto-set downloadUrl */
function normaliseDriveLinks(raw = []) {
  return raw
    .filter(l => l.url && l.url.trim())
    .map(l => ({
      url:         l.url.trim(),
      downloadUrl: l.downloadUrl?.trim() || buildDownloadUrl(l.url.trim()),
      label:       l.label || 'PDF Document',
    }));
}

/** Add downloadUrl to every driveLink in a plain notice object (for old records) */
function enrichNotice(notice) {
  if (!notice) return notice;
  return {
    ...notice,
    driveLinks: (notice.driveLinks || []).map(lnk => ({
      ...lnk,
      downloadUrl: lnk.downloadUrl || buildDownloadUrl(lnk.url || ''),
    })),
  };
}

/* ─── CREATE   POST /api/notices ─────────────────────────────── */
exports.createNotice = async (req, res) => {
  try {
    const { title, description, type, publishDate, expiryDate, driveLinks } = req.body;

    const attachments = [];
    for (const file of req.files || []) {
      const fileType = file.mimetype === 'application/pdf' ? 'pdf' : 'image';
      const parts    = file.path.split('/');
      const pubId    = parts[parts.length - 1].split('.')[0];
      attachments.push({
        fileUrl:  file.path,
        fileType,
        fileName: file.originalname,
        publicId: `school-management/${pubId}`,
      });
    }

    let rawLinks = [];
    try { rawLinks = driveLinks ? (typeof driveLinks === 'string' ? JSON.parse(driveLinks) : driveLinks) : []; }
    catch { rawLinks = []; }

    const notice = await Notice.create({
      title, description, type,
      publishDate: publishDate || Date.now(),
      expiryDate,
      attachments,
      driveLinks: normaliseDriveLinks(rawLinks),
      createdBy: req.user._id,
    });

    const populated = await Notice.findById(notice._id).populate('createdBy', 'name email');
    res.status(201).json({ success: true, message: 'Notice created successfully', data: populated });
  } catch (error) {
    console.error('❌ Create Notice Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/* ─── GET ALL (dashboard)   GET /api/notices ─────────────────── */
exports.getAllNotices = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;
    const total = await Notice.countDocuments();
    const notices = await Notice.find()
      .sort({ publishDate: -1 })
      .skip(skip).limit(limit)
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true, count: notices.length, data: notices,
      pagination: {
        currentPage: page,
        totalPages:  Math.ceil(total / limit),
        totalNotices: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/* ─── GET PUBLIC   GET /api/notices/public ───────────────────────
   ✅ FIXED: driveLinks now included + downloadUrl auto-filled
──────────────────────────────────────────────────────────────── */
exports.getPublicNotices = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip  = (page - 1) * limit;
    const now   = new Date();

    const query = {
      isActive:    true,
      publishDate: { $lte: now },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: now } },
      ],
    };

    const total   = await Notice.countDocuments(query);

    // ✅ driveLinks included in select
    const notices = await Notice.find(query)
      .sort({ publishDate: -1, createdAt: -1 })
      .skip(skip).limit(limit)
      .select('title description type publishDate expiryDate attachments driveLinks createdAt')
      .lean();

    // ✅ Backfill downloadUrl for any old records missing it
    const data = notices.map(enrichNotice);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
      pagination: {
        currentPage: page,
        totalPages:  Math.ceil(total / limit),
        totalNotices: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('❌ getPublicNotices Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/* ─── GET ONE   GET /api/notices/:id ─────────────────────────── */
exports.getNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.status(200).json({ success: true, data: enrichNotice(notice) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/* ─── UPDATE   PUT /api/notices/:id ──────────────────────────── */
exports.updateNotice = async (req, res) => {
  try {
    const { title, description, type, isActive, publishDate, expiryDate, driveLinks } = req.body;
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    if (title)                  notice.title       = title;
    if (description)            notice.description = description;
    if (type)                   notice.type        = type;
    if (isActive !== undefined) notice.isActive    = isActive;
    if (publishDate)            notice.publishDate = publishDate;
    if (expiryDate)             notice.expiryDate  = expiryDate;

    if (driveLinks !== undefined) {
      let raw = [];
      try { raw = typeof driveLinks === 'string' ? JSON.parse(driveLinks) : driveLinks; }
      catch { raw = []; }
      notice.driveLinks = normaliseDriveLinks(raw);
    }

    for (const file of req.files || []) {
      const fileType = file.mimetype === 'application/pdf' ? 'pdf' : 'image';
      const parts    = file.path.split('/');
      const pubId    = parts[parts.length - 1].split('.')[0];
      notice.attachments.push({
        fileUrl: file.path, fileType,
        fileName: file.originalname,
        publicId: `school-management/${pubId}`,
      });
    }

    await notice.save();
    const updated = await Notice.findById(notice._id).populate('createdBy', 'name email');
    res.status(200).json({ success: true, message: 'Notice updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/* ─── DELETE   DELETE /api/notices/:id ───────────────────────── */
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    for (const att of notice.attachments) {
      if (att.publicId) { try { await cloudinary.uploader.destroy(att.publicId); } catch {} }
    }
    await notice.deleteOne();
    res.status(200).json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/* ─── DELETE ATTACHMENT ──────────────────────────────────────── */
exports.deleteAttachment = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    const att = notice.attachments.id(req.params.attachmentId);
    if (att?.publicId) { try { await cloudinary.uploader.destroy(att.publicId); } catch {} }
    notice.attachments.pull(req.params.attachmentId);
    await notice.save();
    res.status(200).json({ success: true, message: 'Attachment deleted', data: notice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

/* ─── DELETE DRIVE LINK ──────────────────────────────────────── */
exports.deleteDriveLink = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    notice.driveLinks.pull(req.params.linkId);
    await notice.save();
    res.status(200).json({ success: true, message: 'Drive link deleted', data: notice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};