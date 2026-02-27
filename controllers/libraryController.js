const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const Fine = require('../models/Fine');
const Student = require('../models/Student');
const { cloudinary } = require('../config/cloudinary');

// ==================== BOOK MANAGEMENT ====================

exports.getAllBooks = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { title:  { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn:   { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (status)   query.status   = status;

    const books = await Book.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: books.length, data: books });
  } catch (error) {
    console.error('Get Books Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch books', error: error.message });
  }
};

exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch book', error: error.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const bookData = { ...req.body };
    if (req.file) bookData.bookImage = req.file.path;
    bookData.availableQuantity = bookData.totalQuantity;
    const book = await Book.create(bookData);
    res.status(201).json({ success: true, message: 'Book added successfully', data: book });
  } catch (error) {
    console.error('Create Book Error:', error);
    res.status(500).json({ success: false, message: 'Failed to add book', error: error.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    let book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const updateData = { ...req.body };
    if (req.file) {
      if (book.bookImage && !book.bookImage.includes('placeholder')) {
        const publicId = book.bookImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`school-management/books/${publicId}`);
      }
      updateData.bookImage = req.file.path;
    }

    book = await Book.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Book updated successfully', data: book });
  } catch (error) {
    console.error('Update Book Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update book', error: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const activeIssues = await BookIssue.countDocuments({
      book: req.params.id, status: { $in: ['Issued', 'Overdue'] }
    });
    if (activeIssues > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete book. It has active issues.' });
    }

    if (book.bookImage && !book.bookImage.includes('placeholder')) {
      const publicId = book.bookImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`school-management/books/${publicId}`);
    }
    await Book.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Delete Book Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete book', error: error.message });
  }
};

// ==================== BOOK ISSUE/RETURN ====================

exports.issueBook = async (req, res) => {
  try {
    const { bookId, studentId, dueDate } = req.body;

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    if (book.availableQuantity <= 0) return res.status(400).json({ success: false, message: 'Book is not available' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const existingIssue = await BookIssue.findOne({
      book: bookId, student: studentId, status: { $in: ['Issued', 'Overdue'] }
    });
    if (existingIssue) return res.status(400).json({ success: false, message: 'Student already has this book issued' });

    const bookIssue = await BookIssue.create({
      book: bookId, student: studentId,
      dueDate: new Date(dueDate), issuedBy: req.user._id
    });

    book.availableQuantity -= 1;
    await book.save();

    const populatedIssue = await BookIssue.findById(bookIssue._id)
      .populate('book',      'title author isbn bookImage')
      .populate('student',   'name rollNumber class profileImage')
      .populate('issuedBy',  'name');

    res.status(201).json({ success: true, message: 'Book issued successfully', data: populatedIssue });
  } catch (error) {
    console.error('Issue Book Error:', error);
    res.status(500).json({ success: false, message: 'Failed to issue book', error: error.message });
  }
};

exports.returnBook = async (req, res) => {
  try {
    const issueId = req.params.issueId || req.params.id;
    const { remarks } = req.body;

    const bookIssue = await BookIssue.findById(issueId).populate('book').populate('student');
    if (!bookIssue) return res.status(404).json({ success: false, message: 'Book issue record not found' });
    if (bookIssue.status === 'Returned') return res.status(400).json({ success: false, message: 'Book already returned' });

    const returnDate = new Date();
    const dueDate    = new Date(bookIssue.dueDate);
    let fine = 0;

    if (returnDate > dueDate) {
      const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      fine = daysLate * 5;
      await Fine.create({
        bookIssue: issueId, student: bookIssue.student._id,
        amount: fine, reason: `Book returned ${daysLate} days late`
      });
    }

    bookIssue.returnDate  = returnDate;
    bookIssue.status      = 'Returned';
    bookIssue.fine        = fine;
    bookIssue.remarks     = remarks;
    bookIssue.returnedBy  = req.user._id;
    await bookIssue.save();

    const book = await Book.findById(bookIssue.book._id);
    book.availableQuantity += 1;
    await book.save();

    const updatedIssue = await BookIssue.findById(issueId)
      .populate('book',       'title author isbn bookImage')
      .populate('student',    'name rollNumber class profileImage')
      .populate('issuedBy',   'name')
      .populate('returnedBy', 'name');

    res.status(200).json({
      success: true,
      message: fine > 0 ? `Book returned with fine: ${fine} Taka` : 'Book returned successfully',
      data: updatedIssue
    });
  } catch (error) {
    console.error('Return Book Error:', error);
    res.status(500).json({ success: false, message: 'Failed to return book', error: error.message });
  }
};

exports.getAllIssues = async (req, res) => {
  try {
    const { status, studentId } = req.query;
    let query = {};
    if (status)    query.status  = status;
    if (studentId) query.student = studentId;

    const issues = await BookIssue.find(query)
      .populate('book',       'title author isbn bookImage')
      .populate('student',    'name rollNumber class profileImage')
      .populate('issuedBy',   'name')
      .populate('returnedBy', 'name')
      .sort({ createdAt: -1 });

    const today = new Date();
    for (let issue of issues) {
      if (issue.status === 'Issued' && new Date(issue.dueDate) < today) {
        issue.status = 'Overdue';
        await issue.save();
      }
    }

    res.status(200).json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    console.error('Get Issues Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch book issues', error: error.message });
  }
};

// ✅ NEW — Get single issue by ID
exports.getIssueById = async (req, res) => {
  try {
    const issue = await BookIssue.findById(req.params.id)
      .populate('book',       'title author isbn bookImage')
      .populate('student',    'name rollNumber class profileImage')
      .populate('issuedBy',   'name')
      .populate('returnedBy', 'name');

    if (!issue) return res.status(404).json({ success: false, message: 'Issue record not found' });
    res.status(200).json({ success: true, data: issue });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch issue', error: error.message });
  }
};

// ==================== FINE MANAGEMENT ====================

exports.getAllFines = async (req, res) => {
  try {
    const { status, studentId } = req.query;
    let query = {};
    if (status)    query.status  = status;
    if (studentId) query.student = studentId;

    const fines = await Fine.find(query)
      .populate('student', 'name rollNumber class profileImage')
      .populate({ path: 'bookIssue', populate: { path: 'book', select: 'title author isbn' } })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: fines.length, data: fines });
  } catch (error) {
    console.error('Get Fines Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch fines', error: error.message });
  }
};

exports.updateFineStatus = async (req, res) => {
  try {
    const fineId = req.params.fineId || req.params.id;
    const { status, remarks } = req.body;

    let fine = await Fine.findById(fineId);
    if (!fine) return res.status(404).json({ success: false, message: 'Fine not found' });

    fine.status  = status;
    fine.remarks = remarks;
    if (status === 'Paid') fine.paidDate = new Date();
    await fine.save();

    fine = await Fine.findById(fineId)
      .populate('student', 'name rollNumber class profileImage')
      .populate({ path: 'bookIssue', populate: { path: 'book', select: 'title author isbn' } });

    res.status(200).json({ success: true, message: 'Fine updated successfully', data: fine });
  } catch (error) {
    console.error('Update Fine Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update fine', error: error.message });
  }
};

// ==================== STATISTICS ====================

exports.getLibraryStats = async (req, res) => {
  try {
    const totalBooksAgg     = await Book.aggregate([{ $group: { _id: null, total: { $sum: '$totalQuantity'     } } }]);
    const availableBooksAgg = await Book.aggregate([{ $group: { _id: null, total: { $sum: '$availableQuantity' } } }]);

    const issuedBooks   = await BookIssue.countDocuments({ status: { $in: ['Issued', 'Overdue'] } });
    const overdueBooks  = await BookIssue.countDocuments({ status: 'Overdue' });
    const todayReturns  = await BookIssue.countDocuments({
      returnDate: {
        $gte: new Date(new Date().setHours(0,  0,  0,   0)),
        $lt:  new Date(new Date().setHours(23, 59, 59, 999))
      }
    });
    const pendingFinesAgg = await Fine.aggregate([
      { $match: { status: 'Pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBooks:    totalBooksAgg[0]?.total     || 0,
        availableBooks: availableBooksAgg[0]?.total || 0,
        issuedBooks,
        overdueBooks,
        todayReturns,
        pendingFines:  pendingFinesAgg[0]?.total   || 0
      }
    });
  } catch (error) {
    console.error('Get Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
};



// const Book = require('../models/Book');
// const BookIssue = require('../models/BookIssue');
// const Fine = require('../models/Fine');
// const Student = require('../models/Student');
// const { cloudinary } = require('../config/cloudinary');

// // ==================== BOOK MANAGEMENT ====================

// // Get all books
// exports.getAllBooks = async (req, res) => {
//   try {
//     const { search, category, status } = req.query;
//     let query = {};

//     if (search) {
//       query.$or = [
//         { title: { $regex: search, $options: 'i' } },
//         { author: { $regex: search, $options: 'i' } },
//         { isbn: { $regex: search, $options: 'i' } }
//       ];
//     }

//     if (category) {
//       query.category = category;
//     }

//     if (status) {
//       query.status = status;
//     }

//     const books = await Book.find(query).sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: books.length,
//       data: books
//     });
//   } catch (error) {
//     console.error('Get Books Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch books',
//       error: error.message
//     });
//   }
// };

// // Get single book
// exports.getBook = async (req, res) => {
//   try {
//     const book = await Book.findById(req.params.id);

//     if (!book) {
//       return res.status(404).json({
//         success: false,
//         message: 'Book not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: book
//     });
//   } catch (error) {
//     console.error('Get Book Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch book',
//       error: error.message
//     });
//   }
// };

// // Create new book
// exports.createBook = async (req, res) => {
//   try {
//     const bookData = { ...req.body };

//     // Handle image upload
//     if (req.file) {
//       bookData.bookImage = req.file.path;
//     }

//     // Set available quantity same as total quantity initially
//     bookData.availableQuantity = bookData.totalQuantity;

//     const book = await Book.create(bookData);

//     res.status(201).json({
//       success: true,
//       message: 'Book added successfully',
//       data: book
//     });
//   } catch (error) {
//     console.error('Create Book Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to add book',
//       error: error.message
//     });
//   }
// };

// // Update book
// exports.updateBook = async (req, res) => {
//   try {
//     let book = await Book.findById(req.params.id);

//     if (!book) {
//       return res.status(404).json({
//         success: false,
//         message: 'Book not found'
//       });
//     }

//     const updateData = { ...req.body };

//     // Handle new image upload
//     if (req.file) {
//       // Delete old image from cloudinary if exists
//       if (book.bookImage && !book.bookImage.includes('placeholder')) {
//         const publicId = book.bookImage.split('/').pop().split('.')[0];
//         await cloudinary.uploader.destroy(`school-management/books/${publicId}`);
//       }
//       updateData.bookImage = req.file.path;
//     }

//     book = await Book.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Book updated successfully',
//       data: book
//     });
//   } catch (error) {
//     console.error('Update Book Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update book',
//       error: error.message
//     });
//   }
// };

// // Delete book
// exports.deleteBook = async (req, res) => {
//   try {
//     const book = await Book.findById(req.params.id);

//     if (!book) {
//       return res.status(404).json({
//         success: false,
//         message: 'Book not found'
//       });
//     }

//     // Check if book is currently issued
//     const activeIssues = await BookIssue.countDocuments({
//       book: req.params.id,
//       status: { $in: ['Issued', 'Overdue'] }
//     });

//     if (activeIssues > 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Cannot delete book. It has active issues.'
//       });
//     }

//     // Delete image from cloudinary
//     if (book.bookImage && !book.bookImage.includes('placeholder')) {
//       const publicId = book.bookImage.split('/').pop().split('.')[0];
//       await cloudinary.uploader.destroy(`school-management/books/${publicId}`);
//     }

//     await Book.findByIdAndDelete(req.params.id);

//     res.status(200).json({
//       success: true,
//       message: 'Book deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete Book Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete book',
//       error: error.message
//     });
//   }
// };

// // ==================== BOOK ISSUE/RETURN ====================

// // Issue book to student
// exports.issueBook = async (req, res) => {
//   try {
//     const { bookId, studentId, dueDate } = req.body;

//     // Check if book exists and available
//     const book = await Book.findById(bookId);
//     if (!book) {
//       return res.status(404).json({
//         success: false,
//         message: 'Book not found'
//       });
//     }

//     if (book.availableQuantity <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Book is not available'
//       });
//     }

//     // Check if student exists
//     const student = await Student.findById(studentId);
//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: 'Student not found'
//       });
//     }

//     // Check if student already has this book
//     const existingIssue = await BookIssue.findOne({
//       book: bookId,
//       student: studentId,
//       status: { $in: ['Issued', 'Overdue'] }
//     });

//     if (existingIssue) {
//       return res.status(400).json({
//         success: false,
//         message: 'Student already has this book issued'
//       });
//     }

//     // Create book issue
//     const bookIssue = await BookIssue.create({
//       book: bookId,
//       student: studentId,
//       dueDate: new Date(dueDate),
//       issuedBy: req.user._id
//     });

//     // Update book available quantity
//     book.availableQuantity -= 1;
//     await book.save();

//     const populatedIssue = await BookIssue.findById(bookIssue._id)
//       .populate('book', 'title author isbn bookImage')
//       .populate('student', 'name rollNumber class profileImage')
//       .populate('issuedBy', 'name');

//     res.status(201).json({
//       success: true,
//       message: 'Book issued successfully',
//       data: populatedIssue
//     });
//   } catch (error) {
//     console.error('Issue Book Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to issue book',
//       error: error.message
//     });
//   }
// };

// // Return book
// exports.returnBook = async (req, res) => {
//   try {
//     const { issueId } = req.params;
//     const { remarks } = req.body;

//     const bookIssue = await BookIssue.findById(issueId)
//       .populate('book')
//       .populate('student');

//     if (!bookIssue) {
//       return res.status(404).json({
//         success: false,
//         message: 'Book issue record not found'
//       });
//     }

//     if (bookIssue.status === 'Returned') {
//       return res.status(400).json({
//         success: false,
//         message: 'Book already returned'
//       });
//     }

//     // Calculate fine if overdue
//     const returnDate = new Date();
//     const dueDate = new Date(bookIssue.dueDate);
//     let fine = 0;

//     if (returnDate > dueDate) {
//       const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
//       fine = daysLate * 5; // 5 taka per day fine

//       // Create fine record
//       await Fine.create({
//         bookIssue: issueId,
//         student: bookIssue.student._id,
//         amount: fine,
//         reason: `Book returned ${daysLate} days late`
//       });
//     }

//     // Update book issue
//     bookIssue.returnDate = returnDate;
//     bookIssue.status = 'Returned';
//     bookIssue.fine = fine;
//     bookIssue.remarks = remarks;
//     bookIssue.returnedBy = req.user._id;
//     await bookIssue.save();

//     // Update book available quantity
//     const book = await Book.findById(bookIssue.book._id);
//     book.availableQuantity += 1;
//     await book.save();

//     const updatedIssue = await BookIssue.findById(issueId)
//       .populate('book', 'title author isbn bookImage')
//       .populate('student', 'name rollNumber class profileImage')
//       .populate('issuedBy', 'name')
//       .populate('returnedBy', 'name');

//     res.status(200).json({
//       success: true,
//       message: fine > 0 ? `Book returned with fine: ${fine} Taka` : 'Book returned successfully',
//       data: updatedIssue
//     });
//   } catch (error) {
//     console.error('Return Book Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to return book',
//       error: error.message
//     });
//   }
// };

// // Get all book issues
// exports.getAllIssues = async (req, res) => {
//   try {
//     const { status, studentId } = req.query;
//     let query = {};

//     if (status) {
//       query.status = status;
//     }

//     if (studentId) {
//       query.student = studentId;
//     }

//     const issues = await BookIssue.find(query)
//       .populate('book', 'title author isbn bookImage')
//       .populate('student', 'name rollNumber class profileImage')
//       .populate('issuedBy', 'name')
//       .populate('returnedBy', 'name')
//       .sort({ createdAt: -1 });

//     // Update overdue status
//     const today = new Date();
//     for (let issue of issues) {
//       if (issue.status === 'Issued' && new Date(issue.dueDate) < today) {
//         issue.status = 'Overdue';
//         await issue.save();
//       }
//     }

//     res.status(200).json({
//       success: true,
//       count: issues.length,
//       data: issues
//     });
//   } catch (error) {
//     console.error('Get Issues Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch book issues',
//       error: error.message
//     });
//   }
// };

// // ==================== FINE MANAGEMENT ====================

// // Get all fines
// exports.getAllFines = async (req, res) => {
//   try {
//     const { status, studentId } = req.query;
//     let query = {};

//     if (status) {
//       query.status = status;
//     }

//     if (studentId) {
//       query.student = studentId;
//     }

//     const fines = await Fine.find(query)
//       .populate('student', 'name rollNumber class profileImage')
//       .populate({
//         path: 'bookIssue',
//         populate: { path: 'book', select: 'title author isbn' }
//       })
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       count: fines.length,
//       data: fines
//     });
//   } catch (error) {
//     console.error('Get Fines Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch fines',
//       error: error.message
//     });
//   }
// };

// // Update fine status
// exports.updateFineStatus = async (req, res) => {
//   try {
//     const { fineId } = req.params;
//     const { status, remarks } = req.body;

//     let fine = await Fine.findById(fineId);

//     if (!fine) {
//       return res.status(404).json({
//         success: false,
//         message: 'Fine not found'
//       });
//     }

//     fine.status = status;
//     fine.remarks = remarks;

//     if (status === 'Paid') {
//       fine.paidDate = new Date();
//     }

//     await fine.save();

//     fine = await Fine.findById(fineId)
//       .populate('student', 'name rollNumber class profileImage')
//       .populate({
//         path: 'bookIssue',
//         populate: { path: 'book', select: 'title author isbn' }
//       });

//     res.status(200).json({
//       success: true,
//       message: 'Fine updated successfully',
//       data: fine
//     });
//   } catch (error) {
//     console.error('Update Fine Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update fine',
//       error: error.message
//     });
//   }
// };

// // ==================== STATISTICS ====================

// // Get library statistics
// exports.getLibraryStats = async (req, res) => {
//   try {
//     const totalBooks = await Book.aggregate([
//       { $group: { _id: null, total: { $sum: '$totalQuantity' } } }
//     ]);

//     const availableBooks = await Book.aggregate([
//       { $group: { _id: null, total: { $sum: '$availableQuantity' } } }
//     ]);

//     const issuedBooks = await BookIssue.countDocuments({
//       status: { $in: ['Issued', 'Overdue'] }
//     });

//     const overdueBooks = await BookIssue.countDocuments({
//       status: 'Overdue'
//     });

//     const todayReturns = await BookIssue.countDocuments({
//       returnDate: {
//         $gte: new Date(new Date().setHours(0, 0, 0, 0)),
//         $lt: new Date(new Date().setHours(23, 59, 59, 999))
//       }
//     });

//     const pendingFines = await Fine.aggregate([
//       { $match: { status: 'Pending' } },
//       { $group: { _id: null, total: { $sum: '$amount' } } }
//     ]);

//     res.status(200).json({
//       success: true,
//       data: {
//         totalBooks: totalBooks[0]?.total || 0,
//         availableBooks: availableBooks[0]?.total || 0,
//         issuedBooks,
//         overdueBooks,
//         todayReturns,
//         pendingFines: pendingFines[0]?.total || 0
//       }
//     });
//   } catch (error) {
//     console.error('Get Stats Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch statistics',
//       error: error.message
//     });
//   }
// };