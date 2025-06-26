// src/utils/auth.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-for-dev';

interface TokenPayload {
  userId: string;
}

export function getUserId(token: string): string | null {
  if (token) {
    const realToken = token.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(realToken, JWT_SECRET) as TokenPayload;
      return decoded.userId;
    } catch (err) {
      // التوكن غير صالح (منتهي الصلاحية أو تم التلاعب به)
      return null;
    }
  }
  // لا يوجد توكن
  return null;
}