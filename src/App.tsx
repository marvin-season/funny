import { lazy, Suspense } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Coffee, Grid2X2, Leaf, Pause, Sparkles } from 'lucide-react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import BrickArt from './components/BrickArt';

const Breakout = lazy(() => import('./games/breakout/Breakout'));

function Brand() {
  return <Link to="/" aria-label="片刻小游戏首页" className="flex w-fit items-center gap-3">
    <span className="flex size-10 items-center justify-center rounded-2xl bg-ink text-lime"><Pause size={22} fill="currentColor" strokeWidth={1} /></span>
    <span className="text-xl font-bold tracking-wider">片刻<span className="ml-2.5 text-[10px] font-semibold tracking-[0.2em] text-muted">PLAYROOM</span></span>
  </Link>;
}

function Home() {
  return <main className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
    <section className="relative mt-7 grid overflow-hidden rounded-[32px] border border-[#e1e7d4] bg-[#edf2e1] px-7 py-12 sm:px-12 sm:py-16 md:grid-cols-[1.2fr_1fr]">
      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-2 text-xs font-medium tracking-widest text-forest"><span className="size-1.5 rounded-full bg-forest" /> 给日常，按一下暂停</div>
        <h1 className="text-[38px] leading-[1.45] font-semibold tracking-tight sm:text-5xl">留一点时间，<br />给<span className="relative inline-block">好玩<span className="absolute inset-x-0 bottom-0.5 -z-10 h-3 bg-lime sm:bottom-1 sm:h-4" /></span>。</h1>
        <p className="mt-6 text-sm leading-7 text-[#74816c]">不用赶时间，也不用想太多。<br />在小小的游戏里，找回一点简单的快乐。</p>
        <a href="#games" className="mt-8 inline-flex items-center gap-6 rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-forest">挑一个，玩一会儿 <ArrowRight size={17} /></a>
      </div>
      <div className="relative mt-12 flex min-h-64 items-center justify-center px-3 md:mt-0">
        <div className="absolute size-60 rounded-full border border-[#dbe4c8] sm:size-80" />
        <div className="absolute size-80 rounded-full border border-[#dbe4c8]/65 sm:size-96" />
        <BrickArt />
        <span className="absolute -top-3 right-0 rotate-12 rounded-2xl bg-lime px-4 py-3 text-xs shadow-sm sm:right-0 md:top-0"><Sparkles className="mr-1 inline" size={15} /> 快乐 +1</span>
        <span className="absolute -bottom-5 -left-2 -rotate-6 rounded-2xl bg-white px-4 py-3 text-xs text-muted shadow-sm sm:left-0"><Coffee className="mr-2 inline text-forest" size={17} /> 一局，刚好一杯咖啡</span>
      </div>
    </section>

    <section id="games" className="scroll-mt-6 pt-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><p className="mb-2 text-[10px] font-semibold tracking-[0.22em] text-muted">A LITTLE PLAY, A BETTER DAY</p><h2 className="text-2xl font-semibold">今天，想玩点什么？</h2></div>
        <span className="hidden rounded-full border border-line px-3 py-1.5 text-xs text-muted sm:block">轻松开始 · 随时暂停</span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/games/breakout" className="group overflow-hidden rounded-3xl border border-line bg-white transition-shadow hover:shadow-[0_10px_35px_-15px_#36543c33]">
          <div className="relative flex h-56 items-center justify-center overflow-hidden bg-[#e8efda] px-12 pt-14">
            <span className="absolute top-5 left-5 rounded-full bg-white/75 px-3 py-1 text-[10px] font-medium tracking-wider text-forest">经典，永远好玩</span>
            <BrickArt compact />
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between"><h3 className="text-xl font-semibold">打砖块 <span className="ml-2 text-[10px] font-normal tracking-wide text-muted">BRICK BREAKER</span></h3><ArrowUpRight size={20} className="text-forest transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" /></div>
            <p className="mt-3 text-sm leading-6 text-muted">接住小球，把烦恼一块块击碎。<br />简单的反弹，也能带来满满的快乐。</p>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4"><span className="text-xs text-muted">轻松解压 · 5 个关卡</span><span className="flex items-center gap-2 text-xs font-semibold text-forest">开始游戏 <ArrowRight size={14} /></span></div>
          </div>
        </Link>
        <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-[#d6ddcb] px-8 py-10 text-center sm:min-h-full">
          <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#e9ede2] text-[#89977a]"><Sparkles size={25} strokeWidth={1.4} /></span>
          <h3 className="text-base font-medium text-[#63715a]">好玩的，慢慢来</h3><p className="mt-3 text-sm leading-6 text-muted">更多小小的快乐，<br />正在路上。</p><span className="mt-6 text-[10px] tracking-[0.2em] text-muted">COMING SOON</span>
        </div>
        <div className="hidden flex-col justify-center px-8 lg:flex"><Leaf size={30} strokeWidth={1.2} className="mb-5 text-[#89977a]" /><p className="text-xl leading-9 font-medium text-[#718065]">偶尔放空，<br />也是一件正经事。</p><p className="mt-4 text-xs leading-6 text-muted">没有排行榜，没有催促。<br />只留一点属于自己的时间。</p></div>
      </div>
    </section>
  </main>;
}

export default function App() {
  const { pathname } = useLocation();
  if (pathname === '/games/breakout' || pathname === '/games/breakout/') {
    return <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-[#20372c] text-sm text-lime">正在准备你的小游戏…</div>}><Breakout /></Suspense>;
  }
  return <div className="flex min-h-dvh flex-col">
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8 sm:py-7"><Brand /><div className="flex items-center gap-2 text-xs text-muted">{pathname === '/' ? <><span className="size-1.5 rounded-full bg-[#93aa70]" /><span className="hidden min-[380px]:inline">快乐，不必很复杂</span></> : <Link to="/" className="flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-[#e9ede2]"><Grid2X2 size={15} /><span>全部游戏</span></Link>}</div></header>
    <div className="flex-1"><Suspense fallback={<p className="px-6 py-24 text-center text-sm text-muted">正在准备你的小游戏…</p>}><Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<div className="px-6 py-24 text-center"><h1 className="text-2xl font-semibold">这里还没有小游戏</h1><Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm text-forest"><ArrowLeft size={16} />回到首页</Link></div>} />
    </Routes></Suspense></div>
    <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-6 text-[11px] text-muted sm:px-8"><span>片刻 PLAYROOM <span className="mx-2 text-[#c2c9b8]">/</span> 让快乐简单一点</span><span className="flex items-center gap-1.5"><Leaf size={12} /> 给自己一小段松弛的时间</span></footer>
  </div>;
}
