require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder';

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());

app.use('/auth', require('./routes/auth')(supabase));
app.use('/public', require('./routes/public')());
app.use('/protected', require('./routes/protected')(supabase));

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.warn("WARNING: SUPABASE_URL or SUPABASE_KEY is missing in .env");
  }
});

module.exports = { app, supabase };
