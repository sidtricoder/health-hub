const { AppError } = require('../middleware/errorHandler');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    console.log('Validation input:', JSON.stringify(req.body, null, 2));
    
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      console.log('Validation errors:', errors);
      return next(new AppError('Validation failed', 400, errors));
    }

    console.log('Validation passed');
    next();
  };
};

module.exports = validate;