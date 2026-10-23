import { useEffect, useRef } from 'react';
import { RotateCcw, X } from 'lucide-react';

export default function ConfirmDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return <dialog ref={ref} aria-labelledby="restart-title" onCancel={event => { event.preventDefault(); onCancel(); }} className="fixed inset-0 m-auto w-[calc(100%_-_40px)] max-w-sm rounded-3xl border border-line bg-paper p-7 text-ink shadow-xl backdrop:bg-[#15241c]/50 backdrop:backdrop-blur-sm">
    <button onClick={onCancel} aria-label="关闭弹窗" className="absolute top-4 right-4 rounded-full p-2 text-muted hover:bg-line"><X size={18} /></button>
    <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#e9efdc]"><RotateCcw size={22} /></span>
    <h2 id="restart-title" className="text-xl font-semibold">从头再来一局？</h2>
    <p className="mt-3 text-sm leading-6 text-muted">当前关卡和分数会重置，最高纪录会保留。</p>
    <div className="mt-7 grid grid-cols-2 gap-3"><button autoFocus onClick={onCancel} className="rounded-xl border border-line py-3 text-sm hover:bg-white">继续这一局</button><button onClick={onConfirm} className="rounded-xl bg-ink py-3 text-sm font-medium text-white hover:bg-forest">重新开始</button></div>
  </dialog>;
}
