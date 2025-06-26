# My Book API - واجهة برمجة تطبيقات لمشروع "كتابي"

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white) ![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![GraphQL](https://img.shields.io/badge/-GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

مرحبًا بك في الواجهة الخلفية (Backend) لمشروع "كتابي" (My Book). هذا المشروع عبارة عن API قوية ومبنية باستخدام GraphQL، وهي مصممة لتكون بمثابة المحرك لمنصة اجتماعية لنشر وقراءة الروايات.

---

## 🚀 الميزات الرئيسية

- **نظام مصادقة متكامل:** تسجيل مستخدمين جدد، تسجيل الدخول، وإدارة الجلسات باستخدام توكن JWT.
- **إدارة الملفات الشخصية:** يمكن للمستخدمين تخصيص ملفاتهم الشخصية بالصور، السيرة الذاتية، والروابط الاجتماعية.
- **نظام نشر المحتوى:** يمكن للكتّاب (المؤلفين) نشر رواياتهم وإضافة فصول جديدة لها.
- **عرض وتصفح متقدم:** واجهة API قوية تتيح تصفح الروايات مع دعم كامل للـ:
  - **ترقيم الصفحات (Pagination)** لعرض النتائج بشكل منظم.
  - **الفرز (Sorting)** حسب الأحدث، الأعلى تقييمًا، الأكثر مشاهدة، وغيرها.
  - **الفلترة المتقدمة (Filtering)** حسب التصنيف، نوع الملكية، مع إمكانية استثناء المحتوى غير المرغوب فيه.
- **التفاعل الاجتماعي:** نظام لإضافة المراجعات والتقييمات على الروايات.
- **أمان عالي:** طبقة تحقق من صحة المدخلات باستخدام `Zod` لضمان سلامة البيانات قبل وصولها إلى قاعدة البيانات.
- **معالجة أخطاء احترافية:** نظام مركزي لتنسيق الأخطاء وإخفاء التفاصيل الحساسة في بيئة الإنتاج.

---

## 🛠️ التقنيات المستخدمة

- **البيئة التشغيلية:** [Node.js](https://nodejs.org/)
- **إطار العمل:** [Express.js](https://expressjs.com/)
- **لغة البرمجة:** [TypeScript](https://www.typescriptlang.org/)
- **لغة الاستعلام (API):** [GraphQL](https://graphql.org/) مع [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- **ORM وقاعدة البيانات:**
  - [Prisma](https://www.prisma.io/) كطبقة وصول لقاعدة البيانات (ORM).
  - [PostgreSQL](https://www.postgresql.org/) كقاعدة بيانات علائقية.
- **المصادقة:** [JWT (JSON Web Tokens)](https://jwt.io/)
- **التحقق من المدخلات:** [Zod](https://zod.dev/)
- **الأمان:** [bcrypt](https://www.npmjs.com/package/bcrypt) لتجزئة كلمات المرور.

---

## ⚙️ متطلبات التشغيل

- [Node.js](https://nodejs.org/) (يفضل إصدار 18 أو أحدث)
- [npm](https://www.npmjs.com/) 
- قاعدة بيانات [PostgreSQL](https://www.postgresql.org/) تعمل على جهازك أو على خدمة سحابية.

---

## 🚀 كيفية تشغيل المشروع محليًا

اتبع الخطوات التالية لتشغيل المشروع على جهازك:

1.  **نسخ المستودع (Clone the repository):**
    ```bash
    git clone https://github.com/Abdulrahman-haytham/my-book-api/tree/master
    cd my-book-api
    ```

2.  **تثبيت الاعتماديات:**
    ```bash
    npm install
    ```

3.  **إعداد متغيرات البيئة:**
    -   قم بإنشاء ملف `.env` في المجلد الرئيسي للمشروع.
    -   انسخ محتوى ملف `.env.example` (إذا كان موجودًا) أو أضف المتغيرات التالية:
        ```env
        # رابط الاتصال بقاعدة بيانات PostgreSQL
        DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/DATABASENAME?schema=public"

        # مفتاح سري لتوقيع توكن JWT (استخدم سلسلة نصية عشوائية وقوية)
        JWT_SECRET="your-super-secret-and-strong-jwt-key"
        ```

4.  **تطبيق تهجير قاعدة البيانات (Database Migration):**
    -   سيقوم هذا الأمر بإنشاء الجداول اللازمة في قاعدة بياناتك بناءً على مخطط Prisma.
    ```bash
    npx prisma migrate dev
    ```

5.  **تشغيل خادم التطوير:**
    ```bash
    npm run dev
    ```

6.  **فتح GraphQL Playground:**
    -   بعد تشغيل الخادم بنجاح، افتح متصفحك وتوجه إلى [http://localhost:4000/graphql](http://localhost:4000/graphql) للبدء في إرسال الـ Queries والـ Mutations.

---

## 🗂️ هيكل المشروع

```
.
├── prisma/               # كل ما يتعلق بـ Prisma (المخطط، التهجيرات)
│   └── schema.prisma     # المخطط الرئيسي لقاعدة البيانات
├── src/                  # الكود المصدري للمشروع
│   ├── graphql/          # قلب الـ API
│   │   ├── resolvers.ts    # منطق التنفيذ
│   │   ├── typeDefs.ts     # تعريف مخطط GraphQL
│   │   └── validators.ts   # التحقق من المدخلات باستخدام Zod
│   ├── utils/            # دوال مساعدة
│   │   └── auth.ts         # دوال المصادقة
│   ├── index.ts          # نقطة انطلاق الخادم وإعداده
│   └── prisma.ts         # إعداد عميل Prisma
├── .env                  # متغيرات البيئة (لا يتم رفعه على Git)
├── package.json
└── tsconfig.json
```
---


