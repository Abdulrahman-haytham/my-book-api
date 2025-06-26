// src/index.ts

// -------------------
//  1. استيراد المكتبات
// -------------------
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import dotenv from 'dotenv';
import http from 'http';
import { GraphQLError } from 'graphql'; // مهم لاستخدامه في formatError

// -------------------
//  2. استيراد مكونات التطبيق
// -------------------
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { prisma } from './prisma';
import { getUserId } from './utils/auth';

// -------------------
//  3. تهيئة أولية
// -------------------
// تحميل المتغيرات من ملف .env
dotenv.config();

/**
 * دالة رئيسية غير متزامنة لبدء تشغيل الخادم.
 */
async function startApolloServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // -------------------
  //  4. إعداد Apollo Server
  // -------------------
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    /**
     * دالة الـ context لتوفير الوصول إلى prisma و userId لكل resolver.
     */
    context: ({ req }) => {
      const token = req.headers.authorization || '';
      const userId = getUserId(token);
      return {
        prisma,
        userId,
      };
    },

    /**
     *  === معالج الأخطاء المركزي ===
     * هذه الدالة تعترض كل خطأ قبل إرساله للعميل.
     * تتيح لنا التحكم الكامل في شكل الخطأ النهائي.
     */
    formatError: (error: GraphQLError) => {
      // طباعة الخطأ الكامل في الكونسول (للمطورين فقط)
      // هذا يساعد في تصحيح الأخطاء أثناء التطوير.
      console.error("--- GraphQL Error ---");
      console.error("Message:", error.message);
      console.error("Code:", error.extensions?.code);
      console.error("Path:", error.path);
      console.error("---------------------");

      // إذا كان الخطأ هو من الأنواع التي نثق بها (مثل UserInputError, AuthenticationError)
      // فإن Apollo يقوم بتنسيقها بشكل جيد، لذا نتركها كما هي.
      if (
        error.extensions?.code === 'BAD_USER_INPUT' ||
        error.extensions?.code === 'UNAUTHENTICATED' ||
        error.extensions?.code === 'FORBIDDEN'
      ) {
        return {
          message: error.message,
          locations: error.locations,
          path: error.path,
          extensions: { code: error.extensions.code },
        };
      }

      // إذا كان الخطأ غير متوقع (خطأ في السيرفر، مشكلة في قاعدة البيانات، إلخ)
      // لا نُسرّب تفاصيله الحساسة في بيئة الإنتاج (Production)
      if (process.env.NODE_ENV === 'production') {
        // أرسل رسالة عامة وآمنة للمستخدم
        return new GraphQLError('Sorry, something went wrong on our end.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // في وضع التطوير (Development)، أرسل الخطأ كاملاً للمساعدة في التصحيح
      return error;
    },
  });

  // -------------------
  //  5. ربط Apollo مع Express
  // -------------------
  await server.start();
  server.applyMiddleware({
    app,
    path: '/graphql',
  });

  // -------------------
  //  6. تشغيل الخادم
  // -------------------
  const PORT = process.env.PORT || 4000;
  
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));
  
  console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
}

// -------------------
//  7. بدء التطبيق
// -------------------
startApolloServer().catch(error => {
  console.error('💥 Failed to start server:', error);
  process.exit(1); // إنهاء العملية إذا فشل بدء التشغيل
});