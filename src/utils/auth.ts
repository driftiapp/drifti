import jwt from 'jsonwebtoken';
import { JWTPayload, AuthTokens } from '../types/auth';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET!;

const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

export const generateTokens = (payload: Omit<JWTPayload, 'iat' | 'exp'>): AuthTokens => {
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string, isRefreshToken = false): JWTPayload | null => {
  try {
    return jwt.verify(token, isRefreshToken ? REFRESH_TOKEN_SECRET : ACCESS_TOKEN_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const parseAuthHeader = (authHeader?: string): string | null => {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}; 