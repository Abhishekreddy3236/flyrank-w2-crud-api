const express = require('express');
const router = express.Router();

module.exports = () => {
  router.get('/info', (req, res) => {
    res.status(200).json({ message: 'Welcome stranger! This info is public.' });
  });

  return router;
};
