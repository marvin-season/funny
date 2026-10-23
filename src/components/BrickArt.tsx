export default function BrickArt({ compact = false }: { compact?: boolean }) {
  const rows = ['bg-[#d4ed8a]', 'bg-[#adcbb0]', 'bg-[#e8cb99]', 'bg-[#a9c6d0]'];
  return <div aria-hidden="true" className={`relative aspect-[1.18] w-full overflow-hidden rounded-2xl bg-[#20372c] shadow-[0_18px_40px_-20px_#20372c70] ${compact ? 'max-w-56 -rotate-6 transition-transform duration-300 group-hover:rotate-0 motion-reduce:transition-none' : 'max-w-80 -rotate-6'}`}>
    <div className="absolute inset-0 bg-[radial-gradient(#ffffff16_1px,transparent_1px)] bg-size-[18px_18px]" />
    <div className="absolute inset-x-[10%] top-[17%] grid grid-cols-6 gap-1.5">
      {Array.from({ length: 24 }, (_, i) => <span key={i} className={`aspect-[2.6] rounded-[3px] ${rows[Math.floor(i / 6)]} ${[0, 5, 14, 20, 21].includes(i) ? 'opacity-0' : ''}`} />)}
    </div>
    <div className="absolute top-[49%] left-[49%] h-[25%] w-px -rotate-[30deg] border-l border-dashed border-white/25" />
    <span className="absolute top-[53%] left-[43%] size-3 rounded-full bg-[#f7ffe5] shadow-[0_0_18px_#e2f5ac70]" />
    <span className="absolute right-[10%] bottom-[31%] -rotate-12 font-mono text-sm font-semibold text-lime">+ 30</span>
    <span className="absolute bottom-[13%] left-[36%] h-2.5 w-[28%] rounded-full bg-lime" />
    <span className="absolute bottom-[4%] left-[38%] h-1.5 w-[24%] rounded-[50%] bg-black/10" />
  </div>;
}
