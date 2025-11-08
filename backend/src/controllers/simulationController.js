const Simulation = require('../models/Simulation');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create a new simulation
const createSimulation = async (req, res) => {
  try {
    const {
      sessionId,
      userId,
      title,
      description,
      duration,
      score,
      errors: simulationErrors,
      participants,
      tools_used,
      simulationType,
      tissueInteractions,
      cuts,
      collaborativeData,
      performance,
      tags,
      isPublic
    } = req.body;

    // Create new simulation
    const simulation = new Simulation({
      sessionId,
      userId,
      title: title || `Surgery Simulation - ${new Date().toLocaleDateString()}`,
      description,
      duration,
      score: score || 0,
      errors: simulationErrors || 0,
      participantCount: participants || 1,
      toolsUsed: tools_used || [],
      simulationType: simulationType || 'basic',
      tissueInteractions: tissueInteractions || [],
      cuts: cuts || [],
      collaborativeData: collaborativeData || { participants: [], totalMessages: 0, voiceTime: 0 },
      performance: performance || {},
      tags: tags || [],
      isPublic: isPublic || false,
      isCompleted: true,
      status: 'completed'
    });

    const savedSimulation = await simulation.save();

    // Populate user information
    await savedSimulation.populate('userId', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Simulation saved successfully',
      data: savedSimulation
    });

  } catch (error) {
    console.error('Error creating simulation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save simulation',
      error: error.message
    });
  }
};

// Get simulations for a user
const getUserSimulations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: {
        path: 'userId',
        select: 'name email role'
      }
    };

    const simulations = await Simulation.paginate(filter, options);

    res.status(200).json({
      success: true,
      data: simulations
    });

  } catch (error) {
    console.error('Error fetching user simulations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch simulations',
      error: error.message
    });
  }
};

// Get a specific simulation
const getSimulation = async (req, res) => {
  try {
    const { id } = req.params;

    const simulation = await Simulation.findById(id)
      .populate('userId', 'name email role')
      .populate('collaborativeData.participants.userId', 'name email role');

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: simulation
    });

  } catch (error) {
    console.error('Error fetching simulation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch simulation',
      error: error.message
    });
  }
};

// Update simulation
const updateSimulation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const simulation = await Simulation.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('userId', 'name email role');

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Simulation updated successfully',
      data: simulation
    });

  } catch (error) {
    console.error('Error updating simulation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update simulation',
      error: error.message
    });
  }
};

// Delete simulation
const deleteSimulation = async (req, res) => {
  try {
    const { id } = req.params;

    const simulation = await Simulation.findByIdAndDelete(id);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Simulation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting simulation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete simulation',
      error: error.message
    });
  }
};

// Get user simulation statistics
const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await Simulation.getUserStats(userId);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalSimulations: 0,
        totalDuration: 0,
        averageScore: 0,
        totalErrors: 0,
        completedSimulations: 0
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

// Get simulation leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const leaderboard = await Simulation.getLeaderboard(parseInt(limit));

    res.status(200).json({
      success: true,
      data: leaderboard
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
};

// Add tissue interaction to simulation
const addTissueInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { toolType, position, force } = req.body;

    const simulation = await Simulation.findById(id);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation not found'
      });
    }

    await simulation.addTissueInteraction(toolType, position, force);

    res.status(200).json({
      success: true,
      message: 'Tissue interaction added successfully'
    });

  } catch (error) {
    console.error('Error adding tissue interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add tissue interaction',
      error: error.message
    });
  }
};

// Add cut to simulation
const addCut = async (req, res) => {
  try {
    const { id } = req.params;
    const cutData = req.body;

    const simulation = await Simulation.findById(id);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation not found'
      });
    }

    await simulation.addCut(cutData);

    res.status(200).json({
      success: true,
      message: 'Cut added successfully'
    });

  } catch (error) {
    console.error('Error adding cut:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add cut',
      error: error.message
    });
  }
};

module.exports = {
  createSimulation,
  getUserSimulations,
  getSimulation,
  updateSimulation,
  deleteSimulation,
  getUserStats,
  getLeaderboard,
  addTissueInteraction,
  addCut
};