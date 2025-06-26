// src/graphql/typeDefs.ts
import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  # --------------------
  #  Scalar Types & Enums
  # --------------------

  """
  نوع بيانات مخصص للتواريخ والأوقات
  """
  scalar DateTime
  """
  نوع بيانات مخصص لكائنات JSON
  """
  scalar Json

  enum Ownership {
    Original
    Fanfiction
  }
  
  # --------------------
  #  Object Types
  # --------------------

  type User {
    id: ID!
    email: String!
    username: String!
    displayName: String
    bio: String
    avatarUrl: String
    bannerUrl: String
    birthday: DateTime
    gender: String
    socialLinks: Json
    lastActiveAt: DateTime
    createdAt: DateTime!
    
    # --- علاقات ---
    """
    الروايات التي كتبها هذا المستخدم
    """
    novels: [Novel!]
    """
    المراجعات التي قدمها هذا المستخدم
    """
    reviews: [Review!]
  }

  type Novel {
    id: ID!
    title: String!
    synopsis: String!
    coverImageUrl: String
    
    # --- حقول للفرز والفلترة ---
    isFeatured: Boolean!
    viewsCount: Int!
    averageRating: Float!
    ownership: Ownership!
    
    createdAt: DateTime!
    updatedAt: DateTime!

    # --- علاقات ---
    author: User!
    chapters: [Chapter!]
    reviews: [Review!]
    genres: [Genre!]
    contentWarnings: [ContentWarning!]
  }

  type Chapter {
    id: ID!
    title: String!
    chapterNumber: Int!
    content: String!
    wordCount: Int!
    createdAt: DateTime!
  }

  type Review {
    id: ID!
    content: String!
    rating: Int!
    createdAt: DateTime!

    # --- علاقات ---
    author: User!
    novel: Novel!
  }

  type Genre {
    id: ID!
    name: String!
  }

  type ContentWarning {
    id: ID!
    name: String!
  }

  # ناتج عمليات المصادقة الناجحة
  type AuthPayload {
    token: String!
    user: User!
  }

  # ناتج عرض الروايات مع ترقيم الصفحات
  type NovelsPaginated {
      novels: [Novel!]!
      totalCount: Int!
      totalPages: Int!
  }
  
  # --------------------
  #  Input Types
  # --------------------
  input RegisterInput {
      username: String!
      email: String!
      password: String!
  }

  input UpdateUserInput {
      displayName: String
      bio: String
      avatarUrl: String # في البداية نستخدم روابط، لاحقاً يمكن تطويرها لرفع ملفات
      bannerUrl: String
      birthday: DateTime
      gender: String
      socialLinks: Json
  }
  
  input SubmitNovelInput {
      title: String!
      synopsis: String!
      coverImageUrl: String
      ownership: Ownership!
      genreIds: [ID!]! # نرسل مصفوفة من ID التصنيفات
      warningIds: [ID!]
  }

  input AddChapterInput {
      novelId: ID!
      title: String!
      chapterNumber: Int!
      content: String!
  }

  input AddReviewInput {
      novelId: ID!
      content: String!
      rating: Int! # يجب أن يكون بين 1-5 (نتحقق من ذلك في الـ resolver)
  }

  # --------------------
  #  QUERIES
  # --------------------

  type Query {
    # --- User Queries ---
    "جلب بيانات المستخدم الحالي المسجل دخوله"
    me: User
    "جلب ملف شخصي لمستخدم معين بواسطة اسم المستخدم"
    userProfile(username: String!): User

    # --- Novel Queries ---
    "جلب رواية معينة بواسطة الـ ID الخاص بها"
    novel(id: ID!): Novel
    
    "جلب قائمة بالروايات مع دعم للفلترة، الفرز، وترقيم الصفحات"
    novels(
        page: Int = 1
        limit: Int = 9
        sortBy: String # "createdAt", "viewsCount", "averageRating"
        order: String # "asc", "desc"
        filterGenres: [ID!]
        filterOwnership: Ownership
        excludeWarnings: [ID!]
    ): NovelsPaginated!
    
    # --- General Queries ---
    "جلب كل التصنيفات المتاحة"
    allGenres: [Genre!]!
    "جلب كل تحذيرات المحتوى المتاحة"
    allContentWarnings: [ContentWarning!]!
  }

  # --------------------
  #  MUTATIONS
  # --------------------

  type Mutation {
    # --- Authentication ---
    "تسجيل مستخدم جديد"
    register(data: RegisterInput!): AuthPayload!
    
    "تسجيل دخول مستخدم موجود"
    login(email: String!, password: String!): AuthPayload!

    # --- Profile Management ---
    "تحديث الملف الشخصي للمستخدم الحالي"
    updateProfile(data: UpdateUserInput!): User!
    
    # --- Authoring / Content Creation ---
    "تقديم رواية جديدة"
    submitNovel(data: SubmitNovelInput!): Novel!
    
    "إضافة فصل جديد لرواية"
    addChapter(data: AddChapterInput!): Chapter!
    
    # --- Interaction ---
    "إضافة مراجعة وتقييم على رواية"
    addReview(data: AddReviewInput!): Review!
  }
`;