import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    try {
        // In a real app, you would validate the JWT token here
        const token = authHeader.split(' ')[1];
        // For demo purposes, we'll just check if it's a valid format
        if (!token || token.length < 10) {
            throw new Error('Invalid token format');
        }

        // Mock user data - in a real app, this would come from the JWT
        req.user = {
            id: 'admin',
            role: 'admin'
        };

        next();
    } catch (error) {
        logger.error('Authentication failed:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Requires admin privileges' });
    }
    next();
}; 