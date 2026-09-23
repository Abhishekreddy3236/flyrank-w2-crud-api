const express = require('express');
const router = express.Router();

module.exports = () => {
  router.get('/profile', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // At this stage, only verify that a token was supplied.
    res.status(200).json({ message: 'Token present but not verified yet' });
  });

  return router;
};
