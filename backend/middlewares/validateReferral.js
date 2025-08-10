// middlewares/validateReferral.js
exports.validateReferralRole = (req, res, next) => {
  const { role_name, commission_rate } = req.body;
  
  if (!role_name || role_name.length < 3) {
    return res.status(400).json({ error: 'Role name must be at least 3 characters' });
  }

  if (isNaN(commission_rate) || commission_rate <= 0 || commission_rate > 100) {
    return res.status(400).json({ error: 'Commission rate must be between 0-100%' });
  }

  next();
};