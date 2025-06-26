// src/graphql/resolvers.ts

// -------------------
//  1. Imports
// -------------------
import { IResolvers } from '@graphql-tools/utils';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, User, Novel } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { UserInputError, AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { GraphQLScalarType, Kind } from 'graphql';

// تم تفعيل استيراد الـ Validators
import {
  registerValidator,
  loginValidator,
  updateUserValidator,
  submitNovelValidator,
  addChapterValidator,
  addReviewValidator
} from './validators';

// -------------------
//  2. Interfaces & Types
// -------------------
interface Context {
  prisma: PrismaClient;
  userId: string | null;
}

// -------------------
//  3. Constants
// -------------------
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-for-dev';

// =================================================================
//  RESOLVERS
// =================================================================

export const resolvers: IResolvers = {
  // -------------------
  //  Scalar Resolvers (For new custom types like DateTime and Json)
  // -------------------
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'A custom date-time string in ISO 8601 format',
    serialize(value: any) {
      if (value instanceof Date) {
        return value.toISOString(); // Convert outgoing Date to ISOString
      }
      return null;
    },
    parseValue(value: any) {
      if (typeof value === 'string' || typeof value === 'number') {
        return new Date(value); // Convert incoming ISOString or number to Date
      }
      return null;
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        return new Date(ast.value); // Convert AST string to Date
      }
      return null;
    },
  }),

  Json: new GraphQLScalarType({
    name: 'Json',
    description: 'A custom JSON object',
    serialize(value: any) {
      return value; // value sent to the client
    },
    parseValue(value: any) {
      return value; // value from the client
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        return JSON.parse(ast.value);
      }
      return null;
    },
  }),


  // -------------------
  //  QUERIES - For fetching data
  // -------------------
  Query: {
    // Fetches the currently logged-in user
    me: (_parent, _args, context: Context): Promise<User | null> => {
      if (!context.userId) return null; // Return null instead of throwing an error for a smoother frontend experience
      return context.prisma.user.findUnique({ where: { id: context.userId } });
    },
    
    // Fetches a user's public profile by their username
    userProfile: (_parent, { username }: { username: string }, context: Context) => {
      return context.prisma.user.findUnique({ where: { username } });
    },
    
    // Fetches a single novel by its ID
    novel: (_parent, { id }: { id: string }, context: Context) => {
      // You might want to increment a view count here in the future
      // await context.prisma.novel.update({ where: { id }, data: { viewsCount: { increment: 1 } } });
      return context.prisma.novel.findUnique({ where: { id } });
    },
    
    // Fetches a paginated list of novels with advanced filtering and sorting
    novels: async (_parent, args, context: Context) => {
        const { page = 1, limit = 9, sortBy, order = 'desc', filterGenres, filterOwnership, excludeWarnings } = args;

        const where: Prisma.NovelWhereInput = {
            AND: [
                filterGenres && filterGenres.length > 0 ? { genres: { some: { id: { in: filterGenres } } } } : {},
                filterOwnership ? { ownership: filterOwnership } : {},
                excludeWarnings && excludeWarnings.length > 0 ? { contentWarnings: { none: { id: { in: excludeWarnings } } } } : {},
            ],
        };

        const novels = await context.prisma.novel.findMany({
            where,
            orderBy: sortBy ? { [sortBy]: order } : { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });

        const totalCount = await context.prisma.novel.count({ where });

        return {
            novels,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
        };
    },
    
    // Fetches all available genres
    allGenres: (_parent, _args, context: Context) => {
        return context.prisma.genre.findMany();
    },

    // Fetches all available content warnings
    allContentWarnings: (_parent, _args, context: Context) => {
        return context.prisma.contentWarning.findMany();
    }
  },

  // -------------------
  //  MUTATIONS - For modifying data (with validation enabled)
  // -------------------
  Mutation: {
   register: async (_parent, { data }, context: Context) => {
     try {
       registerValidator.parse(data);
       const { email, username, password } = data;
       const hashedPassword = await bcrypt.hash(password, 10);
       
       const user = await context.prisma.user.create({
         data: { email, username, password: hashedPassword },
       });
       
       const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
       return { token, user };

     } catch (error) {
       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
         const target = (error.meta?.target as string[]) || [];
         throw new UserInputError(`هذا ${target.includes('email') ? 'البريد الإلكتروني' : 'اسم المستخدم'} مستخدم بالفعل.`);
       }
       throw new UserInputError(error.message);
     }
   },

    login: async (_parent, { email, password }, context: Context) => {
      loginValidator.parse({ email, password });
      const user = await context.prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AuthenticationError('بريد إلكتروني أو كلمة مرور غير صالحة.');
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return { token, user };
    },
    
    updateProfile: async (_parent, { data }, context: Context) => {
      if (!context.userId) throw new AuthenticationError('يجب عليك تسجيل الدخول للقيام بذلك.');
      updateUserValidator.parse(data);
      return context.prisma.user.update({
          where: { id: context.userId },
          data: data,
      });
    },
    
    submitNovel: async (_parent, { data }, context: Context) => {
      if (!context.userId) throw new AuthenticationError('يجب عليك تسجيل الدخول لإنشاء رواية.');
      submitNovelValidator.parse(data);
      const { title, synopsis, coverImageUrl, ownership, genreIds, warningIds } = data;

      return context.prisma.novel.create({
          data: {
              title,
              synopsis,
              coverImageUrl,
              ownership,
              author: { connect: { id: context.userId } },
              genres: { connect: genreIds.map((id: string) => ({ id })) },
              contentWarnings: warningIds ? { connect: warningIds.map((id: string) => ({ id })) } : undefined,
          }
      });
    },

    addChapter: async (_parent, { data }, context: Context) => {
        if (!context.userId) throw new AuthenticationError('يجب عليك تسجيل الدخول.');
        addChapterValidator.parse(data);
        const { novelId, title, content, chapterNumber } = data;
        
        const novel = await context.prisma.novel.findFirst({ where: { id: novelId, authorId: context.userId }});
        if (!novel) throw new ForbiddenError('يمكنك إضافة فصول إلى رواياتك الخاصة فقط.');
        
        return context.prisma.chapter.create({
            data: {
                title,
                content,
                chapterNumber,
                wordCount: content.split(' ').filter(String).length,
                novel: { connect: { id: novelId } },
            }
        });
    },

    addReview: async (_parent, { data }, context: Context) => {
        if (!context.userId) throw new AuthenticationError('يجب عليك تسجيل الدخول لترك مراجعة.');
        addReviewValidator.parse(data);
        const { novelId, content, rating } = data;
        
        // ملاحظة: تحديث `averageRating` للرواية هو عملية أكثر تعقيدًا تتطلب transaction
        // سيتم إنشاء المراجعة هنا كخطوة أولى.
        return context.prisma.review.create({
            data: {
                content,
                rating,
                novel: { connect: { id: novelId } },
                author: { connect: { id: context.userId } }
            }
        });
    }
  },

  // -------------------
  //  FIELD RESOLVERS - For resolving relationships
  // -------------------
  User: {
    novels: (parent: User, _args, context: Context) => {
      return context.prisma.user.findUnique({ where: { id: parent.id } }).novels();
    },
    reviews: (parent: User, _args, context: Context) => {
        return context.prisma.user.findUnique({ where: { id: parent.id } }).reviews();
    },
  },
  
  Novel: {
    author: (parent: Novel, _args, context: Context) => {
      return context.prisma.novel.findUnique({ where: { id: parent.id } }).author();
    },
    chapters: (parent: Novel, _args, context: Context) => {
      return context.prisma.novel.findUnique({ where: { id: parent.id } }).chapters();
    },
    reviews: (parent: Novel, _args, context: Context) => {
      return context.prisma.novel.findUnique({ where: { id: parent.id } }).reviews();
    },
    genres: (parent: Novel, _args, context: Context) => {
      return context.prisma.novel.findUnique({ where: { id: parent.id } }).genres();
    },
    contentWarnings: (parent: Novel, _args, context: Context) => {
      return context.prisma.novel.findUnique({ where: { id: parent.id } }).contentWarnings();
    },
  },

  Review: {
      author: (parent: { authorId: string }, _args, context: Context) => {
          return context.prisma.user.findUnique({ where: { id: parent.authorId } });
      },
      novel: (parent: { novelId: string }, _args, context: Context) => {
          return context.prisma.novel.findUnique({ where: { id: parent.novelId } });
      }
  }
};