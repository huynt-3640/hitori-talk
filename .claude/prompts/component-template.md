# Component Template Prompt

Use this template when creating new React components for hitori-talk.

## Component Structure

```typescript
// components/[category]/[ComponentName].tsx
'use client'; // Only if using client-side features (hooks, events)

import { cn } from '@/lib/utils';
import { type ComponentProps } from '@/types';

interface [ComponentName]Props {
  // Props definition
  className?: string; // Always include for styling flexibility
}

export function [ComponentName]({
  // Destructure props
  className,
}: [ComponentName]Props) {
  // Component logic

  return (
    <div className={cn(
      "base-styles",
      className
    )}>
      {/* JSX */}
    </div>
  );
}
```

## Best Practices

### 1. TypeScript Types
- Define explicit prop interfaces
- Use type inference for internal state
- Avoid `any` type

### 2. Styling
- Use Tailwind CSS classes
- Use `cn()` utility for conditional classes
- Accept `className` prop for extensibility

### 3. Client vs Server Components
- Default to Server Components when possible
- Mark with `'use client'` only when needed:
  - Using hooks (useState, useEffect, etc.)
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (localStorage, window, etc.)

### 4. Accessibility
- Use semantic HTML
- Add ARIA labels when needed
- Ensure keyboard navigation works

### 5. Performance
- Use React.memo() for expensive components
- Lazy load heavy components with next/dynamic
- Optimize images with next/image

## Example: MessageBubble Component

```typescript
// components/conversation/MessageBubble.tsx
'use client';

import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  corrections?: Array<{
    type: string;
    original: string;
    suggestion: string;
    explanation: string;
  }>;
  className?: string;
}

export function MessageBubble({
  role,
  content,
  timestamp,
  corrections,
  className,
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
          AI
        </div>
      )}

      {/* Message content */}
      <div className="flex flex-col gap-1 max-w-[70%]">
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          <p className="text-sm">{content}</p>
        </div>

        {/* Corrections */}
        {corrections && corrections.length > 0 && (
          <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2 mt-1">
            {corrections.map((correction, idx) => (
              <div key={idx} className="mb-1 last:mb-0">
                <span className="line-through text-red-600">{correction.original}</span>
                {' → '}
                <span className="text-green-600 font-medium">{correction.suggestion}</span>
                <p className="text-gray-600 mt-0.5">{correction.explanation}</p>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground">
          {format(timestamp, 'HH:mm', { locale: ja })}
        </span>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          👤
        </div>
      )}
    </div>
  );
}
```

## Checklist

Before completing the component:
- [ ] TypeScript types are properly defined
- [ ] Component follows client/server component guidelines
- [ ] Styling uses Tailwind + cn() utility
- [ ] Accessibility considerations addressed
- [ ] Props are documented with JSDoc if complex
- [ ] Component is exported as named export
- [ ] File is in correct directory structure
