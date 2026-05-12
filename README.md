# ⚡ CyberPhysics — Full Stack Setup

## 📁 Folder Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login + Google OAuth
│   │   ├── register/page.tsx       # Register form
│   │   └── forgot-password/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │   │   ├── register/route.ts        # POST /api/auth/register
│   │   │   ├── forgot-password/route.ts # POST /api/auth/forgot-password
│   │   │   └── reset-password/route.ts  # POST /api/auth/reset-password
│   │   ├── admin/
│   │   │   ├── stats/route.ts      # GET admin stats
│   │   │   ├── users/route.ts      # GET/PATCH/DELETE users
│   │   │   ├── questions/route.ts  # CRUD questions
│   │   │   └── categories/route.ts # CRUD categories
│   │   └── game/
│   │       ├── questions/route.ts  # GET game questions
│   │       └── answer/route.ts     # POST submit answer
│   ├── admin/page.tsx              # Admin dashboard
│   ├── dashboard/page.tsx          # Student dashboard
│   ├── game/page.tsx               # XP Game (Duolingo style)
│   ├── layout.tsx
│   ├── page.tsx                    # Auto-redirect
│   └── globals.css
├── lib/
│   ├── mongodb.ts                  # DB connection (cached)
│   ├── auth-options.ts             # NextAuth config
│   ├── auth.ts                     # Auth helpers
│   └── email.ts                    # Nodemailer (Gmail)
├── models/
│   ├── User.ts                     # User schema
│   ├── Category.ts                 # Category schema
│   ├── Question.ts                 # Question schema
│   └── Payment.ts                  # Payment schema
└── types/
    ├── index.ts
    └── next-auth.d.ts              # Session type extension
```

## 🚀 Setup Steps

### 1. Dependencies суулгах
```bash
npm install
```

### 2. `.env.local` тохируулах
```env
MONGODB_URI=mongodb+srv://cyber-physics:053017@cluster0.jzoud6c.mongodb.net/cyberphysics?...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any_long_random_string_here

# Google OAuth (console.cloud.google.com)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Gmail (2FA идэвхтэй + App Password үүсгэх)
GMAIL_USER=your@gmail.com
GMAIL_PASS=xxxx xxxx xxxx xxxx

ADMIN_EMAIL=admin@gmail.com
ADMIN_PASS=TCB-757
```

### 3. DB seed хийх (анхны категори + асуултууд)
```bash
npm install tsx dotenv -D
npx tsx scripts/seed.ts
```

### 4. Dev server ажиллуулах
```bash
npm run dev
```

## 🔐 Admin Login
- URL: `http://localhost:3000/login`
- Email: `admin@gmail.com`
- Password: `TCB-757`
- Admin dashboard: автоматаар `/admin` руу чиглэнэ

## 🌐 Google OAuth Setup
1. [console.cloud.google.com](https://console.cloud.google.com) → New Project
2. APIs & Services → Credentials → Create OAuth Client ID
3. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Client ID & Secret-ийг `.env.local`-д оруулах

## 📧 Gmail App Password
1. Gmail → Account → Security → 2-Step Verification идэвхжүүлэх
2. App passwords → "Mail" → Generate
3. 16 тэмдэгтийн паролыг `GMAIL_PASS`-д оруулах

## 🏗️ Hosting (Vercel)
```bash
npm i -g vercel
vercel
```
Vercel Dashboard → Environment Variables дээр `.env.local`-ын утгуудыг оруулах.
`NEXTAUTH_URL`-ийг production URL-оор солих: `https://yourapp.vercel.app`

## 🎮 XP Game URLs
- `/game?cat=CATEGORY_ID&level=1`
- Category ID-г MongoDB-с авах эсвэл seed script-ийн ID ашиглах
# newcybert
