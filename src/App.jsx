import React, { useEffect, useMemo, useState } from 'react';
import LessonPlayer from './components/LessonPlayer';

async function loadLessons(){
  const res = await fetch('/lessons.json'); // served from public/
  if(!res.ok){ throw new Error('Não foi possível carregar o plano.'); }
  return res.json();
}

function cx(...xs){ return xs.filter(Boolean).join(' '); }
function Pill({children, color='bg-indigo-600'}){ return <span className={cx('px-2 py-0.5 rounded-full text-white text-xs', color)}>{children}</span>; }
function Progress({value}){ return <div className='w-64 bg-slate-200 h-2 rounded-full'><div className='h-2 bg-indigo-600 rounded-full' style={{width:`${Math.min(100,Math.max(0,value))}%`}}/></div>; }

export default function App(){
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [idioma, setIdioma] = useState('todos'); // 'fr' | 'de' | 'todos'
  const [pesquisa, setPesquisa] = useState('');
  const [aberta, setAberta] = useState(null);

  const [concluidas, setConcluidas] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('lc_done')||'[]'); }catch{ return []; }
  });

  useEffect(()=>{
    loadLessons().then(d=>{ setAll(d.licoes||[]); setLoading(false); }).catch(e=>{ setErr(e.message||String(e)); setLoading(false); });
  },[]);

  useEffect(()=>{
    try{ localStorage.setItem('lc_done', JSON.stringify(concluidas)); }catch{}
  },[concluidas]);

  const filtered = useMemo(()=>{
    let xs = all.slice().sort((a,b)=>{
      if(a.idioma===b.idioma) return a.numero - b.numero;
      return a.idioma.localeCompare(b.idioma);
    });
    if(idioma!=='todos'){
      xs = xs.filter(x => (idioma==='fr' ? x.id.startsWith('fr-') : x.id.startsWith('de-')));
    }
    if(pesquisa.trim()){
      const q = pesquisa.trim().toLowerCase();
      xs = xs.filter(x =>
        (x.tema||'').toLowerCase().includes(q) ||
        (x.tempo||'').toLowerCase().includes(q) ||
        (x.vocabPT||'').toLowerCase().includes(q) ||
        (x.gramatica||'').toLowerCase().includes(q)
      );
    }
    return xs;
  },[all, idioma, pesquisa]);

  const total = filtered.length;
  const doneCount = filtered.filter(x=>concluidas.includes(x.id)).length;
  const toggleDone = (id) => setConcluidas(prev => prev.includes(id)? prev.filter(x=>x!==id) : prev.concat(id));

  if(loading) return <div style={{padding:20,fontFamily:'system-ui'}}>A carregar…</div>;
  if(err) return <div style={{padding:20,fontFamily:'system-ui', color:'crimson'}}>Erro: {err}</div>;

  // Interactive lesson view
  if(aberta){
    return <LessonPlayer
      item={aberta}
      onBack={()=>setAberta(null)}
      onMarkDone={toggleDone}
      isDone={concluidas.includes(aberta.id)}
    />;
  }

  // List view
  return (
    <div className='min-h-screen bg-slate-50'>
      <header className='max-w-6xl mx-auto px-4 py-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>LinguaCoach — Plano 180 lições</h1>
          <p className='text-sm text-slate-600'>Francês 🇫🇷 & Alemão 🇩🇪 • traduções PT • vários tempos verbais</p>
        </div>
      </header>

      <main className='max-w-6xl mx-auto px-4 pb-24'>
        <div className='flex flex-wrap items-center gap-2 mb-3'>
          <div className='flex gap-2'>
            <button onClick={()=>setIdioma('todos')} className={cx('px-3 py-1 rounded-md', idioma==='todos'?'bg-indigo-600 text-white':'bg-white border')}>Todos</button>
            <button onClick={()=>setIdioma('fr')} className={cx('px-3 py-1 rounded-md', idioma==='fr'?'bg-indigo-600 text-white':'bg-white border')}>Francês</button>
            <button onClick={()=>setIdioma('de')} className={cx('px-3 py-1 rounded-md', idioma==='de'?'bg-indigo-600 text-white':'bg-white border')}>Alemão</button>
          </div>
          <input value={pesquisa} onChange={e=>setPesquisa(e.target.value)} placeholder='Pesquisar por tema, tempo, vocabulário…' className='border rounded-md p-2 flex-1 min-w-[240px]' />
        </div>

        <div className='flex items-center gap-3 mb-4'>
          <Progress value={(doneCount/Math.max(1,total))*100} />
          <div>{doneCount}/{total} concluídas (filtro atual)</div>
        </div>

        <div className='grid gap-2'>
          {filtered.map(item => (
            <div key={item.id} className='grid grid-cols-12 items-start gap-3 p-3 bg-white border rounded-lg'>
              <div className='col-span-12 md:col-span-2 font-medium'>
                {(item.id.startsWith('fr-')?'FR':'DE')} {item.numero}
              </div>
              <div className='col-span-12 md:col-span-3'>
                <div className='text-sm text-slate-500'>{item.fase}</div>
                <div className='font-semibold'>{item.tema}</div>
                <div className='mt-1 text-xs text-slate-600 flex flex-wrap gap-1'>
                  <Pill color='bg-amber-600'>{item.tempo}</Pill>
                </div>
              </div>
              <div className='col-span-12 md:col-span-5 text-sm'>
                <div className='text-slate-500 mb-1'>Vocabulário (PT)</div>
                <div className='line-clamp-2'>{item.vocabPT}</div>
              </div>
              <div className='col-span-12 md:col-span-2 flex items-start justify-end gap-2'>
                <button onClick={()=>setAberta(item)} className='px-3 py-1 rounded-md bg-indigo-600 text-white'>Começar aula</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
