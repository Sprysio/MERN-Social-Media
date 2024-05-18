const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  const tokenHeader = req.header('Authorization');
  if (!tokenHeader) {
    return res.status(401).send('Access denied. No token provided.');
  }
  
  // Extract the token from the Authorization header (remove 'Bearer ' prefix)
  const token = tokenHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.SECRETKEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(400).send('Invalid token.');
  }
};
