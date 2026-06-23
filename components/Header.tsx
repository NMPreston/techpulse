import Navigation from "./Navigation";

export default function Header() {
  return (
    <header className="border-b border-zinc-900 pb-5 mb-6">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            TechPulse<span className="text-amber-500">.</span>
          </h1>
          <p className="text-xs text-zinc-600 font-mono mt-1">
            AI/ML · Patent Law · Daily Intelligence
          </p>
        </div>
      </div>
      <Navigation />
    </header>
  );
}