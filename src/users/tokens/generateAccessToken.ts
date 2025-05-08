import * as jwt from 'jsonwebtoken';

const ACCESS_SECRET_KEY = 'your-access-secret-key';

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ sub: userId }, ACCESS_SECRET_KEY, { expiresIn: '15m' });
};