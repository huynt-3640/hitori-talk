# Product Requirements Document - Hitori Talk

## 1. Tổng quan sản phẩm

**Tên sản phẩm:** Hitori Talk
**Mục tiêu:** Ứng dụng luyện nói tiếng Nhật với AI dành riêng cho nhân viên IT

### 1.1 Vision
Tạo ra một nền tảng học tiếng Nhật tương tác, cá nhân hóa giúp nhân viên IT Việt Nam tự tin giao tiếp trong môi trường làm việc với đồng nghiệp Nhật Bản.

### 1.2 Target Users
- **Nhân viên IT Việt Nam** làm việc cho công ty Nhật hoặc dự án offshore
- **Level:** Từ N5 đến N2
- **Pain points:**
  - Thiếu cơ hội thực hành hội thoại thực tế
  - Ngại nói vì sợ sai
  - Thiếu feedback tức thời khi luyện tập
  - Khó duy trì động lực học tập

## 2. Core Features

### 2.1 Onboarding Flow

#### 2.1.1 Level Selection
- Người dùng chọn level hiện tại (N5/N4/N3/N2)
- Hoặc chọn "Không biết level của mình"

#### 2.1.2 Placement Test (Optional)
- **Format:** Hội thoại 3-5 phút với AI
- **Chủ đề:** Giới thiệu bản thân, công việc, sở thích
- **AI đánh giá:**
  - Vocabulary range
  - Grammar accuracy
  - Fluency
  - Pronunciation (basic)
- **Kết quả:** Gợi ý level phù hợp + điểm mạnh/yếu

### 2.2 Conversation Practice

#### 2.2.1 Topic Selection
**Topics có sẵn (theo ngữ cảnh IT):**
- Daily Standup / Progress Report
- Code Review Discussion
- Bug/Issue Reporting
- Meeting với Client
- Giới thiệu dự án/technical solution
- Casual conversation với đồng nghiệp
- Xin phép nghỉ / Email formal

**Custom Topics:**
- Người dùng nhập chủ đề tự do
- AI sẽ điều chỉnh độ khó theo level

#### 2.2.2 Dynamic Context Generation Flow

**AI tự động generate ngữ cảnh mới cho mỗi conversation:**

**Step 1: User chọn topic**
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Code Review Discussion                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 📝 Topic Description:                                  │
│ Practice discussing code review feedback with           │
│ colleagues in Japanese                                  │
│                                                         │
│ [✨ Tạo ngữ cảnh mới]                                  │
└─────────────────────────────────────────────────────────┘
```

**Note:** AI role chưa được xác định ở bước này - sẽ được generate cùng context.

**Step 2: AI generating context (loading ~2-3 seconds)**
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Code Review Discussion                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🤖 AI đang tạo ngữ cảnh hội thoại...                   │
│ ⏳ Đang generate scenario...                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Step 3: Context generated - hiển thị chi tiết**
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Code Review Discussion                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🎭 AI Role: Senior Developer                           │
│                                                         │
│ 🎬 Ngữ cảnh lần này:                                   │
│ "Reviewing React Component Performance"                 │
│                                                         │
│ 📖 Chi tiết:                                           │
│ Bạn đang review code cho một React component xử lý     │
│ form validation. Senior developer chỉ ra một số vấn đề │
│ về performance và UX. Hãy thảo luận về feedback.       │
│                                                         │
│ 💡 Chủ đề sẽ thảo luận:                                │
│ • パフォーマンスの問題 (Vấn đề performance)             │
│ • バリデーションロジック (Logic validation)             │
│ • ユーザー体験 (Trải nghiệm người dùng)                │
│                                                         │
│ 📚 Example Phrases [Click to expand] ▼                 │
│ └─ (Collapsed by default)                              │
│    When expanded:                                      │
│    • このコードについて質問があります                     │
│      (Tôi có câu hỏi về đoạn code này)                │
│    • なぜこの方がいいですか                              │
│      (Tại sao cách này tốt hơn?)                       │
│                                                         │
│ [🔄 Tạo lại]  [🎙️ Bắt đầu hội thoại]                  │
└─────────────────────────────────────────────────────────┘
```

**Key Features:**

1. **Dynamic Context & Role Generation**
   - AI generates unique scenario AND ai_role mỗi lần
   - Cùng 1 topic → contexts VÀ roles khác nhau
   - Example: "Code Review" có thể generate:
     - Context 1: "Reviewing React performance" + ai_role="senior_developer"
     - Context 2: "Reviewing PR from management perspective" + ai_role="team_lead"
     - Context 3: "Mutual code review session" + ai_role="peer_developer"
   - **User role**: Luôn là "developer" (IT professional)

2. **Regenerate Option**
   - User không thích context/role này → click "🔄 Tạo lại"
   - AI generate scenario VÀ role mới
   - Unlimited regenerations

3. **Components trong Generated Context:**
   - **AI Role Badge** (🤖 dynamically generated)
     - Có thể là: Senior Developer, Team Lead, Peer Developer, Client, etc.
     - Phù hợp với scenario cụ thể
   - **Scenario Title**: Brief scenario name
   - **Context Description**: Detailed situation (2-4 sentences, Vietnamese)
   - **Expected Topics**: 3-5 discussion points (Japanese + Vietnamese)
   - **Example Phrases**: 3-5 useful phrases (collapsed by default, with romaji for N5/N4)

4. **Maximum Variety**
   - Same topic → infinite combinations of (scenario, ai_role)
   - Prevents boredom, maintains engagement
   - More realistic practice (real work has varied situations)

#### 2.2.3 Conversation Flow

**Unified Conversation Mode (All-in-one)**

AI sẽ đồng thời thực hiện 3 nhiệm vụ trong mỗi response:

1. **Trả lời tiếp tục hội thoại** (Primary)
   - AI hiểu context và phản hồi tự nhiên
   - Giữ flow hội thoại mượt mà
   - Đặt câu hỏi để maintain engagement

2. **Chỉnh sửa lỗi** (Nếu có - Secondary)
   - Grammar errors
   - Vocabulary misuse
   - Unnatural phrasing
   - Politeness level issues
   - Chỉ hiển thị khi user có lỗi

3. **Dịch nghĩa** (Hidden by default - Helper)
   - Dịch câu AI response sang tiếng Việt
   - Mặc định ẩn (collapsed)
   - User click/tap để xem khi cần
   - Giúp user hiểu khi gặp từ khó

**User Flow:**
```
User nói: "今日はログインバグを直すました。"
     ↓ STT
     ↓
AI Response hiển thị:

┌─────────────────────────────────────────────────┐
│ 🤖 AI Response (Japanese)                       │
│ お疲れ様です！どんな問題でしたか？              │
│                                                 │
│ 📝 Corrections (nếu có lỗi)                     │
│ ⚠️ "直すました" → "直しました"                  │
│ Lỗi: "直す" (dict) + "ました" ❌                │
│ Đúng: "直し" (masu-stem) + "ました" ✅          │
│                                                 │
│ 🇻🇳 Translation (collapsed - click to show)    │
│ └─ [Hiện bản dịch tiếng Việt]                   │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Không phải chọn mode → UX đơn giản hơn
- ✅ Luôn học được điều gì đó từ mỗi câu
- ✅ Hội thoại vẫn tự nhiên (corrections không ngắt flow)
- ✅ Translation là "safety net" khi cần

### 2.3 Gamification System

#### 2.3.1 XP & Points
- **Hoàn thành conversation:** 10-50 XP (tùy độ dài)
- **Sửa lỗi và nhắc lại đúng:** +5 XP bonus
- **Duy trì streak:** Multiplier (x1.5, x2.0)
- **Daily goal:** 100 XP/day

#### 2.3.2 Streak System
- Streak counter (X ngày liên tiếp)
- Visual reminder: "Bạn đã học 7 ngày liên tiếp! 🔥"
- Streak milestone rewards (7 days, 30 days, 100 days)

#### 2.3.3 Level Progression
- User Level (không phải JLPT level)
- Level 1 → Level 2: 1000 XP
- Mỗi level unlock:
  - New topics
  - Advanced AI personas (e.g., strict manager, friendly senpai)
  - Certificates/badges

#### 2.3.4 Achievements
- "First Conversation"
- "Perfect Week" (7 days streak)
- "Grammar Master" (0 errors in 10 conversations)
- "Keigo Champion" (dùng keigo đúng 20 lần)

### 2.4 Progress Tracking

#### 2.4.1 Analytics Dashboard
- Total conversation time
- Topics practiced
- Common mistakes log
- Improvement trend chart
- Vocabulary learned

#### 2.4.2 Mistake History
- Categorize by grammar point
- Show frequency
- Suggest review exercises

## 3. Technical Requirements

### 3.1 Tech Stack
- **Frontend:** Next.js 14+ (App Router)
- **Backend:** Vercel Serverless Functions
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **AI:** OpenRouter API
- **STT:** Web Speech API (browser native)
- **TTS:** Web Speech API (browser native - Japanese voices)

### 3.2 AI Prompting Strategy

**Unified Prompt Template:**
```
You are a Japanese conversation partner helping an IT professional practice Japanese.

User's level: {level}
Topic: {topic}

Your response must include:
1. response: Natural Japanese conversation reply
2. corrections: Array of errors (if any) with explanations
3. translation: Vietnamese translation of your response

Keep responses natural, conversational, and appropriate for workplace context.
```

**Full prompt specification documented in:** `/docs/api/ai-prompts.md`

## 4. User Experience

### 4.1 Key Screens
1. Onboarding (Level selection + Test)
2. Home Dashboard (Streak, XP, Topics)
3. Topic Selection
4. Conversation Interface
5. Post-conversation Summary
6. Progress/Analytics

### 4.2 Mobile-First Design
- Ưu tiên mobile experience
- Push notification cho streak reminder
- Offline mode (cache topics)

## 5. Success Metrics

### 5.1 Engagement
- DAU/MAU ratio > 30%
- Average session length > 10 minutes
- Streak retention (% users with 7+ day streak)

### 5.2 Learning Outcomes
- User self-reported confidence improvement
- Reduction in common mistakes over time
- Topic completion rate

## 6. Future Enhancements (Post-MVP)

- **Voice matching:** AI có giọng nam/nữ, tuổi khác nhau
- **Multiplayer:** Practice with other users
- **AI tutor video avatar:** Lip-sync video character
- **Vocabulary builder:** Extract & review new words from conversations
- **Integration với Anki/Notion** export flashcards
- **Mobile app** with PWA support 

## 7. Success Criteria for MVP

- [ ] User có thể đăng ký và chọn level
- [ ] User có thể chọn topic và bắt đầu conversation
- [ ] STT hoạt động ổn định (>80% accuracy with Japanese)
- [ ] AI response time < 3s
- [ ] TTS phát âm tự nhiên
- [ ] Gamification hiển thị và tính toán đúng (XP, Streak, Level)
- [ ] Mobile responsive

---

**Version:** 1.0
**Last Updated:** 2026-03-25
**Owner:** Huy Nguyen
