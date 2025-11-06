const { setupKinde } = require('@kinde-oss/kinde-node-express');

const setupKindeAuth = (app) => {
  // Check if required environment variables are present
  if (!process.env.KINDE_DOMAIN || !process.env.KINDE_CLIENT_ID || !process.env.KINDE_CLIENT_SECRET) {
    console.warn('Kinde environment variables not configured. Skipping Kinde setup.');
    return null;
  }

  console.log('KINDE_DOMAIN:', process.env.KINDE_DOMAIN);
  console.log('KINDE_CLIENT_ID:', process.env.KINDE_CLIENT_ID);
  console.log('KINDE_CLIENT_SECRET:', process.env.KINDE_CLIENT_SECRET);

  const kindeClient = setupKinde({
    issuerBaseUrl: process.env.KINDE_DOMAIN,
    siteUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    clientId: process.env.KINDE_CLIENT_ID,
    secret: process.env.KINDE_CLIENT_SECRET,
    redirectUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/kinde/callback`,
    postLogoutRedirectUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    unAuthorisedUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    grantType: 'AUTHORIZATION_CODE'
  }, app);

  // Add middleware to make kinde client available on request object
  app.use((req, res, next) => {
    req.kinde = kindeClient;
    next();
  });

  return kindeClient;
};

module.exports = { setupKindeAuth };