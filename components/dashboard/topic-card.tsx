import Link from 'next/link';

interface TopicCardProps {
  id: string;
  title: string;
  titleJa: string;
  description: string;
  category: string;
  icon: string;
}

export function TopicCard({ id, title, titleJa, description, category, icon }: TopicCardProps) {
  return (
    <Link
      href={`/topics/${id}`}
      className="glass-card group flex flex-col gap-3 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:border-glass-border-strong hover:bg-glass-hover md:p-5 md:hover:-translate-y-1"
    >
      <span className="text-[32px] md:text-[36px]">{icon}</span>
      <div>
        <h3 className="text-[15px] font-semibold text-foreground md:text-base">{title}</h3>
        <p className="text-[11px] text-foreground-secondary md:text-xs">{titleJa}</p>
      </div>
      <p className="line-clamp-2 text-[13px] leading-relaxed text-foreground-secondary md:text-sm">
        {description}
      </p>
      <span className="w-fit rounded-lg bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-primary-light md:text-xs">
        {category}
      </span>
    </Link>
  );
}
