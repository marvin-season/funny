import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, Heart, Keyboard, Lightbulb, Maximize2, MousePointer2, Pause, Play, RotateCcw, Sparkles, Trophy, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatTime, LEVEL_COUNT } from './model';
import { useBreakout } from './useBreakout';

export default function Breakout() {
  const game = useBreakout();
  const { hud } = game;
  const [confirmRestart, setConfirmRestart] = useState(false);
  const resumeOnCancel = useRef(false);
  const [leavePrompt, setLeavePrompt] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const hasProgress = hud.score > 0 || hud.seconds > 0;
  const isFinished = hud.status === 'lost' || hud.status === 'won';

  useEffect(() => {
    document.title = '打砖块 · 片刻小游戏';
    return () => { document.title = '片刻 · 小游戏'; };
  }, []);

  const askRestart = () => {
    if (!hasProgress || isFinished) { game.restart(); return; }
    resumeOnCancel.current = hud.status === 'playing';
    game.pause();
    setConfirmRestart(true);
  };

  return <main className="mx-auto max-w-6xl px-4 pb-12 sm:px-8">
    <Link to="/" className="mb-6 inline-flex items-center gap-2 rounded-full py-1 text-xs text-muted hover:text-ink"><ArrowLeft size={14} /> 返回小游戏</Link>
    <div className="mb-7 flex items-end justify-between gap-4">
      <div><div className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-muted"><span className="size-1.5 rounded-full bg-[#93aa70]" /> A CLASSIC LITTLE ESCAPE</div><h1 className="text-3xl font-semibold tracking-tight">打砖块 <span className="ml-2 text-xs font-normal tracking-[0.12em] text-muted sm:text-sm">BRICK BREAKER</span></h1><p className="mt-3 text-sm text-muted">接住小球，把烦恼一块块击碎。</p></div>
      <span className="hidden items-center gap-2 rounded-full border border-line bg-white/60 px-4 py-2 text-xs text-forest sm:flex"><Sparkles size={14} /> 小小碰撞，大大解压</span>
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section aria-label="打砖块" className="min-w-0 overflow-hidden rounded-3xl border border-line bg-white p-3 sm:p-5">
        <div className="mb-4 grid grid-cols-3 divide-x divide-line pt-1 text-center sm:mb-5">
          <div><p className="text-[10px] tracking-wider text-muted">当前分数</p><p className="mt-1 font-mono text-2xl font-semibold tabular-nums sm:text-3xl">{String(hud.score).padStart(4, '0')}</p></div>
          <div><p className="text-[10px] tracking-wider text-muted">关卡</p><p className="mt-1 font-mono text-2xl font-semibold tabular-nums sm:text-3xl">{String(hud.level).padStart(2, '0')}<span className="text-sm font-normal text-muted"> / {String(LEVEL_COUNT).padStart(2, '0')}</span></p></div>
          <div><p className="text-[10px] tracking-wider text-muted">剩余生命</p><div aria-label={`${hud.lives} 次生命`} className="mt-2 flex justify-center gap-1.5 sm:mt-3">{[1, 2, 3].map(n => <Heart key={n} size={20} className={hud.lives >= n ? 'fill-[#d89078] text-[#d89078]' : 'fill-[#edf0e6] text-[#edf0e6]'} />)}</div></div>
        </div>

        <div ref={boardRef} className="relative aspect-[720/660] overflow-hidden rounded-2xl bg-[#20372c] [&_canvas]:outline-offset-[-3px]">
          <div ref={game.containerRef} className="absolute inset-0" />
          {!game.ready && <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#20372c] px-6 text-center text-sm text-[#d4ed8a]">{game.loadError ? <><p>游戏没能加载，请刷新后再试。</p><button onClick={() => window.location.reload()} className="rounded-full border border-lime/40 px-5 py-2">重新加载</button></> : <><span className="size-7 rounded-full border-2 border-lime/20 border-t-lime motion-safe:animate-spin" /> 正在准备砖块…</>}</div>}
          {game.ready && hud.status === 'ready' && <div className="pointer-events-none absolute inset-x-4 top-[49%] flex flex-col items-center text-center"><p className="text-base font-medium text-[#edf4e4] sm:text-xl">{hud.lives < 3 ? '没关系，再接一球' : hud.level === 1 ? '准备好，击碎一点烦恼' : '新的一关，慢慢来'}</p><p className="mt-2 text-[11px] text-[#a4b99d] sm:text-xs">移动挡板，点击发射 · 也可以按空格</p><button onClick={game.start} className="pointer-events-auto mt-4 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-2.5 text-xs font-semibold text-ink shadow-lg transition-colors hover:bg-[#e0f4a8] sm:mt-5 sm:py-3"><Play size={14} fill="currentColor" /> 发射小球</button></div>}
          {game.ready && hud.status === 'paused' && !confirmRestart && <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#15291f]/90 px-6 text-center"><span className="mb-4 flex size-14 items-center justify-center rounded-full border border-white/20 text-lime"><Pause size={25} /></span><h2 className="text-2xl font-medium text-white">休息一下</h2><p className="mt-3 text-xs text-[#a4b99d]">砖块不着急，等你回来。</p><button onClick={game.start} className="mt-6 inline-flex items-center gap-2 rounded-full bg-lime px-7 py-3 text-sm font-medium text-ink"><Play size={15} /> 继续游戏</button></div>}
          {game.ready && ['level-complete', 'won', 'lost'].includes(hud.status) && <div role="status" className="absolute inset-0 flex flex-col items-center justify-center bg-[#15291f]/95 px-5 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-lime/15 text-lime sm:mb-5 sm:size-16">{hud.status === 'lost' ? <Heart size={26} /> : <Trophy size={28} />}</span>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">{hud.status === 'won' ? '全部清空，漂亮！' : hud.status === 'lost' ? '这一局，也很不错' : '清空一关，轻松一点'}</h2>
            <p className="mt-3 text-xs text-[#a4b99d]">{hud.status === 'level-complete' ? '奖励一颗爱心，下一关继续。' : `得分 ${hud.score} · 最长连击 ${hud.bestCombo} · 用时 ${formatTime(hud.seconds)}`}</p>
            <button onClick={hud.status === 'level-complete' ? game.next : game.restart} className="mt-6 inline-flex items-center gap-3 rounded-full bg-lime px-7 py-3 text-sm font-semibold text-ink">{hud.status === 'level-complete' ? '进入下一关' : '再玩一局'} <ArrowRight size={16} /></button>
            {isFinished && <Link to="/" className="mt-4 text-xs text-[#a4b99d] underline-offset-4 hover:underline">回到小游戏首页</Link>}
          </div>}
          {hud.status === 'playing' && hud.combo >= 2 && <div className="pointer-events-none absolute inset-x-0 top-[58%] text-center"><span className="font-mono text-3xl font-bold text-lime/85">{hud.combo}×</span><p className="mt-1 text-[10px] tracking-[0.15em] text-[#a4b99d]">连续击碎</p></div>}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 text-muted">
          <span className="flex items-center gap-1.5 font-mono text-xs tabular-nums"><Clock3 size={13} />{formatTime(hud.seconds)}</span>
          <span className="hidden text-[11px] sm:block">鼠标 / 触控移动 · 空格暂停</span>
          <div className="flex gap-1">
            <button title={game.sound ? '关闭音效' : '开启音效'} aria-label={game.sound ? '关闭音效' : '开启音效'} aria-pressed={game.sound} onClick={game.toggleSound} className="rounded-lg p-2 hover:bg-paper">{game.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
            <button title="聚焦游戏区" aria-label="聚焦游戏区" onClick={() => { boardRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }); boardRef.current?.querySelector('canvas')?.focus({ preventScroll: true }); }} className="rounded-lg p-2 hover:bg-paper"><Maximize2 size={16} /></button>
          </div>
        </div>
      </section>

      <aside className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
        <section className="rounded-3xl border border-line bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-medium"><Trophy size={17} className="text-[#ad9154]" /> 你的最佳表现</div><p className="mt-4 font-mono text-4xl font-semibold tracking-tight tabular-nums">{game.best.toLocaleString()}<span className="ml-2 font-sans text-xs font-normal text-muted">分</span></p><p className="mt-2 text-[11px] text-muted">{game.storageError ? '浏览器未允许保存，纪录仅本次有效' : '纪录保存在当前浏览器'}</p>
          <div className="mt-6 border-t border-line pt-5"><div className="mb-2.5 flex justify-between text-xs"><span className="text-muted">本关清除进度</span><span className="font-mono text-forest">{hud.total - hud.remaining} / {hud.total}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#edf0e6]"><div className="h-full rounded-full bg-[#a4bc79] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(hud.total - hud.remaining) / hud.total * 100}%` }} /></div></div>
          <button disabled={!game.ready || !['playing', 'paused', 'ready'].includes(hud.status)} onClick={hud.status === 'playing' ? game.pause : game.start} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-sm font-medium text-white hover:bg-forest disabled:opacity-40">{hud.status === 'playing' ? <><Pause size={16} /> 暂停一下</> : <><Play size={16} /> {hud.status === 'paused' ? '继续游戏' : '开始游戏'}</>}</button>
          <button disabled={!game.ready} onClick={askRestart} className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3 text-sm text-muted hover:bg-paper disabled:opacity-40"><RotateCcw size={15} /> 重新开始</button>
        </section>

        <section className="rounded-3xl border border-line bg-[#f0f3e8] p-6"><h2 className="flex items-center gap-2 text-sm font-medium"><Lightbulb size={17} /> 一分钟上手</h2><div className="mt-5 space-y-5 text-xs leading-6 text-muted"><p className="flex gap-3"><MousePointer2 size={17} className="mt-1 shrink-0 text-forest" /><span><strong className="font-medium text-ink">接住小球</strong><br />移动鼠标或左右滑动屏幕，控制底部挡板。</span></p><p className="flex gap-3"><Keyboard size={17} className="mt-1 shrink-0 text-forest" /><span><strong className="font-medium text-ink">键盘也可以</strong><br />← → 或 A / D 移动，空格发射、暂停或继续。</span></p><p className="flex gap-3"><Sparkles size={17} className="mt-1 shrink-0 text-forest" /><span><strong className="font-medium text-ink">试试不同角度</strong><br />挡板两侧会让球弹得更斜。连续击碎砖块，分数会更高。</span></p></div><p className="mt-5 border-t border-[#dfe5d3] pt-4 text-[11px] leading-6 text-muted">第三关起，半透明砖块需要击中两次。每过一关恢复一颗爱心，最多三颗。</p></section>
        <p className="flex items-center justify-center gap-2 px-3 text-[11px] text-muted sm:col-span-2 lg:col-span-1"><Check size={13} /> 离开窗口会自动暂停，回来再继续</p>
      </aside>
    </div>
    {hasProgress && !isFinished && <div className="mt-5 text-center"><button onClick={() => setLeavePrompt(!leavePrompt)} className="text-[11px] text-muted underline underline-offset-4">关于游戏进度</button>{leavePrompt && <p className="mt-2 text-xs leading-6 text-muted">最高分会自动保存；刷新或离开游戏页面后，本局会重新开始。</p>}</div>}
    {confirmRestart && <ConfirmDialog onCancel={() => { setConfirmRestart(false); if (resumeOnCancel.current) requestAnimationFrame(game.start); }} onConfirm={() => { setConfirmRestart(false); requestAnimationFrame(game.restart); }} />}
  </main>;
}
