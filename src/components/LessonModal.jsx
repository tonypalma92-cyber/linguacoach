import React from 'react';

function cx(...xs){ return xs.filter(Boolean).join(' '); }

export default function LessonModal({ item, onClose, onToggleDone, done }){
  if(!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div>
            <div className="text-sm text-slate-500">{item.id.startsWith('fr-')?'Francês':'Alemão'} • Lição {item.numero}</div>
            <div className="text-xl font-semibold">{item.tema}</div>
            <div className="text-xs text-slate-500 mt-1">{item.fase} • <span className="font-medium">{item.tempo}</span></div>
          </div>
          <button onClick={onClose} className="px-3 py-1 rounded-md bg-slate-200 hover:bg-slate-300">Fechar</button>
        </div>

        <div className="p-5 grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-slate-500 text-sm mb-1">Vocabulário (com PT)</div>
            <div className="prose prose-sm max-w-none">{item.vocabPT}</div>
          </div>
          <div>
            <div className="text-slate-500 text-sm mb-1">Gramática</div>
            <div className="prose prose-sm max-w-none">{item.gramatica}</div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="text-slate-500 text-sm mb-1">Exercício</div>
          <div className="prose prose-sm max-w-none">{item.exercicio}</div>
        </div>

        <div className="px-5 py-4 border-t flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={done} onChange={() => onToggleDone(item.id)} />
            Marcar esta lição como concluída
          </label>
          <div className="text-xs text-slate-500">Progresso fica gravado no teu navegador</div>
        </div>
      </div>
    </div>
  );
}
