import React, { useEffect, useMemo, useRef, useState } from 'react';

function cx(...xs){ return xs.filter(Boolean).join(' '); }
const stepNames = ['Vocabulário', 'Gramática', 'Exercícios', 'Avaliação', 'Resumo'];

function SpeakBtn({text, lang}){
  const onSpeak = ()=>{
    if(!('speechSynthesis' in window)) return alert('O teu navegador não suporta Áudio (TTS).');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang==='fr' ? 'fr-FR' : 'de-DE';
    window.speechSynthesis.speak(u);
  };
  return <button onClick={onSpeak} className="px-2 py-0.5 rounded bg-emerald-600 text-white text-xs">▶️ Ouvir</button>;
}

function Recorder(){
  const [rec,setRec]=useState(false);
  const [url,setUrl]=useState(null);
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const start = async ()=>{
    try{
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      const mr = new MediaRecorder(stream);
      mrRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e)=> chunksRef.current.push(e.data);
      mr.onstop = ()=>{
        const blob = new Blob(chunksRef.current, { type:'audio/webm' });
        setUrl(URL.createObjectURL(blob));
      };
      mr.start();
      setRec(true);
    }catch(e){
      alert('Não consegui aceder ao microfone: ' + e.message);
    }
  };
  const stop = ()=>{
    try{ mrRef.current?.stop(); }catch{}
    setRec(false);
  };
  return (
    <div className="flex items-center gap-2">
      {!rec && <button onClick={start} className="px-3 py-1 rounded bg-rose-600 text-white">● Gravar</button>}
      {rec && <button onClick={stop} className="px-3 py-1 rounded bg-amber-600 text-white">■ Parar</button>}
      {url && <audio controls src={url} className="ml-2" />}
    </div>
  );
}

function Check({ok}){ return <span className={cx('text-xs px-2 py-0.5 rounded', ok?'bg-emerald-100 text-emerald-700':'bg-rose-100 text-rose-700')}>{ok?'✔ correto':'✖ rever'}</span>; }

export default function LessonPlayer({ item, onBack, onMarkDone, isDone }){
  const [step, setStep] = useState(0);
  const lang = item.id.startsWith('fr-') ? 'fr' : 'de';

  // Basic auto-check: we derive 3 tiny questions from vocab/grammar text
  const vocabList = useMemo(()=>{
    // Try to split vocab text into small comma-separated bits
    const raw = (item.vocabPT||'').split(/[;,•\n]+/).map(s=>s.trim()).filter(Boolean);
    return raw.slice(0, 8);
  }, [item]);

  const [ans1,setAns1]=useState(''); const [ok1,setOk1]=useState(null);
  const [ans2,setAns2]=useState(''); const [ok2,setOk2]=useState(null);
  const [ans3,setAns3]=useState(''); const [ok3,setOk3]=useState(null);

  const doCheck = ()=>{
    // naive check: answer must contain at least one token seen in vocab/grammar
    const tokens = (item.vocabPT + ' ' + item.gramatica).toLowerCase().split(/[^a-zà-úäöüßçâêîôû\-]+/).filter(Boolean);
    const scoreToken = (s)=> s.toLowerCase().split(/\s+/).some(t=> tokens.includes(t));
    const r1 = scoreToken(ans1); const r2 = scoreToken(ans2); const r3 = scoreToken(ans3);
    setOk1(r1); setOk2(r2); setOk3(r3);
  };

  const score = (ok1?1:0) + (ok2?1:0) + (ok3?1:0);
  const progressPct = Math.round(((step+1)/stepNames.length)*100);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <button onClick={onBack} className="text-indigo-700 text-sm">← Voltar</button>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-sm">{item.id.startsWith('fr-')?'Francês':'Alemão'} • Lição {item.numero}</div>
            <div className="text-2xl font-semibold">{item.tema}</div>
            <div className="text-xs text-slate-500 mt-1">{item.fase} • <span className="font-medium">{item.tempo}</span></div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDone} onChange={()=>onMarkDone(item.id)} />
            Concluída
          </label>
        </div>

        <div className="mt-4 h-2 bg-slate-200 rounded-full">
          <div className="h-2 bg-indigo-600 rounded-full" style={{width:`${progressPct}%`}} />
        </div>

        {/* Steps Navigation */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {stepNames.map((name,i)=> (
            <button key={i} onClick={()=>setStep(i)} className={cx('px-3 py-1 rounded-md text-sm', step===i?'bg-indigo-600 text-white':'bg-slate-100')}>{i+1}. {name}</button>
          ))}
        </div>

        {/* Step content */}
        <div className="mt-6">
          {step===0 && (
            <div className="space-y-3">
              <div className="text-slate-500 text-sm">Vocabulário (com PT)</div>
              <div className="whitespace-pre-wrap">{item.vocabPT}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {vocabList.map((w,i)=> (
                  <div key={i} className="flex items-center gap-2 border rounded-full px-3 py-1 bg-slate-50">
                    <span className="text-sm">{w}</span>
                    <SpeakBtn text={w} lang={lang} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step===1 && (
            <div className="space-y-3">
              <div className="text-slate-500 text-sm">Gramática</div>
              <div className="whitespace-pre-wrap">{item.gramatica}</div>
            </div>
          )}

          {step===2 && (
            <div className="space-y-4">
              <div className="text-slate-500 text-sm">Exercícios (resposta livre)</div>
              <div>
                <div className="text-sm mb-1">1) Usa uma palavra do vocabulário em contexto</div>
                <input className="w-full border rounded-md p-2" value={ans1} onChange={e=>setAns1(e.target.value)} placeholder="Escreve a tua frase…" />
                {ok1!==null && <div className="mt-1"><Check ok={ok1} /></div>}
              </div>
              <div>
                <div className="text-sm mb-1">2) Conjuga uma frase no tempo desta lição</div>
                <input className="w-full border rounded-md p-2" value={ans2} onChange={e=>setAns2(e.target.value)} placeholder="Ex.: Je vais…, Ich habe…, etc." />
                {ok2!==null && <div className="mt-1"><Check ok={ok2} /></div>}
              </div>
              <div>
                <div className="text-sm mb-1">3) Traduz uma expressão do PT para o idioma alvo</div>
                <input className="w-full border rounded-md p-2" value={ans3} onChange={e=>setAns3(e.target.value)} placeholder="Escreve a tradução…" />
                {ok3!==null && <div className="mt-1"><Check ok={ok3} /></div>}
              </div>
              <button onClick={doCheck} className="px-3 py-1 rounded bg-indigo-600 text-white">Verificar</button>
            </div>
          )}

          {step===3 && (
            <div className="space-y-4">
              <div className="text-slate-500 text-sm">Avaliação oral (grava e ouve)</div>
              <Recorder />
              <div className="text-slate-500 text-sm mt-4">Sugestão de enunciado</div>
              <div className="text-sm whitespace-pre-wrap">
                {`Fala 45–60s sobre: ${item.tema}\nUsa o tempo: ${item.tempo}\nInclui 3 palavras do vocabulário.`}
              </div>
            </div>
          )}

          {step===4 && (
            <div className="space-y-3">
              <div className="text-slate-500 text-sm">Resumo da lição</div>
              <div className="text-sm">Pontuação (exercícios): <span className="font-semibold">{score}/3</span></div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isDone} onChange={()=>onMarkDone(item.id)} />
                  Marcar como concluída
                </label>
                {isDone && <span className="text-xs text-emerald-700">✔ Guardado</span>}
              </div>
              <div className="text-xs text-slate-500">As respostas não saem do teu computador (guardado localmente).</div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          <button disabled={step===0} onClick={()=>setStep(s=>Math.max(0,s-1))} className={cx('px-3 py-1 rounded', step===0?'bg-slate-200 text-slate-500':'bg-slate-100')}>◀ Anterior</button>
          <button disabled={step===stepNames.length-1} onClick={()=>setStep(s=>Math.min(stepNames.length-1,s+1))} className={cx('px-3 py-1 rounded bg-indigo-600 text-white', step===stepNames.length-1 && 'opacity-50')}>Seguinte ▶</button>
        </div>
      </div>
    </div>
  );
}
