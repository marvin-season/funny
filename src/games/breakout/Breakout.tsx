import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Heart, Pause, Play, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatTime, LEVEL_COUNT } from './model';
import { useBreakout } from './useBreakout';

export default function Breakout() {
  const game = useBreakout();
  const { hud } = game;
  const [confirmRestart, setConfirmRestart] = useState(false);
  const resumeOnCancel = useRef(false);
  const hasProgress = hud.score > 0 || hud.seconds > 0;
  const isFinished = hud.status === 'lost' || hud.status === 'won';

  useEffect(() => {
    document.title = '打砖块 · 片刻小游戏';
    const wasOverflowHidden = document.documentElement.classList.contains('overflow-hidden');
    document.documentElement.classList.add('overflow-hidden');
    return () => {
      document.title = '片刻 · 小游戏';
      if (!wasOverflowHidden) document.documentElement.classList.remove('overflow-hidden');
    };
  }, []);

  const askRestart = () => {
    if (!hasProgress || isFinished) { game.restart(); return; }
    resumeOnCancel.current = hud.status === 'playing';
    game.pause();
    setConfirmRestart(true);
  };

  return <main className="fixed inset-x-0 top-0 flex h-dvh flex-col overflow-hidden overscroll-none bg-[#20372c] pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] text-[#edf4e4] select-none">
    <h1 className="sr-only">打砖块</h1>
    <header className="mx-auto flex w-full max-w-[900px] shrink-0 items-center justify-between gap-2 border-b border-white/10 px-2 py-1 sm:px-4">
      <Link to="/" aria-label="返回小游戏首页" className="flex size-11 shrink-0 items-center justify-center rounded-xl text-[#bdcdb7] hover:bg-white/10"><ArrowLeft size={20} /></Link>
      <div aria-label={`得分 ${hud.score}`} className="min-w-0"><span className="block text-[9px] text-[#a4b99d]">分数</span><span className="font-mono text-xl font-semibold tabular-nums">{hud.score}</span></div>
      <div className="text-center"><span className="block text-[9px] text-[#a4b99d]">关卡</span><span className="font-mono text-sm tabular-nums">{hud.level}<span className="text-[#a4b99d]"> / {LEVEL_COUNT}</span></span></div>
      <div aria-label={`${hud.lives} 次生命`} className="flex gap-1">{[1, 2, 3].map(n => <Heart key={n} size={15} className={hud.lives >= n ? 'fill-[#e5a38c] text-[#e5a38c]' : 'fill-white/10 text-white/10'} />)}</div>
      <button disabled={!game.ready || !['playing', 'paused'].includes(hud.status)} aria-label={hud.status === 'paused' ? '继续游戏' : '暂停游戏'} onClick={hud.status === 'paused' ? game.start : game.pause} className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lime hover:bg-white/10 disabled:opacity-30">{hud.status === 'paused' ? <Play size={20} /> : <Pause size={20} />}</button>
    </header>

    <section aria-label="游戏区" className="relative mx-auto min-h-0 w-full max-w-[900px] flex-1 overflow-hidden touch-none [&_canvas]:touch-none [&_canvas]:outline-offset-[-3px]">
      <div ref={game.containerRef} className="absolute inset-0 touch-none" />
      {!game.ready && <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#20372c] px-6 text-center text-sm text-lime">{game.loadError ? <><p>游戏没能加载，请刷新后再试。</p><button onClick={() => window.location.reload()} className="min-h-11 rounded-full border border-lime/40 px-5 py-2">重新加载</button></> : <><span className="size-7 rounded-full border-2 border-lime/20 border-t-lime motion-safe:animate-spin" /> 正在准备砖块…</>}</div>}
      {game.ready && hud.status === 'ready' && <div className="pointer-events-none absolute inset-x-4 top-[43%] flex flex-col items-center text-center">
        <p className="text-lg font-medium">{hud.lives < 3 ? '没关系，再接一球' : '准备好了吗？'}</p>
        <p className="mt-2 text-xs text-[#a4b99d]">{hud.level >= 2 ? '灰色挡板不可击碎，试试从侧面绕过' : '手指左右滑动，控制底部挡板'}</p>
        <button onClick={game.start} className="pointer-events-auto mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-lime px-7 py-3 text-sm font-semibold text-ink hover:bg-[#e0f4a8]"><Play size={16} fill="currentColor" /> 开始游戏</button>
      </div>}
      {game.ready && hud.status === 'paused' && !confirmRestart && <div className="absolute inset-0 grid place-items-center overflow-y-auto bg-[#15291f]/95 px-5 py-4 text-center"><div>
        <h2 className="text-2xl font-medium">已暂停</h2>
        <p className="mt-3 text-xs text-[#a4b99d]">最高分 {game.best.toLocaleString()} · 本局 {formatTime(hud.seconds)}</p>
        <button onClick={game.start} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-lime px-7 py-3 text-sm font-medium text-ink"><Play size={16} /> 继续游戏</button>
        <p className="mt-5 text-[11px] text-[#a4b99d]">离开页面会结束本局，最高分自动保存。</p>
      </div></div>}
      {game.ready && ['level-complete', 'won', 'lost'].includes(hud.status) && <div role="status" className="absolute inset-0 grid place-items-center overflow-y-auto bg-[#15291f]/95 px-5 py-4 text-center"><div>
        <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-lime/15 text-lime">{hud.status === 'lost' ? <Heart size={24} /> : <Trophy size={24} />}</span>
        <h2 className="text-2xl font-semibold">{hud.status === 'won' ? '全部清空，漂亮！' : hud.status === 'lost' ? '这一局，也很不错' : '漂亮，下一关！'}</h2>
        <p className="mt-3 text-xs text-[#a4b99d]">{hud.status === 'level-complete' ? '恢复一颗爱心，最多三颗。' : `得分 ${hud.score} · 最长连击 ${hud.bestCombo}`}</p>
        {isFinished && <p className="mt-2 text-xs text-[#a4b99d]">最高分 {game.best.toLocaleString()}{game.storageError ? '（仅本次有效）' : ''}</p>}
        <button onClick={hud.status === 'level-complete' ? game.next : game.restart} className="mt-5 inline-flex min-h-12 items-center gap-3 rounded-full bg-lime px-7 py-3 text-sm font-semibold text-ink">{hud.status === 'level-complete' ? '进入下一关' : '再玩一局'} <ArrowRight size={16} /></button>
      </div></div>}
      {hud.status === 'playing' && hud.combo >= 2 && <div className="pointer-events-none absolute inset-x-0 top-[43%] text-center"><span className="font-mono text-3xl font-bold text-lime/70">{hud.combo}×</span><p className="mt-1 text-[10px] text-[#a4b99d]">连续击碎</p></div>}
    </section>

    <footer className="mx-auto flex w-full max-w-[900px] shrink-0 items-center justify-between gap-2 border-t border-white/10 px-3 py-1">
      <button disabled={!game.ready} onClick={askRestart} aria-label="重新开始" className="flex size-11 items-center justify-center rounded-xl text-[#bdcdb7] hover:bg-white/10 disabled:opacity-30"><RotateCcw size={19} /></button>
      <span className="text-[11px] text-[#a4b99d]">在游戏区左右滑动</span>
      <button aria-label={game.sound ? '关闭音效' : '开启音效'} aria-pressed={game.sound} onClick={game.toggleSound} className="flex size-11 items-center justify-center rounded-xl text-[#bdcdb7] hover:bg-white/10">{game.sound ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
    </footer>
    {confirmRestart && <ConfirmDialog onCancel={() => { setConfirmRestart(false); if (resumeOnCancel.current) requestAnimationFrame(game.start); }} onConfirm={() => { setConfirmRestart(false); requestAnimationFrame(game.restart); }} />}
  </main>;
}
