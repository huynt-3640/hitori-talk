import { Navigation } from '@/components/shared/navigation';
import { AmbientGlow } from '@/components/shared/ambient-glow';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, jlpt_level, level')
    .single();

  return (
    <div className="relative flex min-h-screen">
      <AmbientGlow variant="dashboard" />
      <Navigation profile={profile} />

      {/* Main content */}
      <main className="relative z-10 flex-1 pb-[var(--bottom-nav-height)] md:pb-0">
        {children}
      </main>
    </div>
  );
}
