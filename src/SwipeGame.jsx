import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'

const CHOICE = { right:'fuck', up:'marry', left:'kill', down:'not_sure' }
const BTN_DIR = { fuck:'right', marry:'up', not_sure:'down', kill:'left' }

export default function SwipeGame({ participant_id, onFinish }){
  const [designs, setDesigns] = useState([])
  const [idx, setIdx] = useState(0)
  const [TinderCard, setTinderCard] = useState(null)
  const [err, setErr] = useState(null)

  // Load swipe lib lazily; don't crash if it fails
  useEffect(()=>{ import('react-tinder-card').then(m=>setTinderCard(()=>m.default)).catch(()=>setTinderCard(null)) },[])

  // Load designs from Supabase, else from local JSON
  useEffect(()=>{(async()=>{
    try{
      if(supabase){
        const { data, error } = await supabase.from('designs').select('*').limit(200)
        if(!error && data && data.length){ setDesigns(shuffle(data)); return }
      }
      const res = await fetch('/designs/index.json',{cache:'no-store'})
      const data = await res.json()
      setDesigns(shuffle(data))
    }catch(e){ console.error(e); setErr('Failed to load designs') }
  })()},[])

  const record = async(choice, design)=>{
    try{
      if(supabase && participant_id && design?.id){
        await supabase.from('swipes').insert({ participant_id, design_id: design.id, choice })
      }
    }catch(e){ console.warn('swipe insert failed', e) }
  }

  const onSwipe = async (dir)=>{
    const choice = CHOICE[dir]; if(!choice) return
    const current = designs[idx]
    await record(choice, current)
    const next = idx + 1; setIdx(next)
    if(next >= designs.length) onFinish?.()
  }

  if(!designs.length){
    return <div className="container center"><div className="card"><div className="title">Loading…</div><p className="subtitle">{err || 'Fetching designs'}</p></div></div>
  }

  const d = designs[idx]; const Card = TinderCard

  return (
    <div className="container">
      <div className="card" style={{padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div className="title">Label rater</div>
          <div className="muted">{idx+1} / {designs.length}</div>
        </div>
        <div className="subtitle">→ FUCK · ↑ MARRY · ↓ NOT SURE · ← KILL</div>
        <div style={{height:12}}/>
        <div className="stage">
          {Card ? (
            <Card key={d.id || idx} onSwipe={onSwipe} preventSwipe={[]}>
              <img src={d.image_url} alt="" className="design"/>
            </Card>
          ) : (
            <img src={d.image_url} alt="" className="design"/>
          )}
        </div>
        <div className="stack">
          {['fuck','marry','not_sure','kill'].map(k =>
            <button key={k} className="pill" onClick={()=>onSwipe(BTN_DIR[k])}>{k.replace('_',' ').toUpperCase()}</button>
          )}
        </div>
      </div>
    </div>
  )
}
function shuffle(a){ return [...a].sort(()=>Math.random()-.5) }
