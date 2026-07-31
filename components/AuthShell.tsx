import { Logo } from "@/components/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-900 via-ink-800 to-brand-900 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-2 flex justify-center text-white">
          <Logo size="lg" />
        </div>
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-brand-300">
          Virginia Beach
        </p>
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <div className="mt-6 text-center text-sm text-slate-300">{footer}</div>
      </div>
    </main>
  );
}
