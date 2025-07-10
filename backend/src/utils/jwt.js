const jwt = require('jsonwebtoken');
const { promisify } = require('util');

/**
 * Generate JWT access token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
const generateAccessToken = userId => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'ecommerce-api',
    audience: 'ecommerce-client',
  });
};

/**
 * Generate JWT refresh token
 * @param {string} userId - User ID
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = userId => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'ecommerce-api',
      audience: 'ecommerce-client',
    }
  );
};

/**
 * Generate both access and refresh tokens
 * @param {string} userId - User ID
 * @returns {Object} Object containing both tokens
 */
const generateTokens = userId => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  };
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - Secret to verify with (optional, defaults to JWT_SECRET)
 * @returns {Promise<Object>} Decoded token payload
 */
const verifyToken = async (token, secret = process.env.JWT_SECRET) => {
  try {
    const decoded = await promisify(jwt.verify)(token, secret);
    return decoded;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify refresh token
 * @param {string} refreshToken - Refresh token to verify
 * @returns {Promise<Object>} Decoded token payload
 */
const verifyRefreshToken = async refreshToken => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    const decoded = await verifyToken(refreshToken, secret);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw error;
  }
};

/**
 * Get token from authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
const extractTokenFromHeader = authHeader => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
const decodeToken = token => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired
 */
const isTokenExpired = token => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
const getTokenExpiration = token => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
};
