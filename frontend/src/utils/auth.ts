import { sign, verify } from 'jsonwebtoken';
import { JWTPayload } from '@shared/types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key';

export const generateTokens = (payload: JWTPayload) => {
    const accessToken = sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    return {
        accessToken,
        refreshToken
    };
};

export const verifyToken = (token: string, isRefreshToken = false): JWTPayload | null => {
    try {
        const secret = isRefreshToken ? REFRESH_TOKEN_SECRET : JWT_SECRET;
        const decoded = verify(token, secret) as JWTPayload;
        return decoded;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}; 