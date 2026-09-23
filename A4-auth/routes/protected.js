const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

module.exports = (supabase) => {
  const requireAuth = authMiddleware(supabase);

  router.get('/profile', requireAuth, (req, res) => {
    res.status(200).json({
      id: req.user.id,
      email: req.user.email,
      created_at: req.user.created_at
    });
  });

  router.get('/dashboard', requireAuth, (req, res) => {
    res.status(200).json({
      message: 'Welcome to your protected dashboard',
      user: req.user.email
    });
  });

  return router;
};
