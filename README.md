# 🗣️ Hitori Talk

> AI-powered Japanese conversation practice app for IT professionals

Ứng dụng luyện nói tiếng Nhật với AI, được thiết kế đặc biệt cho nhân viên IT Việt Nam làm việc trong môi trường Nhật Bản.

## ✨ Features

### 🎯 Core Features
- **AI Conversation Partner:** Luyện hội thoại với AI thông minh
- **Unified Learning Mode (All-in-One):**
  - 💬 Trả lời tiếp tục hội thoại tự nhiên
  - ✏️ Chỉnh sửa lỗi ngay lập tức (nếu có)
  - 🇻🇳 Dịch tiếng Việt (ẩn mặc định, toggle khi cần)
- **Voice Input/Output:**
  - 🎤 Speech-to-Text (Web Speech API)
  - 🔊 Text-to-Speech with Japanese voices
- **Topic Library:**
  - 📚 Sẵn có: Daily Standup, Code Review, Bug Reporting, etc.
  - ✏️ Custom topics: Tự tạo chủ đề riêng

### 🎮 Gamification
- **XP System:** Kiếm điểm qua mỗi cuộc hội thoại
- **Streak Tracking:** Duy trì chuỗi ngày học liên tiếp
- **Level Progression:** Lên level, unlock thêm features
- **Achievements:** Huy hiệu cho các milestone quan trọng

### 📊 Learning Analytics
- **Progress Dashboard:** Xem tiến độ học tập
- **Mistake Log:** Theo dõi lỗi thường gặp
- **Improvement Trends:** Biểu đồ cải thiện theo thời gian

## 🏗️ Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **UI/Design:** Pencil.dev MCP + Lunaris design system, Tailwind CSS + shadcn/ui
- **Backend:** Vercel Serverless Functions
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **AI:** OpenRouter
- **Voice:** Web Speech API (browser-native STT/TTS)
- **Deployment:** Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17+ hoặc 20+
- pnpm (hoặc npm/yarn)
- Supabase account
- OpenRouter API key

### Installation

```bash
# Clone repository
git clone <your-repo-url> hitori-talk
cd hitori-talk

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local với API keys của bạn

# Setup database
pnpm run db:setup

# Run development server
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000)

## 🎨 Project Structure

```
hitori-talk/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Main app routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── lib/                   # Utilities
│   ├── supabase/         # Database client
│   ├── ai/               # OpenRouter integration
│   └── ...
├── docs/                  # Documentation
├── .claude/              # Claude Code configuration
│   ├── skills/           # Custom skills
│   ├── hooks/            # Git hooks
│   └── prompts/          # Code templates
└── supabase/             # Database migrations
```

## 🛠️ Development

### Run Tests
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:e2e          # E2E tests with Playwright
```

### Code Quality
```bash
pnpm lint              # ESLint check
pnpm lint:fix          # Auto-fix issues
pnpm format            # Format with Prettier
pnpm type-check        # TypeScript check
```

### Database
```bash
pnpm db:setup          # Initial setup + migrations
pnpm db:seed           # Seed sample data
pnpm db:migrate        # Run migrations
pnpm db:reset          # Reset database
```

## 🌐 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

Or connect GitHub repository to Vercel for auto-deployment.

### Environment Variables

Required in production:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
NEXT_PUBLIC_APP_URL=
```

### Development Workflow

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Make changes
3. Run tests: `pnpm test`
4. Commit: `git commit -m "Add amazing feature"`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

## 📝 License

[MIT License](./LICENSE)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [OpenRouter](https://openrouter.ai/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel](https://vercel.com/)

---

**Built with ❤️ for Vietnamese IT professionals learning Japanese**

## 📞 Contact

- Issues: [GitHub Issues](https://github.com/yourusername/hitori-talk/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/hitori-talk/discussions)

---

