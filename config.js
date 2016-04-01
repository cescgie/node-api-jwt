module.exports = {
  // App Settings
  MONGO_URI: process.env.MONGO_URI || 'localhost/nodewebapp',
  TOKEN_SECRET: process.env.TOKEN_SECRET || 'YOUR_UNIQUE_JWT_TOKEN_SECRET'
};
