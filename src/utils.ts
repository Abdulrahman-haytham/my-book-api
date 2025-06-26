// src/utils.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

interface TokenPayload {
  userId: string;
}

export function getUserId(token: string): string | null {
  if (token) {
    // إزالة كلمة "Bearer " من بداية التوكن
    const realToken = token.replace('Bearer ', '');
    try {
      // التحقق من التوكن وفك تشفيره
      const decoded = jwt.verify(realToken, JWT_SECRET) as TokenPayload;
      return decoded.userId;
    } catch (err) {
      // إذا كان التوكن غير صالح أو منتهي الصلاحية
      return null;
    }
  }
  return null;
}