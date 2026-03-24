import { useState, useEffect } from "react";

// ── API ──────────────────────────────────────────────────────────────────────
async function askClaude(prompt, system = "") {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      ...(system && { system }),
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error.message);
  return d.content[0].text;
}

// ── Storage ──────────────────────────────────────────────────────────────────
const store = {
  async get(key) {
    try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; }
    catch { return null; }
  },
  async set(key, val) {
    try { await window.storage.set(key, JSON.stringify(val)); } catch {}
  },
};

// ── Themes ───────────────────────────────────────────────────────────────────
const LIGHT = {
  bg:"#F5F0E8", card:"#FDFAF4", primary:"#5A3E2B", accent:"#9B6A2A",
  text:"#33220E", muted:"#7A6652", border:"#DDD0B5", green:"#3A6B50",
  hi:"#EDE5D4", verseCard:"#FDF5E6", prayCard:"#EBF5F0",
  navBg:"#FDFAF4", navBorder:"#DDD0B5", hdr:"#5A3E2B", hdrText:"#F5F0E8",
  hdrSub:"#C4A882", toggleBg:"rgba(255,255,255,0.15)", toggleBorder:"rgba(255,255,255,0.28)",
};
const DARK = {
  bg:"#141009", card:"#1D1610", primary:"#CCA06A", accent:"#C4903A",
  text:"#EAD9C0", muted:"#8E7A66", border:"#312819", green:"#52956A",
  hi:"#261E13", verseCard:"#1E160C", prayCard:"#152018",
  navBg:"#1D1610", navBorder:"#312819", hdr:"#1D1610", hdrText:"#EAD9C0",
  hdrSub:"#7A6652", toggleBg:"#281F13", toggleBorder:"#312819",
};

// ── Style helpers ─────────────────────────────────────────────────────────────
const Cd = (T,x={}) => ({ background:T.card, borderRadius:14, border:`1px solid ${T.border}`, padding:"18px 16px", marginBottom:14, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", ...x });
const Bt = (T,v="primary",x={}) => ({ padding:"11px 18px", borderRadius:10, border:"none", cursor:"pointer", fontFamily:"'Lora',serif", fontSize:14, fontWeight:500, transition:"all 0.2s", ...(v==="primary"&&{background:T.primary,color:T.bg}), ...(v==="outline"&&{background:"transparent",color:T.primary,border:`1.5px solid ${T.primary}`}), ...(v==="ghost"&&{background:"transparent",color:T.muted,padding:"8px 10px"}), ...x });
const In = (T,x={}) => ({ display:"block", width:"100%", marginTop:6, padding:"10px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bg, fontFamily:"'Lora',serif", fontSize:14, color:T.text, outline:"none", transition:"border-color 0.2s", ...x });
const lb = (T) => ({ fontSize:11, color:T.muted, textTransform:"uppercase", letterSpacing:0.8, fontFamily:"'Lora',serif" });
const H2 = (T) => ({ fontFamily:"'Playfair Display',serif", color:T.text, fontSize:22, fontWeight:700, marginBottom:2 });
const Sb = (T) => ({ color:T.muted, fontSize:12, fontStyle:"italic", marginBottom:20, fontFamily:"'Lora',serif" });
const PG = { padding:"18px 16px 86px" };

// ── Reading Plan ──────────────────────────────────────────────────────────────
const PLAN = [
  {ref:"Genesis 1:1–31",       title:"In the Beginning"},
  {ref:"Genesis 2:15–25",      title:"Garden & Union"},
  {ref:"Genesis 12:1–9",       title:"Called to Go"},
  {ref:"Exodus 14:10–31",      title:"The Sea Parts"},
  {ref:"Ruth 1:1–18",          title:"Where You Go, I Will Go"},
  {ref:"Psalm 1:1–6",          title:"Two Paths"},
  {ref:"Psalm 23:1–6",         title:"The Lord Is My Shepherd"},
  {ref:"Psalm 34:1–22",        title:"Taste and See"},
  {ref:"Psalm 91:1–16",        title:"Safe in His Shadow"},
  {ref:"Psalm 103:1–22",       title:"Bless the Lord"},
  {ref:"Psalm 121:1–8",        title:"My Help Comes from the Lord"},
  {ref:"Psalm 139:1–18",       title:"Known & Wonderfully Made"},
  {ref:"Proverbs 3:1–12",      title:"Trust in the Lord"},
  {ref:"Proverbs 31:10–31",    title:"A Virtuous Partner"},
  {ref:"Isaiah 40:28–31",      title:"Renewed Strength"},
  {ref:"Isaiah 43:1–7",        title:"You Are Mine"},
  {ref:"Isaiah 55:1–11",       title:"Come to the Waters"},
  {ref:"Jeremiah 29:11–13",    title:"Plans for a Future"},
  {ref:"Matthew 5:1–12",       title:"The Beatitudes"},
  {ref:"Matthew 6:25–34",      title:"Do Not Worry"},
  {ref:"John 3:1–21",          title:"Born Again"},
  {ref:"John 15:1–17",         title:"The True Vine"},
  {ref:"Romans 5:1–11",        title:"Peace with God"},
  {ref:"Romans 8:28–39",       title:"More Than Conquerors"},
  {ref:"1 Corinthians 13",     title:"The Love Chapter"},
  {ref:"Galatians 5:16–26",    title:"Fruit of the Spirit"},
  {ref:"Ephesians 3:14–21",    title:"Rooted in Love"},
  {ref:"Philippians 4:4–13",   title:"Peace Beyond Understanding"},
  {ref:"Colossians 3:12–17",   title:"Clothed in Love"},
  {ref:"1 John 4:7–21",        title:"God Is Love"},
];

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ═══════════════════════════════════════════════════════
// DEVOTIONAL
// ═══════════════════════════════════════════════════════
function DevotionalTab({T}) {
  const today = new Date();
  const planIdx = (today.getDate()-1) % PLAN.length;
  const dateStr = today.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});

  const [src,setSrc] = useState("today");
  const [chosenIdx,setChosenIdx] = useState(planIdx);
  const [customRef,setCustomRef] = useState("");
  const [devo,setDevo] = useState(null);
  const [loading,setLoading] = useState(false);

  const passage = src==="today" ? PLAN[planIdx] : src==="choose" ? PLAN[chosenIdx] : {ref:customRef.trim(),title:"Custom Passage"};

  const generate = async () => {
    if (!passage.ref) return;
    setLoading(true); setDevo(null);
    try {
      const txt = await askClaude(
        `Write a warm devotional for a couple studying the Bible together about "${passage.ref}" (${passage.title!=="Custom Passage"?passage.title:passage.ref}). Include exactly three labeled sections:\n\nKey Verse: (2–3 powerful lines from the passage)\nReflection: (3–4 sentences of spiritual reflection)\nTogether Today: (1–2 sentences for the couple to apply today)\n\nBe heartfelt, intimate, and encouraging.`,
        "You are a warm Bible study guide for couples. Be personal and spiritually rich."
      );
      setDevo(txt);
    } catch { setDevo("Unable to generate right now — please try again."); }
    setLoading(false);
  };

  const parse = (txt) => {
    const kv = txt.match(/Key Verse:(.*?)(?=Reflection:|$)/s)?.[1]?.trim();
    const rf = txt.match(/Reflection:(.*?)(?=Together Today:|$)/s)?.[1]?.trim();
    const tg = txt.match(/Together Today:(.*?)$/s)?.[1]?.trim();
    return {kv,rf,tg,raw:!kv?txt:null};
  };

  const s = devo ? parse(devo) : null;

  const SrcBtn = ({id,label}) => (
    <button onClick={()=>{setSrc(id);setDevo(null);}}
      style={{flex:1,padding:"8px 4px",border:`1px solid ${src===id?T.primary:T.border}`,borderRadius:8,background:src===id?T.primary:"transparent",color:src===id?T.bg:T.muted,cursor:"pointer",fontFamily:"'Lora',serif",fontSize:12,transition:"all 0.2s"}}>
      {label}
    </button>
  );

  return (
    <div style={PG}>
      <div style={{marginBottom:16}}><div style={H2(T)}>Today's Devotional</div><div style={Sb(T)}>{dateStr}</div></div>

      <div style={{display:"flex",gap:6,marginBottom:14}}>
        <SrcBtn id="today" label="📋 Today's Plan"/>
        <SrcBtn id="choose" label="📚 Choose"/>
        <SrcBtn id="custom" label="✏️ Custom"/>
      </div>

      {src==="choose" && (
        <div style={Cd(T,{marginBottom:14})}>
          <span style={lb(T)}>Select a passage</span>
          <select value={chosenIdx} onChange={e=>{setChosenIdx(+e.target.value);setDevo(null);}} style={In(T)}>
            {PLAN.map((p,i)=><option key={i} value={i}>{p.ref} — {p.title}</option>)}
          </select>
        </div>
      )}

      {src==="custom" && (
        <div style={Cd(T,{marginBottom:14})}>
          <span style={lb(T)}>Enter passage reference</span>
          <input value={customRef} onChange={e=>{setCustomRef(e.target.value);setDevo(null);}} placeholder="e.g. Ruth 1:16–17, Micah 6:8…" style={In(T)}/>
        </div>
      )}

      <div style={{...Cd(T),borderLeft:`4px solid ${T.primary}`}}>
        <div style={{fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>
          {src==="today"?"Reading Plan · Today":src==="choose"?"Selected Passage":"Custom Passage"}
        </div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:T.text,fontWeight:600}}>
          {passage.title!=="Custom Passage"?passage.title:(passage.ref||"Enter a reference above")}
        </div>
        {passage.title!=="Custom Passage"&&<div style={{color:T.accent,fontSize:13,marginTop:3,fontStyle:"italic"}}>{passage.ref}</div>}
      </div>

      {!devo&&!loading&&(
        <div style={{textAlign:"center",padding:"28px 0"}}>
          <div style={{fontSize:50,marginBottom:12}}>🕊️</div>
          <p style={{color:T.muted,fontSize:13,fontStyle:"italic",marginBottom:22,lineHeight:1.7}}>Generate a personalized devotional<br/>for you and your partner</p>
          <button style={Bt(T,"primary")} onClick={generate} disabled={src==="custom"&&!customRef.trim()}>Generate Devotional</button>
        </div>
      )}

      {loading&&(
        <div style={{textAlign:"center",padding:"32px 0",color:T.muted,fontStyle:"italic",fontSize:13}}>
          <div style={{fontSize:44,marginBottom:12}}>✨</div>Preparing your devotional…
        </div>
      )}

      {s&&!loading&&(
        <>
          {s.kv&&<div style={{...Cd(T),background:T.verseCard,borderColor:T.accent}}><div style={{fontSize:10,color:T.accent,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>📖 Key Verse</div><p style={{color:T.text,fontSize:15,lineHeight:1.85,fontStyle:"italic"}}>{s.kv}</p></div>}
          {s.rf&&<div style={Cd(T)}><div style={{fontSize:10,color:T.primary,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🌿 Reflection</div><p style={{color:T.text,fontSize:14,lineHeight:1.9}}>{s.rf}</p></div>}
          {s.tg&&<div style={{...Cd(T),background:T.prayCard,borderColor:T.green}}><div style={{fontSize:10,color:T.green,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>💑 Together Today</div><p style={{color:T.text,fontSize:14,lineHeight:1.85}}>{s.tg}</p></div>}
          {s.raw&&<div style={Cd(T)}><p style={{color:T.text,fontSize:14,lineHeight:1.9}}>{s.raw}</p></div>}
          <button style={{...Bt(T,"outline"),width:"100%",marginTop:4}} onClick={generate}>↻ New Reflection</button>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// JOURNAL
// ═══════════════════════════════════════════════════════
function JournalTab({T}) {
  const [entries,setEntries] = useState([]);
  const [view,setView] = useState("list");
  const [sel,setSel] = useState(null);
  const [form,setForm] = useState({who:"Both",title:"",passage:"",notes:""});
  const [saving,setSaving] = useState(false);

  useEffect(()=>{store.get("journal").then(d=>d&&setEntries(d));},[]);

  const save = async()=>{
    if(!form.title.trim()||!form.notes.trim()) return;
    setSaving(true);
    const e={id:Date.now(),date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),...form};
    const u=[e,...entries]; setEntries(u); await store.set("journal",u);
    setForm({who:"Both",title:"",passage:"",notes:""}); setSaving(false); setView("list");
  };

  const del = async(id)=>{
    const u=entries.filter(e=>e.id!==id); setEntries(u); await store.set("journal",u); setView("list");
  };

  if(view==="add") return(
    <div style={PG}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
        <button style={Bt(T,"ghost")} onClick={()=>setView("list")}>← Back</button>
        <div style={{...H2(T),marginBottom:0}}>New Entry</div>
      </div>
      <div style={Cd(T)}>
        {[["who","Who's writing",null,["Both","Me","My Partner"]],["title","Title","What did God speak to you about?",null],["passage","Scripture (optional)","e.g. John 3:16",null],["notes","Reflections & Notes","Your thoughts, questions, revelations…",null]].map(([k,label,ph,opts])=>(
          <div key={k} style={{display:"block",marginBottom:12}}>
            <span style={lb(T)}>{label}</span>
            {opts ? (
              <select value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} style={In(T)}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            ) : k==="notes" ? (
              <textarea value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={ph} rows={6} style={{...In(T),resize:"vertical"}}/>
            ) : (
              <input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={ph} style={In(T)}/>
            )}
          </div>
        ))}
        <button style={{...Bt(T,"primary"),width:"100%"}} onClick={save} disabled={saving}>{saving?"Saving…":"Save Entry ✓"}</button>
      </div>
    </div>
  );

  if(view==="read"&&sel) return(
    <div style={PG}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <button style={Bt(T,"ghost")} onClick={()=>setView("list")}>← Back</button>
        <button style={{...Bt(T,"ghost"),color:"#C0392B",fontSize:13}} onClick={()=>del(sel.id)}>Delete</button>
      </div>
      <div style={{...Cd(T),borderLeft:`4px solid ${T.accent}`}}>
        <div style={{fontSize:11,color:T.muted,marginBottom:4}}>{sel.date} · {sel.who}</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:T.text,fontWeight:600,marginBottom:4}}>{sel.title}</div>
        {sel.passage&&<div style={{color:T.accent,fontStyle:"italic",fontSize:13,marginBottom:14}}>{sel.passage}</div>}
        <p style={{color:T.text,lineHeight:1.9,fontSize:14,whiteSpace:"pre-wrap"}}>{sel.notes}</p>
      </div>
    </div>
  );

  return(
    <div style={PG}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
        <div><div style={H2(T)}>Journal</div><div style={Sb(T)}>Your shared study notes</div></div>
        <button style={Bt(T,"primary")} onClick={()=>setView("add")}>+ New</button>
      </div>
      {entries.length===0?(
        <div style={{textAlign:"center",padding:"40px 0",color:T.muted}}>
          <div style={{fontSize:52,marginBottom:12}}>📓</div>
          <p style={{fontStyle:"italic",fontSize:13,lineHeight:1.7}}>Your journal is empty.<br/>Start your first entry!</p>
        </div>
      ):entries.map(e=>(
        <div key={e.id} style={{...Cd(T),cursor:"pointer"}} onClick={()=>{setSel(e);setView("read");}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.text,fontWeight:600}}>{e.title}</div>
              {e.passage&&<div style={{color:T.accent,fontSize:12,fontStyle:"italic",marginTop:2}}>{e.passage}</div>}
              <p style={{color:T.muted,fontSize:12,marginTop:5,lineHeight:1.55}}>{e.notes.slice(0,90)}{e.notes.length>90?"…":""}</p>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:10,color:T.muted}}>{e.date}</div>
              <div style={{fontSize:10,color:T.primary,marginTop:2}}>{e.who}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════
function CalendarTab({T}) {
  const today = new Date();
  const todayKey = fmtDate(today);

  const [month,setMonth] = useState(new Date(today.getFullYear(),today.getMonth(),1));
  const [sel,setSel] = useState(todayKey);
  const [dayData,setDayData] = useState(null);
  const [dots,setDots] = useState(new Set());
  const [vMode,setVMode] = useState(null);
  const [ownRef,setOwnRef] = useState("");
  const [ownVerse,setOwnVerse] = useState("");
  const [noteText,setNoteText] = useState("");
  const [noteWho,setNoteWho] = useState("Me");
  const [genLoad,setGenLoad] = useState(false);

  useEffect(()=>{
    (async()=>{try{const r=await window.storage.list("cal:");if(r?.keys)setDots(new Set(r.keys.map(k=>k.replace("cal:",""))));} catch{}})();
  },[month]);

  useEffect(()=>{
    if(!sel) return;
    store.get(`cal:${sel}`).then(d=>{setDayData(d);setVMode(null);setOwnRef("");setOwnVerse("");setNoteText("");});
  },[sel]);

  const persist = async(nd)=>{
    await store.set(`cal:${sel}`,nd);
    setDayData(nd);
    setDots(s=>new Set([...s,sel]));
  };

  const saveOwn = async()=>{
    if(!ownRef.trim()) return;
    await persist({...(dayData||{}),reference:ownRef,verse:ownVerse,notes:dayData?.notes||[]});
    setVMode(null);
  };

  const autoGen = async()=>{
    setGenLoad(true);
    try{
      const lbl = new Date(sel+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric"});
      const txt = await askClaude(
        `Choose one beautiful, uplifting Bible verse for a couple on ${lbl}. Return ONLY valid JSON (no markdown): {"reference":"Book Chapter:Verse","verse":"full verse text"}`,
        "You are a Bible verse curator. Return only valid JSON."
      );
      const p = JSON.parse(txt.replace(/```json|```/g,"").trim());
      await persist({...(dayData||{}),reference:p.reference,verse:p.verse,notes:dayData?.notes||[]});
    } catch{alert("Could not generate verse. Try again!");}
    setGenLoad(false);
  };

  const addNote = async()=>{
    if(!noteText.trim()) return;
    const n={id:Date.now(),who:noteWho,text:noteText,date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})};
    await persist({...(dayData||{reference:"",verse:""}),notes:[n,...(dayData?.notes||[])]});
    setNoteText("");
  };

  const removeNote = async(id)=>{
    await persist({...dayData,notes:dayData.notes.filter(n=>n.id!==id)});
  };

  const y=month.getFullYear(), m=month.getMonth();
  const firstDay=new Date(y,m,1).getDay();
  const daysInMonth=new Date(y,m+1,0).getDate();
  const monthName=month.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const cells=[];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);

  const selLabel = sel ? new Date(sel+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}) : "";

  return(
    <div style={PG}>
      <div style={H2(T)}>Verse Calendar</div>
      <div style={Sb(T)}>Daily verse & discussion</div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button style={{...Bt(T,"ghost"),fontSize:22,padding:"4px 10px"}} onClick={()=>setMonth(new Date(y,m-1,1))}>‹</button>
        <span style={{fontFamily:"'Playfair Display',serif",color:T.text,fontSize:16,fontWeight:600}}>{monthName}</span>
        <button style={{...Bt(T,"ghost"),fontSize:22,padding:"4px 10px"}} onClick={()=>setMonth(new Date(y,m+1,1))}>›</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d,i)=>(
          <div key={i} style={{textAlign:"center",fontSize:10,color:T.muted,paddingBottom:4,fontFamily:"'Lora',serif"}}>{d}</div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:20}}>
        {cells.map((day,i)=>{
          if(!day) return <div key={i} style={{aspectRatio:"1"}}/>;
          const key=`${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isToday=key===todayKey, isSel=key===sel, hasDot=dots.has(key);
          return(
            <button key={i} onClick={()=>setSel(key)} style={{
              aspectRatio:"1", border:isSel?`2px solid ${T.primary}`:`1px solid ${isToday?T.accent:T.border}`,
              borderRadius:10, background:isSel?T.primary:isToday?T.hi:T.card,
              cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:2, transition:"all 0.15s", padding:0,
            }}>
              <span style={{fontSize:12,color:isSel?T.bg:T.text,fontFamily:"'Lora',serif",fontWeight:isSel||isToday?700:400,lineHeight:1}}>{day}</span>
              {hasDot&&<span style={{width:4,height:4,borderRadius:"50%",background:isSel?T.bg:T.accent,flexShrink:0}}/>}
            </button>
          );
        })}
      </div>

      {sel&&(
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",color:T.text,fontSize:15,fontWeight:600,marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${T.border}`}}>
            {selLabel}
          </div>

          <div style={{...Cd(T),borderColor:dayData?.verse?T.accent:T.border}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span style={{fontSize:10,color:T.accent,textTransform:"uppercase",letterSpacing:1}}>📖 Verse of the Day</span>
              {dayData?.verse&&(
                <button onClick={()=>{setVMode("own");setOwnRef(dayData.reference);setOwnVerse(dayData.verse);}}
                  style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:12,fontFamily:"'Lora',serif"}}>✎ Edit</button>
              )}
            </div>
            {dayData?.verse?(
              <>
                <p style={{fontStyle:"italic",color:T.text,fontSize:15,lineHeight:1.85,marginBottom:8}}>"{dayData.verse}"</p>
                <div style={{color:T.accent,fontSize:13,textAlign:"right",fontStyle:"italic"}}>— {dayData.reference}</div>
              </>
            ):(
              <p style={{color:T.muted,fontStyle:"italic",fontSize:13,lineHeight:1.65,marginBottom:12}}>No verse set for this day yet.</p>
            )}
            {!dayData?.verse&&vMode===null&&(
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button style={{...Bt(T,"primary"),flex:1,fontSize:13}} onClick={autoGen} disabled={genLoad}>{genLoad?"Generating…":"✨ Auto-Generate"}</button>
                <button style={{...Bt(T,"outline"),flex:1,fontSize:13}} onClick={()=>setVMode("own")}>✎ Set My Own</button>
              </div>
            )}
          </div>

          {vMode==="own"&&(
            <div style={Cd(T)}>
              <div style={{display:"block",marginBottom:12}}>
                <span style={lb(T)}>Reference</span>
                <input value={ownRef} onChange={e=>setOwnRef(e.target.value)} placeholder="e.g. John 3:16" style={In(T)}/>
              </div>
              <div style={{display:"block",marginBottom:14}}>
                <span style={lb(T)}>Verse Text</span>
                <textarea value={ownVerse} onChange={e=>setOwnVerse(e.target.value)} placeholder="Type the verse…" rows={3} style={{...In(T),resize:"vertical"}}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{...Bt(T,"primary"),flex:1}} onClick={saveOwn}>Save Verse</button>
                <button style={Bt(T,"outline")} onClick={()=>setVMode(null)}>Cancel</button>
              </div>
            </div>
          )}

          {dayData?.verse&&(
            <div style={{marginTop:4}}>
              <div style={{fontSize:10,color:T.primary,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>💬 Discussion Notes</div>
              <div style={Cd(T)}>
                <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                  {["Me","My Partner","Both"].map(w=>(
                    <button key={w} onClick={()=>setNoteWho(w)}
                      style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${noteWho===w?T.primary:T.border}`,background:noteWho===w?T.primary:"transparent",color:noteWho===w?T.bg:T.muted,fontSize:11,cursor:"pointer",fontFamily:"'Lora',serif",transition:"all 0.15s"}}>
                      {w}
                    </button>
                  ))}
                </div>
                <textarea value={noteText} onChange={e=>setNoteText(e.target.value)}
                  placeholder="Share your thoughts on today's verse…" rows={3} style={{...In(T),resize:"vertical",marginBottom:10}}/>
                <button style={{...Bt(T,"primary"),width:"100%"}} onClick={addNote} disabled={!noteText.trim()}>Post Note</button>
              </div>

              {(!dayData.notes||dayData.notes.length===0)?(
                <div style={{textAlign:"center",padding:"14px 0",color:T.muted,fontSize:13,fontStyle:"italic"}}>No notes yet — start the discussion! 💬</div>
              ):(dayData.notes||[]).map(n=>(
                <div key={n.id} style={{...Cd(T),borderLeft:`3px solid ${T.accent}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:11,color:T.primary,fontWeight:600}}>{n.who}</span>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <span style={{fontSize:11,color:T.muted}}>{n.date}</span>
                      <button onClick={()=>removeNote(n.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:17,lineHeight:1,padding:0}}>×</button>
                    </div>
                  </div>
                  <p style={{color:T.text,fontSize:14,lineHeight:1.8}}>{n.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TRIVIA
// ═══════════════════════════════════════════════════════
function TriviaTab({T}) {
  const [phase,setPhase] = useState("setup");
  const [q,setQ] = useState(null);
  const [chosen,setChosen] = useState(null);
  const [score,setScore] = useState({right:0,total:0});
  const [diff,setDiff] = useState("Medium");
  const [cat,setCat] = useState("Mixed");

  const loadQ = async()=>{
    setPhase("loading"); setChosen(null);
    try{
      const txt = await askClaude(
        `Generate one ${diff} Bible trivia question about: ${cat}. Return ONLY valid JSON: {"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A","explanation":"..."}`,
        "You are a Bible trivia expert. Return only valid JSON."
      );
      setQ(JSON.parse(txt.replace(/```json|```/g,"").trim()));
      setPhase("question");
    } catch{setPhase("setup");alert("Error loading question — try again!");}
  };

  const pick=(opt)=>{
    if(chosen) return;
    const l=opt.charAt(0); setChosen(l);
    setScore(s=>({right:s.right+(l===q.answer?1:0),total:s.total+1}));
    setPhase("reveal");
  };

  const oS=(opt)=>{
    const l=opt.charAt(0);
    if(!chosen) return {bg:T.card,br:T.border,col:T.text};
    if(l===q.answer) return {bg:T.prayCard,br:T.green,col:T.green};
    if(l===chosen) return {bg:"#FEF0EF",br:"#C0392B",col:"#C0392B"};
    return {bg:T.card,br:T.border,col:T.muted};
  };

  if(phase==="setup") return(
    <div style={PG}>
      <div style={H2(T)}>Bible Trivia</div>
      <div style={Sb(T)}>Challenge each other! 🎯</div>
      {score.total>0&&(
        <div style={{...Cd(T),textAlign:"center",borderColor:T.accent,background:T.verseCard}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:38,color:T.primary}}>{score.right}<span style={{fontSize:18,color:T.muted}}>/{score.total}</span></div>
          <div style={{color:T.muted,fontSize:12,marginTop:3}}>correct this session</div>
        </div>
      )}
      <div style={Cd(T)}>
        <div style={{display:"block",marginBottom:12}}>
          <span style={lb(T)}>Difficulty</span>
          <select value={diff} onChange={e=>setDiff(e.target.value)} style={In(T)}>
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
        </div>
        <div style={{display:"block",marginBottom:16}}>
          <span style={lb(T)}>Category</span>
          <select value={cat} onChange={e=>setCat(e.target.value)} style={In(T)}>
            <option>Mixed</option><option>Old Testament</option><option>New Testament</option>
            <option>The Gospels</option><option>Psalms & Proverbs</option><option>Paul's Letters</option>
          </select>
        </div>
        <button style={{...Bt(T,"primary"),width:"100%"}} onClick={loadQ}>Start Trivia ▶</button>
      </div>
    </div>
  );

  if(phase==="loading") return(
    <div style={{...PG,textAlign:"center",paddingTop:70}}>
      <div style={{fontSize:52,marginBottom:14}}>🎯</div>
      <div style={{color:T.muted,fontStyle:"italic",fontSize:13}}>Loading your question…</div>
    </div>
  );

  return(
    <div style={PG}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <button style={Bt(T,"ghost")} onClick={()=>setPhase("setup")}>← Settings</button>
        <div style={{fontSize:13,color:T.primary,fontWeight:600}}>Score: {score.right}/{score.total}</div>
      </div>
      <div style={{fontSize:10,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:0.7}}>{diff} · {cat}</div>
      <div style={{...Cd(T),borderLeft:`4px solid ${T.primary}`,marginBottom:18}}>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:T.text,lineHeight:1.6}}>{q?.question}</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:16}}>
        {q?.options.map(opt=>{
          const s=oS(opt);
          return(
            <button key={opt} onClick={()=>pick(opt)} style={{padding:"13px 14px",borderRadius:10,border:`1.5px solid ${s.br}`,background:s.bg,color:s.col,fontFamily:"'Lora',serif",fontSize:14,cursor:chosen?"default":"pointer",textAlign:"left",transition:"all 0.25s"}}>
              {opt}
            </button>
          );
        })}
      </div>
      {phase==="reveal"&&q&&(
        <>
          <div style={{...Cd(T),background:T.verseCard,borderColor:T.accent}}>
            <div style={{fontSize:10,color:T.accent,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>💡 Explanation</div>
            <p style={{color:T.text,fontSize:13,lineHeight:1.8}}>{q.explanation}</p>
          </div>
          <button style={{...Bt(T,"primary"),width:"100%"}} onClick={loadQ}>Next Question ▶</button>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PRAYERS
// ═══════════════════════════════════════════════════════
function PrayersTab({T}) {
  const [prayers,setPrayers] = useState([]);
  const [adding,setAdding] = useState(false);
  const [form,setForm] = useState({who:"Both",request:"",category:"Personal"});
  const [filter,setFilter] = useState("Active");

  useEffect(()=>{store.get("prayers").then(d=>d&&setPrayers(d));},[]);

  const save=async()=>{
    if(!form.request.trim()) return;
    const p={id:Date.now(),date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}),answered:false,...form};
    const u=[p,...prayers]; setPrayers(u); await store.set("prayers",u);
    setForm({who:"Both",request:"",category:"Personal"}); setAdding(false);
  };

  const toggle=async(id)=>{
    const u=prayers.map(p=>p.id===id?{...p,answered:!p.answered}:p);
    setPrayers(u); await store.set("prayers",u);
  };

  const remove=async(id)=>{
    const u=prayers.filter(p=>p.id!==id); setPrayers(u); await store.set("prayers",u);
  };

  const visible=prayers.filter(p=>filter==="Active"?!p.answered:p.answered);
  const counts={Active:prayers.filter(p=>!p.answered).length,Answered:prayers.filter(p=>p.answered).length};

  return(
    <div style={PG}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div><div style={H2(T)}>Prayer Tracker</div><div style={Sb(T)}>Pray together, grow together</div></div>
        <button style={Bt(T,"primary")} onClick={()=>setAdding(!adding)}>{adding?"✕":"+ Add"}</button>
      </div>

      {adding&&(
        <div style={{...Cd(T),borderColor:T.primary}}>
          {[["who","Requesting",null,["Both","Me","My Partner"]],["category","Category",null,["Personal","Relationship","Family","Health","Work","Gratitude","Others"]],["request","Prayer Request","What are you bringing before God today?",null]].map(([k,label,ph,opts])=>(
            <div key={k} style={{display:"block",marginBottom:12}}>
              <span style={lb(T)}>{label}</span>
              {opts?(
                <select value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} style={In(T)}>
                  {opts.map(o=><option key={o}>{o}</option>)}
                </select>
              ):(
                <textarea value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={ph} rows={3} style={{...In(T),resize:"vertical"}}/>
              )}
            </div>
          ))}
          <div style={{display:"flex",gap:8}}>
            <button style={{...Bt(T,"primary"),flex:1}} onClick={save}>Save Prayer 🙏</button>
            <button style={Bt(T,"outline")} onClick={()=>setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:8,marginBottom:18}}>
        {["Active","Answered"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{padding:"6px 16px",borderRadius:20,border:`1px solid ${filter===f?T.primary:T.border}`,background:filter===f?T.primary:"transparent",color:filter===f?T.bg:T.muted,fontSize:12,cursor:"pointer",fontFamily:"'Lora',serif",transition:"all 0.2s"}}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {visible.length===0?(
        <div style={{textAlign:"center",padding:"40px 0",color:T.muted}}>
          <div style={{fontSize:52,marginBottom:12}}>🙏</div>
          <p style={{fontStyle:"italic",fontSize:13,lineHeight:1.7}}>{filter==="Active"?"No active requests.\nAdd one above!":"No answered prayers yet.\nMark requests as answered!"}</p>
        </div>
      ):visible.map(p=>(
        <div key={p.id} style={{...Cd(T),opacity:p.answered?0.85:1}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <button onClick={()=>toggle(p.id)}
              style={{width:24,height:24,borderRadius:6,border:`2px solid ${p.answered?T.green:T.border}`,background:p.answered?T.green:"transparent",cursor:"pointer",flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,transition:"all 0.2s"}}>
              {p.answered?"✓":""}
            </button>
            <div style={{flex:1}}>
              <p style={{color:T.text,fontSize:14,lineHeight:1.7,textDecoration:p.answered?"line-through":"none"}}>{p.request}</p>
              <div style={{display:"flex",gap:8,marginTop:5,flexWrap:"wrap"}}>
                <span style={{fontSize:10,color:T.muted}}>{p.date}</span>
                <span style={{fontSize:10,color:T.accent}}>· {p.category}</span>
                <span style={{fontSize:10,color:T.primary}}>· {p.who}</span>
              </div>
            </div>
            <button onClick={()=>remove(p.id)} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:18,padding:"0 4px",lineHeight:1}}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DISCUSS
// ═══════════════════════════════════════════════════════
function DiscussTab({T}) {
  const [topic,setTopic] = useState("");
  const [questions,setQuestions] = useState([]);
  const [loading,setLoading] = useState(false);
  const [open,setOpen] = useState(null);

  const generate = async()=>{
    if(!topic.trim()) return;
    setLoading(true); setQuestions([]); setOpen(null);
    try{
      const txt = await askClaude(
        `Generate 5 thoughtful Bible discussion questions for a couple about: "${topic}". Return ONLY valid JSON: [{"question":"...","hint":"a short follow-up prompt or reflection idea"}]. Build from understanding → personal application → couples' growth.`,
        "You are a pastoral Bible study facilitator for couples. Return only valid JSON."
      );
      setQuestions(JSON.parse(txt.replace(/```json|```/g,"").trim()));
    } catch{alert("Error generating — try again!");}
    setLoading(false);
  };

  return(
    <div style={PG}>
      <div style={H2(T)}>Discussion</div>
      <div style={Sb(T)}>Deeper conversations together</div>
      <div style={Cd(T)}>
        <div style={{display:"block",marginBottom:14}}>
          <span style={lb(T)}>Passage, Book, or Theme</span>
          <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Proverbs 31, forgiveness, the Beatitudes…" style={In(T)} onKeyDown={e=>e.key==="Enter"&&generate()}/>
        </div>
        <button style={{...Bt(T,"primary"),width:"100%",opacity:!topic.trim()?0.6:1}} onClick={generate} disabled={loading||!topic.trim()}>
          {loading?"Generating…":"Generate Discussion Questions 💬"}
        </button>
      </div>

      {loading&&(
        <div style={{textAlign:"center",padding:"30px 0",color:T.muted,fontStyle:"italic",fontSize:13}}>
          <div style={{fontSize:44,marginBottom:12}}>💬</div>Crafting questions for you two…
        </div>
      )}

      {questions.length>0&&(
        <div>
          <div style={{fontSize:12,color:T.muted,fontStyle:"italic",marginBottom:12,textAlign:"center"}}>Tap a question to reveal a conversation hint</div>
          {questions.map((q,i)=>(
            <div key={i} style={{...Cd(T),cursor:"pointer",borderLeft:`4px solid ${open===i?T.primary:"transparent"}`,transition:"all 0.2s"}} onClick={()=>setOpen(open===i?null:i)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:T.accent,textTransform:"uppercase",letterSpacing:0.8,marginBottom:5}}>Question {i+1}</div>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:T.text,lineHeight:1.55}}>{q.question}</p>
                </div>
                <span style={{color:T.muted,fontSize:14,flexShrink:0}}>{open===i?"▲":"▼"}</span>
              </div>
              {open===i&&q.hint&&(
                <div style={{marginTop:12,padding:"10px 14px",background:T.verseCard,borderRadius:8,borderLeft:`3px solid ${T.accent}`}}>
                  <p style={{color:T.muted,fontSize:13,fontStyle:"italic",lineHeight:1.7}}>💡 {q.hint}</p>
                </div>
              )}
            </div>
          ))}
          <button style={{...Bt(T,"outline"),width:"100%",marginTop:4}} onClick={generate}>↻ Regenerate</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════
const TABS=[
  {id:"devotional",label:"Devo",   emoji:"📖"},
  {id:"journal",   label:"Journal",emoji:"✍️"},
  {id:"calendar",  label:"Verses", emoji:"🗓️"},
  {id:"trivia",    label:"Trivia", emoji:"🎯"},
  {id:"prayers",   label:"Prayers",emoji:"🙏"},
  {id:"discuss",   label:"Discuss",emoji:"💬"},
];

export default function App() {
  const [tab,setTab] = useState("devotional");
  const [dark,setDark] = useState(false);
  const T = dark ? DARK : LIGHT;

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:${T.bg}; transition:background 0.3s; }
        textarea,input,select { outline:none; }
        textarea:focus,input:focus,select:focus { border-color:${T.accent} !important; box-shadow:0 0 0 2px ${T.accent}22; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:4px; }
      `}</style>

      <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",maxWidth:430,margin:"0 auto",fontFamily:"'Lora',serif",transition:"background 0.3s"}}>
        <div style={{background:T.hdr,padding:"14px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 2px 14px rgba(0,0,0,0.2)",transition:"background 0.3s"}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",color:T.hdrText,fontSize:19,fontWeight:700,letterSpacing:0.4}}>Sacred Together</div>
            <div style={{color:T.hdrSub,fontSize:11,fontStyle:"italic",marginTop:1}}>Your Bible Study Companion</div>
          </div>
          <button onClick={()=>setDark(!dark)}
            style={{background:T.toggleBg,border:`1px solid ${T.toggleBorder}`,borderRadius:22,padding:"7px 13px",cursor:"pointer",color:T.hdrText,fontSize:14,transition:"all 0.25s",fontFamily:"'Lora',serif"}}>
            {dark?"☀️ Day":"🌙 Night"}
          </button>
        </div>

        <div style={{flex:1,overflowY:"auto",background:T.bg,transition:"background 0.3s"}}>
          {tab==="devotional"&&<DevotionalTab T={T}/>}
          {tab==="journal"   &&<JournalTab T={T}/>}
          {tab==="calendar"  &&<CalendarTab T={T}/>}
          {tab==="trivia"    &&<TriviaTab T={T}/>}
          {tab==="prayers"   &&<PrayersTab T={T}/>}
          {tab==="discuss"   &&<DiscussTab T={T}/>}
        </div>

        <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:T.navBg,borderTop:`1px solid ${T.navBorder}`,display:"flex",height:58,zIndex:100,boxShadow:`0 -2px 12px rgba(0,0,0,0.12)`,transition:"background 0.3s"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:1,border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,color:tab===t.id?T.primary:T.muted,fontFamily:"'Lora',serif",fontSize:8,borderTop:`2px solid ${tab===t.id?T.primary:"transparent"}`,transition:"all 0.2s",paddingTop:2}}>
              <span style={{fontSize:16}}>{t.emoji}</span>
              <span style={{letterSpacing:0.2}}>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
