# System Architecture - Hitori Talk

## 1. Architecture Overview

Hitori Talk sử dụng kiến trúc **Serverless + JAMstack** với Next.js làm core framework.

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React Components (Next.js App Router)                     │ │
│  │  • Pages (RSC + Client Components)                         │ │
│  │  • State Management (Zustand/Context)                      │ │
│  │  • UI Components (shadcn/ui + Tailwind)                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Browser APIs                                              │ │
│  │  • Web Speech API (STT/TTS)                                │ │
│  │  • IndexedDB (Offline cache)                               │ │
│  │  • Service Worker (PWA - future)                           │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer (Vercel)                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Next.js App Router                                        │ │
│  │  • Server Components (RSC)                                 │ │
│  │  • Route Handlers (API Routes)                             │ │
│  │  • Middleware (Auth, Logging)                              │ │
│  │  • Edge Runtime (Regional)                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                  │                          │
                  │                          │
                  ▼                          ▼
┌──────────────────────────────┐  ┌─────────────────────────────────────────────────┐
│     Data Layer               │  │     AI Layer                                    │
│  Supabase                    │  │  OpenRouter                                     │
│  • PostgreSQL + RLS          │  │  • Step 3.5 Flash (free)                        │
│  • Auth (JWT)                │  │  • NVIDIA: Nemotron 3 Super (free) (fallback)   │
│  • Realtime (subscriptions)  │  │  • Streaming responses                          │
│  • Storage (future)          │  │                                                 │
└──────────────────────────────┘  └─────────────────────────────────────────────────┘
```

## 2. Layer Breakdown

### 2.1 Client Layer (Browser)

**Responsibilities:**
- Render UI
- Handle user interactions
- Manage client-side state
- Execute STT/TTS
- Cache data for offline

**Key Technologies:**
- React 18+ with Server Components
- Zustand or Context API for state
- Web Speech API for voice
- shadcn/ui + Tailwind CSS for UI

**Component Architecture:**
```
app/
├── (auth)/
│   ├── login/
│   └── signup/
├── (onboarding)/
│   ├── level-selection/
│   └── placement-test/
├── (dashboard)/
│   ├── page.tsx           # Home dashboard
│   ├── topics/
│   ├── conversation/
│   │   └── [id]/
│   │       └── page.tsx   # Conversation UI
│   ├── progress/
│   └── profile/
└── layout.tsx
```

### 2.2 Application Layer (Vercel)

**Responsibilities:**
- Server-side rendering
- API routing and business logic
- Authentication middleware
- Database queries
- AI integration

**API Routes Structure:**
```
app/api/
├── auth/
│   ├── signup/route.ts
│   └── callback/route.ts
├── onboarding/
│   └── placement-test/route.ts
├── topics/
│   ├── route.ts           # GET: list topics
│   └── [id]/route.ts      # GET: topic details
├── conversations/
│   ├── route.ts           # POST: start conversation
│   └── [id]/
│       ├── message/route.ts    # POST: send message
│       └── complete/route.ts   # POST: end conversation
├── profile/
│   ├── route.ts           # GET/PATCH: user profile
│   └── stats/route.ts     # GET: user statistics
└── webhooks/
    └── openrouter/route.ts
```

**Middleware Stack:**
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session
  await supabase.auth.getSession();

  // Protect routes
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/dashboard')) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return res;
}
```

### 2.3 Data Layer (Supabase)

**Responsibilities:**
- Data persistence
- User authentication
- Row-level security
- Real-time subscriptions (future)

**Database Access Pattern:**
```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();

// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const supabaseServer = () =>
  createServerComponentClient({ cookies });
```

**Query Examples:**
```typescript
// Get user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Start conversation
const { data: conversation } = await supabase
  .from('conversations')
  .insert({
    user_id: userId,
    topic_id: topicId,
    mode: 'natural',
  })
  .select()
  .single();

// Log message
await supabase
  .from('messages')
  .insert({
    conversation_id: conversationId,
    role: 'user',
    content_text: userMessage,
  });
```

### 2.4 AI Layer (OpenRouter)

**Responsibilities:**
- Natural language understanding
- Response generation
- Error correction
- Contextual awareness

**Integration Pattern:**
```typescript
// lib/ai/openrouter.ts
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function streamAIResponse(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
    },
    body: JSON.stringify({
      model: 'stepfun/step-3.5-flash:free',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) onChunk(content);
        } catch (e) {
          console.error('Parse error:', e);
        }
      }
    }
  }
}
```

## 3. Data Flow

### 3.1 Conversation Flow

```
User speaks
    ↓
[Browser STT]
    ↓
Japanese text
    ↓
[POST /api/conversations/:id/message]
    ↓
┌─────────────────────────────────────┐
│  API Route Handler                  │
│  1. Validate session                │
│  2. Get conversation context        │
│  3. Build AI prompt                 │
│  4. Call OpenRouter (streaming)     │
│  5. Process response                │
│  6. Save to database                │
│  7. Calculate XP                    │
│  8. Check achievements              │
└─────────────────────────────────────┘
    ↓
AI response (streamed)
    ↓
[Client receives chunks]
    ↓
Display text + TTS
    ↓
User hears response
```

### 3.2 XP Calculation Flow

```typescript
// lib/gamification/xp.ts
export function calculateConversationXP(params: {
  messageCount: number;
  duration: number; // seconds
  mistakesCount: number;
  streakMultiplier: number;
}): number {
  const baseXP = 10;
  const messageBonus = params.messageCount * 5;
  const durationBonus = Math.min(params.duration / 60, 10) * 2; // Max 20 XP for duration
  const accuracyBonus = params.mistakesCount === 0 ? 20 : 0;

  const totalXP = (baseXP + messageBonus + durationBonus + accuracyBonus)
    * params.streakMultiplier;

  return Math.floor(totalXP);
}

// Check level up
export function checkLevelUp(currentXP: number, currentLevel: number): {
  newLevel: number;
  didLevelUp: boolean;
} {
  const xpForNextLevel = currentLevel * 1000;
  if (currentXP >= xpForNextLevel) {
    return {
      newLevel: currentLevel + 1,
      didLevelUp: true,
    };
  }
  return {
    newLevel: currentLevel,
    didLevelUp: false,
  };
}
```

### 3.3 Streak Update Flow

```typescript
// lib/gamification/streak.ts
import { differenceInCalendarDays } from 'date-fns';

export function updateStreak(lastPracticeDate: Date | null): {
  newStreak: number;
  streakMaintained: boolean;
  streakBroken: boolean;
} {
  const today = new Date();

  if (!lastPracticeDate) {
    return { newStreak: 1, streakMaintained: false, streakBroken: false };
  }

  const daysDiff = differenceInCalendarDays(today, lastPracticeDate);

  if (daysDiff === 0) {
    // Same day, no change
    return { newStreak: currentStreak, streakMaintained: true, streakBroken: false };
  } else if (daysDiff === 1) {
    // Next day, increment
    return { newStreak: currentStreak + 1, streakMaintained: true, streakBroken: false };
  } else {
    // Broken
    return { newStreak: 1, streakMaintained: false, streakBroken: true };
  }
}
```

## 4. State Management

### 4.1 Client State (Zustand)

```typescript
// lib/store/conversationStore.ts
import { create } from 'zustand';

interface ConversationState {
  conversationId: string | null;
  messages: Message[];
  isRecording: boolean;
  isSpeaking: boolean;

  // Actions
  startConversation: (topicId: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  endConversation: () => Promise<void>;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversationId: null,
  messages: [],
  isRecording: false,
  isSpeaking: false,

  startConversation: async (topicId) => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ topicId }),
    });
    const data = await res.json();
    set({
      conversationId: data.conversationId,
      messages: [{
        role: 'assistant',
        content: data.aiGreeting.response,
        translation: data.aiGreeting.translation,
        corrections: null,
      }],
    });
  },

  sendMessage: async (text) => {
    // Add user message optimistically
    set(state => ({
      messages: [...state.messages, { role: 'user', content: text }],
    }));

    // Stream AI response
    const response = await fetch(`/api/conversations/${get().conversationId}/message`, {
      method: 'POST',
      body: JSON.stringify({ userMessage: text }),
    });

    // Handle streaming...
  },

  // ... other actions
}));
```

### 4.2 Server State (React Query - optional)

```typescript
// lib/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

## 5. Error Handling

### 5.1 API Error Responses

```typescript
// lib/api/errors.ts
export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

// In route handler:
export async function POST(req: Request) {
  try {
    // ... logic
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 5.2 Client Error Handling

```typescript
// components/ErrorBoundary.tsx
'use client';

export function ErrorBoundary({ children }) {
  // ... error boundary implementation
}

// In conversation component:
try {
  await sendMessage(text);
} catch (error) {
  toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
  console.error(error);
}
```

## 6. Performance Optimizations

### 6.1 Caching Strategy

```typescript
// API route with caching
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

// React Query caching
const { data } = useQuery({
  queryKey: ['topics', level],
  queryFn: fetchTopics,
  staleTime: 10 * 60 * 1000, // 10 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});
```

### 6.2 Code Splitting

```typescript
// Lazy load heavy components
const ConversationInterface = dynamic(
  () => import('@/components/ConversationInterface'),
  { ssr: false }
);
```

## 7. Security Architecture

### 7.1 Authentication Flow

```
1. User signs up/logs in
   ↓
2. Supabase Auth creates session
   ↓
3. JWT token stored in httpOnly cookie
   ↓
4. Middleware validates token on protected routes
   ↓
5. API routes verify session before processing
   ↓
6. RLS policies enforce data access control
```

### 7.2 API Security Checklist

- ✅ All API routes validate authentication
- ✅ Input validation and sanitization
- ✅ Rate limiting (Vercel or custom)
- ✅ CORS configuration
- ✅ Environment variables for secrets
- ✅ RLS on all sensitive tables
- ✅ HTTPS only in production

---

**Version:** 1.0
**Last Updated:** 2026-03-25
