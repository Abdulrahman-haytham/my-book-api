// src/graphql/validators.ts
import { z } from 'zod';

// قاعدة التحقق لعملية التسجيل وتسجيل الدخول
export const authValidator = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  password: z.string().min(8, { message: "يجب أن تكون كلمة المرور 8 أحرف على الأقل" }),
});

// قاعدة التحقق لعملية إضافة كتاب
export const addBookValidator = z.object({
  title: z.string().min(1, { message: "عنوان الكتاب لا يمكن أن يكون فارغاً" }),
  author: z.string().min(1, { message: "اسم المؤلف لا يمكن أن يكون فارغاً" }),
  coverImage: z.string().url({ message: "رابط الصورة غير صالح" }).optional(), // اختياري ولكن يجب أن يكون URL صالح
});

// قاعدة التحقق لعملية تحديث كتاب
export const updateBookValidator = z.object({
  id: z.string().cuid({ message: "معرف الكتاب غير صالح" }), // CUID هو نوع ID الذي يولده Prisma
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  status: z.enum(['TO_READ', 'READING', 'FINISHED']).optional(),
  review: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

// قاعدة التحقق لإضافة ملاحظة
export const noteValidator = z.object({
  bookId: z.string().cuid(),
  content: z.string().min(1, { message: "محتوى الملاحظة لا يمكن أن يكون فارغاً" }),
});