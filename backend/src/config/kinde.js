const { setupKinde } = require('@kinde-oss/kinde-node-express');

const setupKindeAuth = (app) => {
  const kindeClient = setupKinde({
    issuerBaseUrl: process.env.KINDE_DOMAIN,
    siteUrl: process.env.FRONTEND_URL,
    clientId: process.env.KINDE_CLIENT_ID,
    secret: process.env.KINDE_CLIENT_SECRET,
    redirectUrl: `${process.env.BACKEND_URL}/api/auth/kinde/callback`,
    postLogoutRedirectUrl: process.env.FRONTEND_URL,
    unAuthorisedUrl: process.env.FRONTEND_URL,
    grantType: 'AUTHORIZATION_CODE'
  }, app);

  app.use((req, res, next) => {
    req.kinde = kindeClient;
    next();
  });

  return kindeClient;
};

module.exports = { setupKindeAuth };