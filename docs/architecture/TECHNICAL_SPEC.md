# Technical Specification - Hitori Talk

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Next.js UI  │  │  Web Speech  │  │  IndexedDB   │      │
│  │              │  │  API (STT/   │  │  (Cache)     │      │
│  │              │  │  TTS)        │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Vercel Edge Network                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js App (App Router)                │   │
│  │  • SSR/SSG Pages                                     │   │
│  │  • API Routes (Serverless Functions)                 │   │
│  │  • Middleware (Auth check)                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│      Supabase            │  │     OpenRouter API       │
│  • PostgreSQL            │  │  • Claude/GPT-4          │
│  • Auth                  │  │  • Streaming response    │
│  • Real-time (future)    │  │                          │
│  • Storage (future)      │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

### 1.2 Technology Choices & Rationale

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Frontend Framework | Next.js 14+ (App Router) | SSR for SEO, built-in API routes, Vercel optimization |
| UI Library | React 18+ | Component reusability, ecosystem |
| Styling | Tailwind CSS + shadcn/ui | Rapid development, consistent design |
| State Management | Zustand or React Context | Lightweight, sufficient for MVP |
| Database | Supabase (PostgreSQL) | Free tier generous, real-time capabilities, easy auth |
| Auth | Supabase Auth | Built-in, supports email/OAuth |
| AI Provider | OpenRouter | Unified API, cost comparison, fallback models |
| STT | Web Speech API | Free, browser-native, good Japanese support |
| TTS | Web Speech API | Free, browser-native, multiple Japanese voices |
| Deployment | Vercel | Zero-config, edge functions, Next.js native |

## 2. Database Schema

### 2.1 Supabase Tables

**users** (extends Supabase auth.users)
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  jlpt_level TEXT CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  user_level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  last_practice_date DATE,
  placement_test_completed BOOLEAN DEFAULT FALSE,
  placement_test_result JSONB,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for leaderboards (future)
CREATE INDEX idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX idx_profiles_streak ON public.profiles(streak_count DESC);
```

**topics**
```sql
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT, -- Brief description of the topic
  category TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by_user_id UUID REFERENCES public.profiles(id),

  -- Context Generation Template
  context_generation_prompt TEXT, -- AI prompt template to generate dynamic context AND ai_role for each conversation

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_topics_category ON public.topics(category);
```

**Notes:**
- Context AND ai_role are dynamically generated per conversation
- User role is always "developer" (IT professional)
- Topics are just templates for context generation

**Example data:**
```json
{
  "title": "Code Review Discussion",
  "description": "Practice discussing code review feedback with colleagues",
  "category": "technical",
  "context_generation_prompt": "Generate a specific code review scenario. Include:\n1. AI role (senior_developer, team_lead, or peer_developer) based on scenario\n2. User role is always 'developer'\n3. What code/feature is being reviewed (e.g., React component, API endpoint, database query)\n4. 2-3 specific feedback points to discuss\n5. Expected discussion topics in Japanese and Vietnamese\n6. 3-4 example phrases with romaji and Vietnamese translation\n\nMake each scenario unique and realistic for IT work. AI role should fit the scenario naturally. Adjust language complexity based on user's JLPT level."
}
```

**How context generation works:**
1. User selects "Code Review Discussion" topic
2. User clicks "Bắt đầu"
3. AI receives `context_generation_prompt` and generates:
   - Unique scenario
   - Appropriate ai_role for this scenario
   - Full context details
4. Generated context (including ai_role) stored in `conversations.context_details`
5. Same topic can generate different scenarios AND ai_roles each time

**conversations**
```sql
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  topic_id UUID REFERENCES public.topics(id),

  -- Dynamic AI-Generated Context (unique per conversation)
  context_scenario TEXT, -- Brief scenario description (e.g., "Reviewing React performance optimization code")
  context_details JSONB, -- Full generated context: { ai_role, user_role, description_vi, description_ja, expected_topics[], example_phrases[] }

  duration_seconds INTEGER,
  message_count INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  mistakes_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'completed', 'abandoned')) DEFAULT 'active',
  metadata JSONB DEFAULT '{}', -- User level tại thời điểm practice, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_conversations_user ON public.conversations(user_id, created_at DESC);
```

**Notes:**
- Removed `mode` column - app now uses unified mode only
- Added `context_scenario` and `context_details` - AI generates unique context for each conversation
- Same topic can have different contexts in different conversations

**Example `context_details` JSONB:**
```json
{
  "ai_role": "senior_developer",
  "user_role": "developer",
  "description_vi": "Bạn đang review code cho một React component xử lý form validation. Senior developer chỉ ra một số vấn đề về performance và UX.",
  "description_ja": "フォームバリデーションを処理するReactコンポーネントのコードレビューをしています。",
  "expected_topics": [
    { "ja": "パフォーマンスの問題", "vi": "Vấn đề performance" },
    { "ja": "バリデーションロジック", "vi": "Logic validation" },
    { "ja": "ユーザー体験", "vi": "Trải nghiệm người dùng" }
  ],
  "example_phrases": [
    { "ja": "このコードについて質問があります", "romaji": "kono koodo ni tsuite shitsumon ga arimasu", "vi": "Tôi có câu hỏi về đoạn code này" },
    { "ja": "なぜこの方がいいですか", "romaji": "naze kono hou ga ii desu ka", "vi": "Tại sao cách này tốt hơn?" },
    { "ja": "修正します", "romaji": "shuusei shimasu", "vi": "Tôi sẽ sửa" }
  ]
}
```

**Note:** `user_role` is always "developer" - user consistently plays an IT professional role across all conversations.

**messages**
```sql
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content_text TEXT NOT NULL,
  content_audio_url TEXT, -- URL to Supabase Storage (future)
  corrections JSONB, -- Array: [{ type, original, corrected, explanation }]
  translation TEXT, -- Vietnamese translation (for assistant messages)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
```

**Note:**
- Added `translation` field for Vietnamese translation
- `corrections` format: `[{ type: string, original: string, corrected: string, explanation: string }]`

**achievements**
```sql
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- e.g., 'first_conversation', 'streak_7'
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or icon name
  xp_reward INTEGER DEFAULT 0,
  requirement JSONB NOT NULL, -- Condition to unlock
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.user_achievements (
  user_id UUID REFERENCES public.profiles(id),
  achievement_id UUID REFERENCES public.achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);
```

**mistake_log** (for learning analytics)
```sql
CREATE TABLE public.mistake_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  conversation_id UUID REFERENCES public.conversations(id),
  message_id UUID REFERENCES public.messages(id),
  mistake_type TEXT, -- 'grammar', 'vocabulary', 'particle', 'conjugation'
  original_text TEXT,
  corrected_text TEXT,
  explanation TEXT,
  grammar_point TEXT, -- e.g., 'te-form', 'は vs が'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mistake_log_user ON public.mistake_log(user_id, created_at DESC);
CREATE INDEX idx_mistake_log_type ON public.mistake_log(user_id, mistake_type);
```

### 2.2 Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_log ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Similar policies for conversations, messages, etc.
```

## 3. API Design

### 3.1 API Routes Structure

```
/api
  /auth
    /signup (POST)
    /login (POST)
    /logout (POST)
  /onboarding
    /placement-test (POST) - Start placement test conversation
  /topics
    /list (GET) - Get topics by level/category
    /create (POST) - Create custom topic
  /conversations
    /start (POST) - Start new conversation
    /[id]/message (POST) - Send user message, get AI response
    /[id]/complete (POST) - End conversation, calculate XP
  /profile
    /me (GET) - Get current user profile
    /update (PATCH) - Update profile
    /stats (GET) - Get user statistics
  /achievements
    /check (POST) - Check and unlock achievements
```

### 3.2 Key API Endpoints

#### POST /api/conversations/start
**Request:**
```json
{
  "topicId": "uuid"
}
```

**Response:**
```json
{
  "conversationId": "uuid",
  "topic": {
    "title": "Daily Standup",
    "description": "..."
  },
  "aiGreeting": {
    "response": "おはようございます！今日の進捗を教えてください。",
    "translation": "Chào buổi sáng! Hãy cho tôi biết tiến độ hôm nay của bạn.",
    "corrections": null
  }
}
```

#### POST /api/conversations/[id]/message
**Request:**
```json
{
  "userMessage": "今日はログイン機能のバグを直すました。"
}
```

**Response (Unified - Always includes all 3 components):**
```json
{
  "aiResponse": {
    "response": "お疲れ様です！テストはもう終わりましたか？",
    "corrections": [
      {
        "type": "grammar",
        "original": "直すました",
        "corrected": "直しました",
        "explanation": "Lỗi conjugation: 直す (dict form) + ました ❌. Đúng: 直し (masu-stem) + ました ✅"
      }
    ],
    "translation": "Cảm ơn bạn đã cố gắng! Đã test xong chưa?"
  },
  "xpEarned": 10
}
```

**Response (No errors):**
```json
{
  "aiResponse": {
    "response": "素晴らしいですね！どのくらい時間がかかりましたか？",
    "corrections": null,
    "translation": "Tuyệt vời! Mất bao lâu để fix?"
  },
  "xpEarned": 10
}
```

**Note:**
- `corrections`: Array of corrections (null/[] if no errors)
- `translation`: Vietnamese translation (always present, never null)
- Translation is collapsed/hidden by default in UI

### 3.3 OpenRouter Integration

**Model Selection Strategy:**
```typescript
const MODEL_CONFIG = {
  primary: 'stepfun/step-3.5-flash:free',
  fallback: 'nvidia/nemotron-3-super-120b-a12b:free',
};

// Streaming for better UX
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: MODEL_CONFIG.primary,
    messages: conversationHistory,
    stream: true, // Enable streaming
    temperature: 0.7,
    max_tokens: 500,
  }),
});
```

## 4. AI Prompt Engineering

### 4.1 System Prompt Templates

**Natural Conversation Mode:**
```
You are a friendly Japanese colleague having a casual conversation with an IT professional.

User's Japanese level: {jlpt_level}
Topic: {topic_title}
Context: {topic_description}

Guidelines:
- Respond naturally in Japanese
- Match the user's proficiency level
- Use vocabulary and grammar appropriate for {jlpt_level}
- Keep responses concise (1-3 sentences)
- Ask follow-up questions to continue the conversation
- Use a mix of casual and polite forms appropriate for workplace

DO NOT correct grammar unless explicitly asked.
Focus on maintaining natural conversation flow.
```

**Correction Mode:**
```
You are a Japanese language tutor helping an IT professional improve their Japanese.

User's Japanese level: {jlpt_level}
Topic: {topic_title}

Your dual role:
1. Analyze the user's message for errors
2. Continue the conversation naturally

Response format:
1. If there are mistakes:
   - Point them out gently
   - Explain why
   - Provide the correct version
   - Then continue the conversation

2. If no significant mistakes:
   - Acknowledge the good usage
   - Continue the conversation

Mistake categories to check:
- Grammar (conjugation, particles, word order)
- Vocabulary (word choice, appropriateness)
- Politeness level (適切な敬語)
- Natural phrasing (ネイティブっぽい表現)

Keep corrections constructive and encouraging.
```

### 4.2 Prompt Context Management

```typescript
interface ConversationContext {
  systemPrompt: string;
  conversationHistory: Message[];
  userProfile: {
    jlptLevel: string;
    commonMistakes: string[];
    vocabulary: string[];
  };
  topic: Topic;
}

// Limit context to last N messages to save tokens
const MAX_HISTORY_LENGTH = 10;
```

## 5. Performance Optimization

### 5.1 Cost Optimization
- **Web Speech API:** Free STT/TTS reduces major cost
- **Token usage:** Limit conversation history, compress old messages
- **Model selection:** Use cheaper models for simple tasks
- **Caching:** Cache topic prompts, common responses

### 5.2 Latency Optimization
- **Streaming responses:** Display AI response as it generates
- **Edge functions:** Use Vercel Edge for routing
- **Prefetch:** Load topic data on selection screen
- **Optimistic UI:** Show user message immediately

### 5.3 Browser TTS/STT Performance

**STT (Speech-to-Text):**
```typescript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ja-JP';
recognition.continuous = false;
recognition.interimResults = false; // Final results only for better accuracy
```

**Browser support:**
- Chrome/Edge: Excellent Japanese support
- Safari: Good, but requires user permission
- Firefox: Limited, may need fallback

**TTS (Text-to-Speech):**
```typescript
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'ja-JP';
utterance.rate = 0.9; // Slightly slower for learners

// Choose best Japanese voice
const voices = speechSynthesis.getVoices();
const japaneseVoice = voices.find(v => v.lang.startsWith('ja'));
```

## 6. Security Considerations

- **API Keys:** Store in environment variables, never expose to client
- **Rate limiting:** Prevent abuse (max 50 conversations/day per user)
- **Input validation:** Sanitize user input before sending to AI
- **RLS:** Ensure users can only access their own data
- **CORS:** Configure properly for API routes
- **Auth:** Use Supabase Auth with JWT tokens

## 7. Testing Strategy

### 7.1 Unit Tests
- Utility functions (XP calculation, streak logic)
- Prompt template generation

### 7.2 Integration Tests
- API route handlers
- Database queries
- OpenRouter integration

### 7.3 E2E Tests (Playwright)
- User onboarding flow
- Start conversation
- Send message and receive response
- XP/streak updates

### 7.4 Manual Testing Checklist
- [ ] STT accuracy with Japanese input
- [ ] TTS pronunciation quality
- [ ] AI response relevance
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

## 8. Deployment

### 8.1 Vercel Configuration

**vercel.json:**
```json
{
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key",
    "OPENROUTER_API_KEY": "@openrouter-key"
  },
  "regions": ["sin1"],
  "functions": {
    "api/**": {
      "maxDuration": 30
    }
  }
}
```

### 8.2 Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenRouter
OPENROUTER_API_KEY=
OPENROUTER_APP_NAME=hitori-talk
OPENROUTER_APP_URL=https://hitori-talk.vercel.app

# App
NEXT_PUBLIC_APP_URL=https://hitori-talk.vercel.app
```

## 9. Monitoring & Analytics

- **Vercel Analytics:** Page views, performance
- **Supabase Logs:** Database queries, errors
- **Custom metrics:**
  - Conversation completion rate
  - Average session duration
  - Common AI errors
  - STT failure rate

---

**Version:** 1.0
**Last Updated:** 2026-03-25
