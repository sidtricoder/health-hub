const mongoose = require('mongoose');
const crypto = require('crypto');

const SimulationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  uniqueLink: {
    type: String,
    unique: true,
    index: true
    // Note: Not required here because pre-save hook will generate it
  },
  shareableCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  userId: {
    type: String, // Changed to String to support Kinde IDs (e.g., kp_...)
    required: true,
    index: true
  },
  creatorId: {
    type: String, // Changed to String to support Kinde IDs
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'Surgery Simulation'
  },
  description: {
    type: String,
    default: ''
  },
  scenario: {
    type: String,
    enum: ['basic-procedure', 'appendectomy', 'cardiac-surgery', 'neurosurgery', 'trauma-surgery', 'laparoscopic'],
    default: 'basic-procedure'
  },
  maxParticipants: {
    type: Number,
    default: 6,
    min: 1,
    max: 20
  },
  inviteOnly: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  errors: {
    type: Number,
    default: 0,
    min: 0
  },
  participantCount: {
    type: Number,
    default: 1,
    min: 1
  },
  toolsUsed: [{
    type: String,
    enum: ['scalpel', 'forceps', 'suture', 'cautery', 'syringe', 'clamp']
  }],
  simulationType: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced', 'custom'],
    default: 'basic'
  },
  tissueInteractions: [{
    toolType: String,
    position: {
      x: Number,
      y: Number,
      z: Number
    },
    force: Number,
    timestamp: Date
  }],
  cuts: [{
    id: String,
    points: [{
      x: Number,
      y: Number,
      z: Number
    }],
    depth: Number,
    toolUsed: String,
    timestamp: Date
  }],
  collaborativeData: {
    participants: [{
      userId: {
        type: String, // Changed to String to support Kinde IDs
        ref: 'User'
      },
      name: String,
      role: {
        type: String,
        enum: ['surgeon', 'assistant', 'observer']
      },
      joinedAt: Date,
      leftAt: Date,
      actions: [{
        type: String,
        description: String,
        timestamp: Date
      }]
    }],
    totalMessages: {
      type: Number,
      default: 0
    },
    voiceTime: {
      type: Number,
      default: 0
    }
  },
  performance: {
    precision: {
      type: Number,
      min: 0,
      max: 100
    },
    speed: {
      type: Number,
      min: 0,
      max: 100
    },
    safety: {
      type: Number,
      min: 0,
      max: 100
    },
    teamwork: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  feedback: {
    strengths: [String],
    improvements: [String],
    suggestions: [String]
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['idle', 'active', 'paused', 'completed', 'archived'],
    default: 'idle'
  }
}, {
  timestamps: true,
  collection: 'simulations'
});

// Indexes for better query performance
SimulationSchema.index({ userId: 1, createdAt: -1 });
SimulationSchema.index({ sessionId: 1, createdAt: -1 });
SimulationSchema.index({ status: 1, createdAt: -1 });
SimulationSchema.index({ score: -1 });
SimulationSchema.index({ duration: -1 });

// Virtual for formatted duration
SimulationSchema.virtual('formattedDuration').get(function() {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for average performance score
SimulationSchema.virtual('averagePerformance').get(function() {
  if (!this.performance) return 0;
  const scores = Object.values(this.performance).filter(score => typeof score === 'number');
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
});

// Method to add tissue interaction
SimulationSchema.methods.addTissueInteraction = function(toolType, position, force) {
  this.tissueInteractions.push({
    toolType,
    position,
    force,
    timestamp: new Date()
  });
  return this.save();
};

// Method to add cut
SimulationSchema.methods.addCut = function(cutData) {
  this.cuts.push({
    ...cutData,
    timestamp: new Date()
  });
  return this.save();
};

// Method to update performance metrics
SimulationSchema.methods.updatePerformance = function(metrics) {
  this.performance = { ...this.performance, ...metrics };
  return this.save();
};

// Static method to get user statistics
SimulationSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalSimulations: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        averageScore: { $avg: '$score' },
        totalErrors: { $sum: '$errors' },
        completedSimulations: {
          $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get leaderboard
SimulationSchema.statics.getLeaderboard = function(limit = 10) {
  return this.aggregate([
    { $match: { isCompleted: true, isPublic: true } },
    {
      $group: {
        _id: '$userId',
        bestScore: { $max: '$score' },
        totalSimulations: { $sum: 1 },
        averageScore: { $avg: '$score' },
        totalDuration: { $sum: '$duration' }
      }
    },
    { $sort: { bestScore: -1, averageScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        email: '$user.email',
        bestScore: 1,
        totalSimulations: 1,
        averageScore: { $round: ['$averageScore', 1] },
        totalDuration: 1
      }
    }
  ]);
};

// Static method to generate unique link
SimulationSchema.statics.generateUniqueLink = function() {
  return crypto.randomBytes(16).toString('hex');
};

// Static method to generate shareable code
SimulationSchema.statics.generateShareableCode = function() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Static method to find simulation by link or code
SimulationSchema.statics.findByLinkOrCode = function(identifier) {
  return this.findOne({
    $or: [
      { uniqueLink: identifier },
      { shareableCode: identifier }
    ]
  });
};

// Pre-save middleware to generate unique identifiers
SimulationSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate unique link if not provided
    if (!this.uniqueLink) {
      let uniqueLink;
      let isUnique = false;
      
      while (!isUnique) {
        uniqueLink = crypto.randomBytes(16).toString('hex');
        const existing = await this.constructor.findOne({ uniqueLink });
        if (!existing) {
          isUnique = true;
        }
      }
      
      this.uniqueLink = uniqueLink;
    }
    
    // Generate shareable code if not provided
    if (!this.shareableCode) {
      let shareableCode;
      let isUnique = false;
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      
      while (!isUnique) {
        shareableCode = '';
        for (let i = 0; i < 8; i++) {
          shareableCode += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        const existing = await this.constructor.findOne({ shareableCode });
        if (!existing) {
          isUnique = true;
        }
      }
      
      this.shareableCode = shareableCode;
    }
    
    // Set creatorId if not set
    if (!this.creatorId) {
      this.creatorId = this.userId;
    }
  }
  
  next();
});

module.exports = mongoose.model('Simulation', SimulationSchema);