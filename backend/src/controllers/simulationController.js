const Simulation = require('../models/Simulation');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create a new simulation session (for live collaboration)
const createSimulationSession = async (req, res) => {
  try {
    const {
      title,
      description,
      scenario,
      maxParticipants,
      inviteOnly
    } = req.body;

    // Get authenticated user from protect middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Only doctors can create simulation sessions.'
      });
    }

    const userId = req.user._id ? req.user._id.toString() : req.user.kindeId || req.user.id;
    const userName = req.user.name || 'Unknown User';

    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create new simulation session
    const simulation = new Simulation({
      sessionId,
      userId,
      creatorId: userId,
      title: title || `Surgery Simulation - ${new Date().toLocaleDateString()}`,
      description: description || '',
      scenario: scenario || 'basic-procedure',
      maxParticipants: maxParticipants || 6,
      inviteOnly: inviteOnly || false,
      duration: 0,
      score: 0,
      errors: 0,
      participantCount: 1,
      toolsUsed: [],
      simulationType: 'custom',
      status: 'idle',
      isCompleted: false,
      collaborativeData: {
        participants: [{
          userId,
          name: userName,
          role: 'surgeon',
          joinedAt: new Date()
        }],
        totalMessages: 0,
        voiceTime: 0
      }
    });

    const savedSimulation = await simulation.save();

    // Generate full shareable link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareableLink = `${baseUrl}/surgery-simulation?link=${savedSimulation.uniqueLink}`;
    const shareableCodeLink = `${baseUrl}/surgery-simulation?code=${savedSimulation.shareableCode}`;

    res.status(201).json({
      success: true,
      message: 'Simulation session created successfully',
      data: {
        ...savedSimulation.toObject(),
        shareableLink,
        shareableCodeLink
      }
    });

  } catch (error) {
    console.error('Error creating simulation session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create simulation session',
      error: error.message
    });
  }
};

// Join a simulation session via link or code
const joinSimulationSession = async (req, res) => {
  try {
    const { identifier } = req.params; // Can be uniqueLink or shareableCode
    
    console.log('Join session - received identifier:', identifier);
    console.log('Join session - params:', req.params);
    
    // Get authenticated user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to join simulation session.'
      });
    }

    const userId = req.user._id ? req.user._id.toString() : req.user.kindeId || req.user.id;
    const userName = req.user.name || 'Unknown User';

    // Find simulation by link or code
    const simulation = await Simulation.findByLinkOrCode(identifier);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation session not found'
      });
    }

    // Check if simulation is completed
    if (simulation.status === 'completed' || simulation.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'This simulation session has already been completed'
      });
    }

    // Check if user is already a participant
    const isParticipant = simulation.collaborativeData.participants.some(
      p => p.userId?.toString() === userId.toString()
    );

    if (!isParticipant) {
      // Check max participants
      if (simulation.collaborativeData.participants.length >= simulation.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'This simulation session is full'
        });
      }

      // Add user as participant
      simulation.collaborativeData.participants.push({
        userId,
        name: userName,
        role: 'assistant',
        joinedAt: new Date()
      });

      simulation.participantCount = simulation.collaborativeData.participants.length;
      await simulation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Successfully joined simulation session',
      data: simulation
    });

  } catch (error) {
    console.error('Error joining simulation session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join simulation session',
      error: error.message
    });
  }
};

// Get simulation by link or code (for viewing before joining)
const getSimulationByLink = async (req, res) => {
  try {
    const { identifier } = req.params;

    const simulation = await Simulation.findByLinkOrCode(identifier);

    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation session not found'
      });
    }

    // Don't send full details if invite only and user not participant
    const userId = req.user?.id;
    const isParticipant = simulation.collaborativeData.participants.some(
      p => p.userId && p.userId.toString() === userId
    );

    if (simulation.inviteOnly && !isParticipant) {
      return res.status(200).json({
        success: true,
        data: {
          _id: simulation._id,
          title: simulation.title,
          description: simulation.description,
          scenario: simulation.scenario,
          creatorId: simulation.creatorId,
          participantCount: simulation.participantCount,
          maxParticipants: simulation.maxParticipants,
          status: simulation.status,
          inviteOnly: simulation.inviteOnly
        }
      });
    }

    res.status(200).json({
      success: true,
      data: simulation
    });

  } catch (error) {
    console.error('Error fetching simulation by link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch simulation session',
      error: error.message
    });
  }
};

// Get active simulation sessions
const getActiveSessions = async (req, res) => {
  try {
    const { page = 1, limit = 10, scenario, status = 'idle,active' } = req.query;

    const filter = {
      isCompleted: false,
      status: { $in: status.split(',') },
      inviteOnly: false
    };

    if (scenario) {
      filter.scenario = scenario;
    }

    const simulations = await Simulation.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Simulation.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        simulations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active sessions',
      error: error.message
    });
  }
};

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

    const simulations = await Simulation.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Simulation.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        simulations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
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

    const simulation = await Simulation.findById(id);

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
    );

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
  createSimulationSession,
  joinSimulationSession,
  getSimulationByLink,
  getActiveSessions,
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