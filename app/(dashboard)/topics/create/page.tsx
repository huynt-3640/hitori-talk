'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const EMOJI_OPTIONS = ['💬', '📋', '🔍', '🐛', '🤝', '📊', '🍜', '☕', '💻', '🎯', '📞', '🏢'];
const CATEGORIES = ['Work', 'Technical', 'Business', 'Casual'];

export default function CreateTopicPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💬');
  const [category, setCategory] = useState('Work');
  const [description, setDescription] = useState('');
  const [aiRole, setAiRole] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) {
      setError('Topic name is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: name.trim(),
          icon,
          category,
          description: description.trim(),
          ai_role: aiRole.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create topic');
      }

      router.push('/topics');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setCreating(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--bottom-nav-height))] flex-col p-5 md:min-h-screen md:p-10 md:pl-12">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="glass-card flex h-9 w-9 items-center justify-center rounded-lg text-foreground"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold text-foreground">Create Topic</h1>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-lg flex-1 flex-col gap-5">
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Topic Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground-secondary">Topic Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Sprint Retrospective"
            className="rounded-lg border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-base text-foreground outline-none placeholder:text-foreground-secondary focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
          />
        </div>

        {/* Icon */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground-secondary">Icon</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setIcon(emoji)}
                className={`flex h-11 w-11 items-center justify-center rounded-lg border text-2xl transition-all ${
                  icon === emoji
                    ? 'border-primary bg-primary-soft shadow-[0_0_0_2px_rgba(124,58,237,0.15)]'
                    : 'border-glass-border bg-glass hover:bg-glass-hover'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground-secondary">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="appearance-none rounded-lg border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#1a1a2e]">{c}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground-secondary">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the scenario you want to practice..."
            rows={3}
            className="resize-y rounded-lg border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-base text-foreground outline-none placeholder:text-foreground-secondary focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
          />
          <p className="text-xs text-foreground-secondary">This helps the AI set up the right context</p>
        </div>

        {/* AI Role */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground-secondary">AI Role (optional)</label>
          <input
            type="text"
            value={aiRole}
            onChange={(e) => setAiRole(e.target.value)}
            placeholder="e.g., Project Manager, Team Lead"
            className="rounded-lg border border-glass-border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-base text-foreground outline-none placeholder:text-foreground-secondary focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]"
          />
          <p className="text-xs text-foreground-secondary">Leave empty for AI to choose a fitting role</p>
        </div>

        {/* Preview */}
        <div className="glass-card rounded-2xl p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Preview</p>
          <div className="flex items-center gap-3">
            <span className="text-[28px]">{icon}</span>
            <div>
              <p className="text-base font-semibold text-foreground">{name || 'Topic Name'}</p>
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary-light">{category}</span>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div className="mt-auto pt-5">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary-gradient w-full rounded-xl py-4 text-lg font-semibold"
          >
            {creating ? 'Creating...' : 'Create Topic'}
          </button>
        </div>
      </div>
    </div>
  );
}
