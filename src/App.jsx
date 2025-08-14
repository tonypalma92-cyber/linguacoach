import React, { useEffect, useMemo, useState } from 'react';

const LS_KEY = 'linguacoach_full_state';
const topics = ['Saudações e apresentações','Números e idades','Família','Cores','Comida e bebidas','Profissões','Locais da cidade','Dias da semana e rotinas','Clima','Viagens e transportes','Compras','Casa e mobiliário','Animais','Descrever pessoas','Saúde e corpo humano'];
const rich = { fr:{1:{topic:topics[0],vocab:['Bonjour','Salut','Comment ça va ?','Je m’appelle…','Enchanté(e)','Au revoir'],grammar:'Pronomes pessoais; être (presente)',phrases:['Bonjour, je m’appelle Antonio.','Comment ça va ? — Ça va bien, merci.','Je suis portugais / portugaise.']},2:{topic:topics[1],vocab:['zéro','un','deux','trois','quatre','cinq','âge','ans'],grammar:'Avoir (presente)',phrases:['J’ai 33 ans.','Tu as quel âge ?','Il a vingt ans.']},3:{topic:topics[2],vocab:['mère','père','frère','sœur','famille','enfant'],grammar:'Possessivos: mon/ma/mes',phrases:['C’est ma sœur.','Mon frère habite à Porto.','Ma famille est petite.']}}, de:{1:{topic:topics[0],vocab:['Guten Tag','Hallo','Wie geht’s?','Ich heiße…','Freut mich','Auf Wiedersehen'],grammar:'Pronomes pessoais; sein (presente)',phrases:['Hallo! Ich heiße Antonio.','Wie geht’s? — Gut, danke.']},2:{topic:topics[1],vocab:['null','eins','zwei','drei','vier','fünf','Jahre','alt'],grammar:'haben (presente); … Jahre alt',phrases:['Ich bin 33 Jahre alt.','Wie alt bist du?']},3:{topic:topics[2],vocab:['Mutter','Vater','Bruder','Schwester','Familie','Kind'],grammar:'Possessivos: mein/meine',phrases:['Das ist meine Schwester.','Mein Bruder wohnt in Porto.']}} };
const base = { fr:{vocab:{[topics[0]]:['Bonjour','Salut','Comment ça va?'],[topics[1]]:['zéro','un','deux'],[topics[2]]:['mère','père','frère']},grammar:{[topics[0]]:'Pronomes pessoais; être (presente)',[topics[1]]:'Avoir (presente)',[topics[2]]:'Possessivos: mon/ma/mes'}}, de:{vocab:{[topics[0]]:['Guten Tag','Hallo','Wie geht’s?'],[topics[1]]:['null','eins','zwei'],[topics[2]]:['Mutter','Vater','Bruder']},grammar:{[topics[0]]:'Pronomes pessoais; sein (presente)',[topics[1]]:'haben (presente)',[topics[2]]:'Possessivos: mein/meine'}} };

function save(s){ try{ localStorage.setItem(LS_KEY, JSON.stringify(s)); }catch{} }
function load(def){ try{ const raw = localStorage.getItem(LS_KEY); return raw? { ...def, ...JSON.parse(raw)}: def; }catch{ return def; } }
function cx(...xs){ return xs.filter(Boolean).join(' '); }

function genLessons(lang){
  const arr=[]; for(let i=1;i<=90;i++){ const r=rich[lang]?.[i]; const topic=r?.topic||topics[(i-1)%topics.length]; const vocab=r?.vocab||base[lang].vocab[topic]||[]; const grammar=r?.grammar||base[lang].grammar[topic]||''; const phrases=r?.phrases||[];
    arr.push({id:`${lang}-${i}`,lang,idx:i,topic,vocab,grammar,phrases,done:false,notes:'',evalWritten:i%10===0,evalOral:i%15===0}); } return arr;
}

function Pill({children,color='bg-indigo-600'}){ return <span className={cx('px-2 py-0.5 rounded-full text-white text-xs',color)}>{children}</span>; }
function Progress({value}){ return <div className='w-full bg-slate-200 h-2 rounded-full'><div className='h-2 bg-indigo-600 rounded-full' style={{width:`${Math.min(100,Math.max(0,value))}%`}}/></div>; }

function useSpeech(){ const speak=(text,lang)=>{ if(!('speechSynthesis' in window)) return; const u=new SpeechSynthesisUtterance(text); u.lang=lang==='fr'?'fr-FR':'de-DE'; window.speechSynthesis.speak(u); }; return {speak}; }
function downloadText(filename,text){ const blob=new Blob([text],{type:'text/plain'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url); }

function RecorderUI(){
  const [mediaRecorder,setMR]=useState(null); const [chunks,setChunks]=useState([]); const [rec,setRec]=useState(false); const [url,setUrl]=useState(null);
  const start=async()=>{ if(!navigator.mediaDevices?.getUserMedia) return alert('Sem suporte de áudio.'); const stream=await navigator.mediaDevices.getUserMedia({audio:true}); const mr=new MediaRecorder(stream); setChunks([]); mr.ondataavailable=e=>setChunks(p=>p.concat(e.data)); mr.onstop=()=>{ const blob=new Blob(chunks,{type:'audio/webm'}); setUrl(URL.createObjectURL(blob)); }; mr.start(); setMR(mr); setRec(true); };
  const stop=()=>{ mediaRecorder?.stop(); setRec(false); };
  return (<div className='flex items-center gap-2'>{!rec&&<button onClick={start} className='px-3 py-1 bg-rose-600 text-white rounded-md'>● Gravar</button>}{rec&&<button onClick={stop} className='px-3 py-1 bg-amber-600 text-white rounded-md'>■ Parar</button>}{url&&<audio controls src={url} className='ml-3'/>}</div>);
}

function LessonModal({les,onClose,updateLesson}){
  const { speak } = useSpeech();
  const [tab,setTab]=useState('conteudo'); const [quizIdx,setQuizIdx]=useState(0); const [answer,setAnswer]=useState('');
  const quizPool = useMemo(()=> (les.vocab||[]).map(v=>({q:`Explique/Use: ${v}`, a:v})), [les]);
  const register=()=>{ const ok=answer.trim().length>0; setAnswer(''); alert(ok?'Resposta registada! Partilha comigo no chat para correção.':'Escreve algo primeiro.'); };
  return (<div className='fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50'><div className='w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden'>
    <div className='flex items-center justify-between px-5 py-3 border-b'><div><div className='text-sm text-slate-500'>{les.lang.toUpperCase()} • Lição {les.idx}</div><div className='text-xl font-semibold'>{les.topic}</div></div><button onClick={onClose} className='px-3 py-1 bg-slate-200 rounded-md'>Fechar</button></div>
    <div className='px-5 pt-3 flex gap-2'>{['conteudo','flashcards','quiz','pronuncia','notas','avaliacao'].map(t=>(<button key={t} onClick={()=>setTab(t)} className={cx('px-3 py-1 rounded-md',tab===t?'bg-indigo-600 text-white':'bg-slate-100')}>{t==='conteudo'?'Conteúdo':t==='flashcards'?'Flashcards':t==='quiz'?'Quiz':t==='pronuncia'?'Pronúncia':t==='notas'?'Notas':'Avaliação'}</button>))}</div>
    {tab==='conteudo'&&(<div className='p-5'><h3 className='font-semibold mb-2'>Vocabulário</h3><ul className='list-disc pl-5 space-y-1'>{les.vocab.map((w,i)=>(<li key={i} className='flex items-center gap-2'><span>{w}</span><button onClick={()=>speak(w,les.lang)} className='text-xs px-2 py-0.5 bg-emerald-600 text-white rounded'>▶️ Ouvir</button></li>))}</ul><h3 className='font-semibold mt-4 mb-2'>Gramática</h3><p>{les.grammar}</p>{les.phrases?.length>0&&(<div className='mt-4'><h4 className='font-medium'>Frases-modelo</h4><ul className='list-disc pl-5'>{les.phrases.map((p,i)=>(<li key={i}>{p}</li>))}</ul></div>)}</div>)}
    {tab==='flashcards'&&(<div className='p-5'><Flashcards words={les.vocab||[]} lang={les.lang}/></div>)}
    {tab==='quiz'&&(<div className='p-5 space-y-4'><div className='text-sm text-slate-600'>Pergunta {quizIdx+1} de {quizPool.length||1}</div><div className='text-lg font-medium'>{quizPool[quizIdx]?.q || 'Sem itens.'}</div><input className='w-full border rounded-md p-2' placeholder='Resposta livre' value={answer} onChange={e=>setAnswer(e.target.value)}/><div className='flex gap-2'><button onClick={register} className='px-3 py-1 bg-emerald-600 text-white rounded-md'>Registar</button><button onClick={()=>setQuizIdx(i=>(i+1)%Math.max(1,quizPool.length))} className='px-3 py-1 bg-slate-200 rounded-md'>Próxima</button></div></div>)}
    {tab==='pronuncia'&&(<div className='p-5'><p className='text-sm text-slate-700'>Ouvir → repetir → gravar.</p><div className='flex flex-wrap gap-2 my-2'>{(les.vocab||[]).slice(0,8).map((w,i)=>(<button key={i} onClick={()=>new SpeechSynthesisUtterance&&speak(w,les.lang)} className='px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200'>▶️ {w}</button>))}</div><div className='mt-2 p-3 border rounded-md'><p className='font-medium mb-2'>Gravador</p><RecorderUI/></div></div>)}
    {tab==='avaliacao'&&(<div className='p-5 space-y-3'><p className='text-sm text-slate-700'>Gera um enunciado a partir desta lição.</p><div className='flex flex-wrap gap-2'><button onClick={()=>downloadText(`avaliacao_${les.lang}_escrita_L${les.idx}.txt`,`[Escrita — ${les.lang.toUpperCase()} — L${les.idx}]\nTema: ${les.topic}\nVocab: ${(les.vocab||[]).slice(0,6).join(', ')}\n1) Traduza 6 frases.\n2) 6 frases com: ${les.grammar}.\n3) Texto 8–10 frases.\n4) 10 novas palavras.`)} className='px-3 py-1 bg-amber-600 text-white rounded-md'>📄 Gerar Escrita</button><button onClick={()=>downloadText(`avaliacao_${les.lang}_oral_L${les.idx}.txt`,`[Oral — ${les.lang.toUpperCase()} — L${les.idx}]\nTema: ${les.topic}\nA) Leitura: ${(les.phrases?.length? les.phrases : ['Frase 1','Frase 2','Frase 3']).slice(0,3).join(' | ')}\nB) Perguntas: ${les.lang==='fr'?'Comment tu t’appelles ? / Tu as quel âge ? / Où habites-tu ?':'Wie heißt du? / Wie alt bist du? / Wo wohnst du?'}\nC) Produção: 45–60s sobre o tema.`)} className='px-3 py-1 bg-emerald-600 text-white rounded-md'>🎙 Gerar Oral</button></div></div>)}
    {tab==='notas'&&(<div className='p-5'><textarea className='w-full border rounded-md p-2 min-h-[120px]' placeholder='Notas desta lição' value={les.notes||''} onChange={e=>updateLesson({...les,notes:e.target.value})}/></div>)}
  </div></div>);
}

function Flashcards({ words, lang }){
  const [i,setI]=useState(0); const cur=words[i]||'';
  return (<div className='max-w-xl mx-auto'>
    <div className='rounded-2xl border p-10 text-center shadow-sm bg-white'>
      <div className='text-2xl mb-4'>{cur || '(sem itens)'}</div>
      <div className='flex justify-center gap-3'>
        <button onClick={()=>{ if('speechSynthesis' in window){ const u=new SpeechSynthesisUtterance(cur); u.lang=lang==='fr'?'fr-FR':'de-DE'; speechSynthesis.speak(u);} }} className='px-3 py-1 bg-emerald-600 text-white rounded-md'>▶️ Ouvir</button>
        <button onClick={()=>setI(i=>(i+1)%Math.max(1,words.length))} className='px-3 py-1 bg-slate-200 rounded-md'>Próximo</button>
      </div>
    </div>
  </div>)
}

function ExportImport({state,setState}){
  const download=()=>{ const blob=new Blob([JSON.stringify(state)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='linguacoach_progresso.json'; a.click(); URL.revokeObjectURL(url); };
  const onFile=e=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ setState(p=>({...p, ...JSON.parse(r.result)})); }catch{ alert('Ficheiro inválido'); } }; r.readAsText(f); };
  return (<div className='flex gap-2'><button onClick={download} className='px-3 py-1 bg-slate-800 text-white rounded-md'>Exportar</button><label className='px-3 py-1 bg-slate-100 rounded-md cursor-pointer'>Importar<input type='file' accept='application/json' className='hidden' onChange={onFile}/></label></div>);
}

export default function App(){
  const [state,setState] = useState(()=> load({activeLang:'fr', fr:genLessons('fr'), de:genLessons('de')}));
  useEffect(()=>{ save(state); },[state]);
  const lessons = state[state.activeLang]; const done=lessons.filter(l=>l.done).length;
  const [search,setSearch]=useState('');
  const visible=lessons.filter(l=> l.topic.toLowerCase().includes(search.toLowerCase()) || (l.vocab||[]).join(' ').toLowerCase().includes(search.toLowerCase()));
  const [openLes,setOpenLes]=useState(null);
  const toggleDone=les=> setState(p=>({...p,[les.lang]:p[les.lang].map(x=>x.id===les.id?{...x,done:!x.done}:x)}));
  const updateLesson=upd=> setState(p=>({...p,[upd.lang]:p[upd.lang].map(x=>x.id===upd.id?upd:x)}));
  return (<div className='min-h-screen bg-slate-50'>
    <header className='max-w-6xl mx-auto px-4 py-6 flex items-center justify-between'>
      <div><h1 className='text-2xl font-bold'>LinguaCoach — Francês & Alemão</h1><p className='text-sm text-slate-600'>Checklist 180 lições • flashcards • pronúncia • avaliações</p></div>
      <ExportImport state={state} setState={setState}/>
    </header>
    <main className='max-w-6xl mx-auto px-4 pb-24'>
      <div className='flex gap-2 mb-4'>
        <button onClick={()=>setState(p=>({...p,activeLang:'fr'}))} className={cx('px-4 py-2',state.activeLang==='fr'?'bg-indigo-600 text-white':'bg-white')}>Francês</button>
        <button onClick={()=>setState(p=>({...p,activeLang:'de'}))} className={cx('px-4 py-2',state.activeLang==='de'?'bg-indigo-600 text-white':'bg-white')}>Alemão</button>
      </div>
      <div className='flex items-center gap-3 mb-2'><div className='w-64'><Progress value={(done/lessons.length)*100}/></div><div>{done}/{lessons.length} concluídas</div></div>
      <input className='w-full md:w-96 border rounded-md p-2 mb-3' placeholder='Pesquisar…' value={search} onChange={e=>setSearch(e.target.value)}/>
      <div className='grid gap-2'>{visible.map(l=>(
        <div key={l.id} className='grid grid-cols-12 items-center gap-2 p-2 rounded-lg hover:bg-slate-50 border border-slate-100 bg-white'>
          <div className='col-span-2 font-medium'>{l.lang.toUpperCase()} {l.idx}</div>
          <div className='col-span-4'>{l.topic}</div>
          <div className='col-span-4 text-xs flex gap-2'>{l.evalWritten&&<Pill color='bg-amber-600'>📄 Avaliação</Pill>}{l.evalOral&&<Pill color='bg-emerald-600'>🎙 Oral</Pill>}</div>
          <div className='col-span-1 text-center'><input type='checkbox' checked={l.done} onChange={()=>toggleDone(l)}/></div>
          <div className='col-span-1 text-right'><button onClick={()=>setOpenLes(l)} className='px-3 py-1 rounded-md bg-indigo-600 text-white'>Abrir</button></div>
        </div>
      ))}</div>
      {openLes&&(<LessonModal les={openLes} onClose={()=>setOpenLes(null)} updateLesson={updateLesson}/>)}
    </main>
  </div>);
}
