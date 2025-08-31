import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export function signJwtToken(payload, options = { expiresIn: '7d' }) {
  return jwt.sign(payload, SECRET, options);
}

export function verifyJwtToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
}
