const TeacherTraining = require('../models/TeacherTraining');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all trainings
// @route   GET /api/teacher-trainings
// @access  Public / Admin sees all
exports.getAllTrainings = async (req, res) => {
  try {
    // Admin sees all; public sees active only
    const query = req.user?.role === 'admin' ? {} : { isActive: true };

    const trainings = await TeacherTraining.find(query)
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: trainings.length,
      data: trainings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch trainings', error: error.message });
  }
};

exports.getTraining = async (req, res) => {
  try {
    const training = await TeacherTraining.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found' });
    }
    res.status(200).json({ success: true, data: training });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch training', error: error.message });
  }
};

exports.createTraining = async (req, res) => {
  try {
    const trainingData = { ...req.body };

    if (req.file) {
      trainingData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const training = await TeacherTraining.create(trainingData);

    res.status(201).json({
      success: true,
      message: 'Training created successfully',
      data: training
    });
  } catch (error) {
    console.error('Create training error:', error);
    res.status(500).json({ success: false, message: 'Failed to create training', error: error.message });
  }
};

exports.updateTraining = async (req, res) => {
  try {
    let training = await TeacherTraining.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found' });
    }

    const updateData = { ...req.body };

    if (req.file) {
      if (training.image?.publicId) {
        try { await cloudinary.uploader.destroy(training.image.publicId); } catch {}
      }
      updateData.image = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    training = await TeacherTraining.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Training updated successfully', data: training });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update training', error: error.message });
  }
};

exports.deleteTraining = async (req, res) => {
  try {
    const training = await TeacherTraining.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found' });
    }

    if (training.image?.publicId) {
      try { await cloudinary.uploader.destroy(training.image.publicId); } catch {}
    }

    await training.deleteOne();

    res.status(200).json({ success: true, message: 'Training deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete training', error: error.message });
  }
};

exports.toggleTrainingStatus = async (req, res) => {
  try {
    const training = await TeacherTraining.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training not found' });
    }

    training.isActive = !training.isActive;
    await training.save();

    res.status(200).json({
      success: true,
      message: `Training ${training.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: training.isActive }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle status', error: error.message });
  }
};
