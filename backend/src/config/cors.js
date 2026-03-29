const getCorsOrigins = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'development') {
    return [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      /^http:\/\/.*\.localhost(:\d+)?$/,
    ];
  }
  
  // Production: allow both subdomains
  return [
    process.env.FRONTEND_URL,
    `https://admin.${process.env.DOMAIN || 'nellai.com'}`,
    `https://www.${process.env.DOMAIN || 'nellai.com'}`,
    `https://${process.env.DOMAIN || 'nellai.com'}`,
  ].filter(Boolean);
};

module.exports = { getCorsOrigins };
