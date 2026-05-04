import { useState, useEffect, useRef, useCallback } from "react"
import vegaImg from '../public/vega.jpg'

// ═══════════════════════════════════════════════════════════════
// PALETTE & COSTANTI
// ═══════════════════════════════════════════════════════════════
const GRN="#00ff41", AMB="#ffaa00", CYN="#00d4ff", RED="#ff3344", PRP="#cc44ff"
const BC_CONV = 703.07
const CALYPSO_SERVICE = "0000fd00-0000-1000-8000-00805f9b34fb"
const CALYPSO_WIND_CH = "0000fd01-0000-1000-8000-00805f9b34fb"

// Kestrel 5700 Elite — Nordic UART Service
const KESTREL_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
const KESTREL_TX_CH   = "6e400003-b5a3-f393-e0a9-e50e24dcca9e" // notify

// ═══════════════════════════════════════════════════════════════
// CATALOGO MUNIZIONI
// ═══════════════════════════════════════════════════════════════
const AMMO_CATALOG = {
  RIMFIRE: {
    ".22LR Lapua SLR":      { bc_g7:.065, mv:320, wGr:40, dMm:5.59, zero:50 },
    ".22LR SK LR Match":    { bc_g7:.062, mv:315, wGr:40, dMm:5.59, zero:50 },
    ".22LR CCI SV":         { bc_g7:.058, mv:330, wGr:40, dMm:5.59, zero:50 },
    ".22LR Eley Tenex":     { bc_g7:.066, mv:325, wGr:40, dMm:5.59, zero:50 },
    ".22LR CCI Quiet":      { bc_g7:.052, mv:228, wGr:40, dMm:5.59, zero:50 },
    ".17 HMR V-Max":        { bc_g7:.107, mv:775, wGr:17, dMm:4.39, zero:50 },
    ".22 WMR 40gr":         { bc_g7:.085, mv:580, wGr:40, dMm:5.59, zero:50 },
  },
  "CF PRS": {
    "6mm CM 108gr Berger":  { bc_g7:.331, mv:910, wGr:108, dMm:6.17, zero:100 },
    "6mm CM 115gr DTAC":    { bc_g7:.350, mv:895, wGr:115, dMm:6.17, zero:100 },
    "6.5 CM 140gr Berger":  { bc_g7:.326, mv:845, wGr:140, dMm:6.72, zero:100 },
    "6.5 CM 130gr Hybrid":  { bc_g7:.298, mv:890, wGr:130, dMm:6.72, zero:100 },
    ".308 Win 175gr SMK":   { bc_g7:.243, mv:792, wGr:175, dMm:7.82, zero:100 },
    ".308 Win 185gr Berger":{ bc_g7:.274, mv:778, wGr:185, dMm:7.82, zero:100 },
    ".308 Win 155gr Lapua": { bc_g7:.228, mv:855, wGr:155, dMm:7.82, zero:100 },
  },
  MAGNUM: {
    "7mm RM 180gr Berger":  { bc_g7:.368, mv:915, wGr:180, dMm:7.21, zero:100 },
    ".300 WM 220gr Berger": { bc_g7:.358, mv:883, wGr:220, dMm:7.82, zero:100 },
    ".338 LM 300gr Lapua":  { bc_g7:.381, mv:830, wGr:300, dMm:8.58, zero:100 },
    ".338 LM 285gr Berger": { bc_g7:.417, mv:870, wGr:285, dMm:8.58, zero:100 },
    ".50 BMG 750gr A-Max":  { bc_g7:1.05, mv:887, wGr:750, dMm:12.95,zero:100 },
  },
}
const FLAT = Object.values(AMMO_CATALOG).reduce((a,g)=>({...a,...g}),{})

// ═══════════════════════════════════════════════════════════════
// STAGE LIBRARY
// ═══════════════════════════════════════════════════════════════
const STAGES_BUILTIN = [
  { id:1, name:"Stage 1 — Clean & Kill", desc:"5 bersagli prono", par:90,
    targets:[{id:1,dist:100,shots:1,pos:"Prono"},{id:2,dist:125,shots:1,pos:"Prono"},{id:3,dist:150,shots:1,pos:"Prono"},{id:4,dist:175,shots:1,pos:"Prono"},{id:5,dist:200,shots:1,pos:"Prono"}]},
  { id:2, name:"Stage 2 — Positional", desc:"5 bersagli con cambio posizione", par:90,
    targets:[{id:1,dist:100,shots:2,pos:"Prono"},{id:2,dist:150,shots:2,pos:"Barricata SX"},{id:3,dist:200,shots:1,pos:"Barricata DX"},{id:4,dist:125,shots:2,pos:"In ginocchio"},{id:5,dist:175,shots:1,pos:"Prono"}]},
  { id:3, name:"Stage 3 — Speed Steel", desc:"6 bersagli rapidi 50-100m", par:60,
    targets:[{id:1,dist:50,shots:1,pos:"Prono"},{id:2,dist:50,shots:1,pos:"Prono"},{id:3,dist:75,shots:1,pos:"Prono"},{id:4,dist:75,shots:1,pos:"Prono"},{id:5,dist:100,shots:1,pos:"Prono"},{id:6,dist:100,shots:1,pos:"Prono"}]},
  { id:4, name:"Stage 4 — Long Range", desc:"5 bersagli 200-300m", par:120,
    targets:[{id:1,dist:200,shots:1,pos:"Prono"},{id:2,dist:250,shots:1,pos:"Prono"},{id:3,dist:300,shots:1,pos:"Barricata"},{id:4,dist:250,shots:1,pos:"Prono"},{id:5,dist:200,shots:1,pos:"Prono"}]},
  { id:5, name:"Stage 5 — Barricade Run", desc:"6 bersagli barricata", par:120,
    targets:[{id:1,dist:100,shots:2,pos:"Barricata SX"},{id:2,dist:125,shots:2,pos:"Barricata SX"},{id:3,dist:150,shots:2,pos:"Barricata DX"},{id:4,dist:125,shots:2,pos:"Barricata DX"},{id:5,dist:100,shots:1,pos:"Prono"},{id:6,dist:150,shots:1,pos:"Prono"}]},
]

const WIND_DIRS=[{a:0,l:"N"},{a:45,l:"NE"},{a:90,l:"E"},{a:135,l:"SE"},{a:180,l:"S"},{a:225,l:"SW"},{a:270,l:"W"},{a:315,l:"NW"}]

// ═══════════════════════════════════════════════════════════════
// MOTORE BALISTICO G7 — RK4
// ═══════════════════════════════════════════════════════════════
const G7T=[
  [0,.1198],[.05,.1197],[.1,.1196],[.15,.1194],[.2,.1193],[.25,.1194],
  [.3,.1194],[.4,.1193],[.5,.1194],[.6,.1194],[.65,.1197],[.7,.1202],
  [.75,.1215],[.8,.1242],[.825,.1266],[.85,.1306],[.875,.1368],[.9,.1464],
  [.925,.166],[.95,.2054],[.975,.2993],[1.0,.3803],[1.025,.4015],
  [1.05,.4043],[1.1,.4014],[1.2,.3884],[1.3,.3732],[1.4,.3580],
  [1.5,.3440],[1.6,.3315],[1.7,.3209],[1.8,.3117],[1.9,.3042],
  [2.0,.2980],[2.5,.2709],[3.0,.2470],[4.0,.2104],[5.0,.1832],
]
// Tabella drag G1 — usata per rimfire e proiettili dichiarati in G1
const G1T=[
  [0,.2629],[.05,.2558],[.1,.2487],[.15,.2413],[.2,.2344],[.25,.2278],
  [.3,.2214],[.35,.2155],[.4,.2104],[.45,.2061],[.5,.2032],[.55,.202],
  [.6,.2034],[.65,.2165],[.7,.2534],[.725,.2983],[.75,.3678],[.775,.4732],
  [.8,.6502],[.825,.8726],[.85,1.0],[.875,.9908],[.9,.9297],[.925,.8752],
  [.95,.8483],[.975,.8101],[1.0,.7756],[1.025,.7451],[1.05,.7283],
  [1.1,.7101],[1.2,.6889],[1.3,.6649],[1.4,.6432],[1.5,.6251],
  [1.6,.6100],[1.8,.5860],[2.0,.5692],[2.5,.5483],[3.0,.5323],[5.0,.4900],
]
function g1cd(m){
  if(m<=G1T[0][0])return G1T[0][1]
  if(m>=G1T[G1T.length-1][0])return G1T[G1T.length-1][1]
  for(let i=0;i<G1T.length-1;i++){
    if(m>=G1T[i][0]&&m<=G1T[i+1][0]){
      const f=(m-G1T[i][0])/(G1T[i+1][0]-G1T[i][0])
      return G1T[i][1]+f*(G1T[i+1][1]-G1T[i][1])
    }
  }
  return .26
}

function g7cd(m){
  if(m<=G7T[0][0])return G7T[0][1]
  if(m>=G7T[G7T.length-1][0])return G7T[G7T.length-1][1]
  for(let i=0;i<G7T.length-1;i++){
    if(m>=G7T[i][0]&&m<=G7T[i+1][0]){
      const f=(m-G7T[i][0])/(G7T[i+1][0]-G7T[i][0])
      return G7T[i][1]+f*(G7T[i+1][1]-G7T[i][1])
    }
  }
  return .12
}

function physSolve(dist, ammoKey, scopeH_cm, zeroM, wx={}, profile=null){
  const a=FLAT[ammoKey]; if(!a||dist<=0)return null
  const h=scopeH_cm/100, g=9.80665, dt=.002
  const tk=273.15+(wx.temp??15)
  const rhoAir=Math.exp(-(wx.alt??0)/8500)*(288.15/tk)*1.225
  const sos=331.3*Math.sqrt(tk/273.15)
  // MV: usa cronografo > profilo custom > tabellare
  const mv=wx.mv??profile?.mvMs??a.mv
  // BC: usa valore truato dal profilo se disponibile, altrimenti catalogo
  const bcVal = (profile?.bcValue>0) ? profile.bcValue : a.bc_g7
  // Sempre G7 — il truing BC porta il modello G7 a matchare i dati reali
  const BC_SI = bcVal*BC_CONV
  const cdFn  = g7cd

  const fly=(ang,maxX)=>{
    let vx=mv*Math.cos(ang),vy=mv*Math.sin(ang),x=0,y=-h,t=0
    const acc=(vx2,vy2)=>{
      const v=Math.sqrt(vx2*vx2+vy2*vy2); if(v<1)return[vx2,vy2,0,-g]
      const drag=rhoAir*v*v*cdFn(v/sos)/(2*BC_SI)
      return[vx2,vy2,-drag*vx2/v,-g-drag*vy2/v]
    }
    while(x<maxX+2&&t<8){
      const[dx1,dy1,dvx1,dvy1]=acc(vx,vy)
      const[dx2,dy2,dvx2,dvy2]=acc(vx+dvx1*dt/2,vy+dvy1*dt/2)
      const[dx3,dy3,dvx3,dvy3]=acc(vx+dvx2*dt/2,vy+dvy2*dt/2)
      const[dx4,dy4,dvx4,dvy4]=acc(vx+dvx3*dt,vy+dvy3*dt)
      x+=dt*(dx1+2*dx2+2*dx3+dx4)/6; y+=dt*(dy1+2*dy2+2*dy3+dy4)/6
      vx+=dt*(dvx1+2*dvx2+2*dvx3+dvx4)/6; vy+=dt*(dvy1+2*dvy2+2*dvy3+dvy4)/6; t+=dt
    }
    return{y,t,vEnd:Math.sqrt(vx*vx+vy*vy)}
  }

  let lo=-.5,hi=2,za=0
  for(let i=0;i<60;i++){za=(lo+hi)/2; fly(za,zeroM).y>0?hi=za:lo=za}

  const{y:yTgt,t:tof,vEnd}=fly(za,dist)
  // LOS = y=0 (orizzontale nel sistema scope-referenziato)
  // Bisection garantisce bullet y=0 a x=zeroM
  // drop positivo = proiettile sotto LOS = correzione UP
  const drop=-yTgt
  const dropMoa=drop/dist*(180/Math.PI)*60
  const wComp=(wx.wind??0)*Math.sin((wx.windAngle??90)*Math.PI/180)
  const windMoa=Math.atan2(wComp*(tof-dist/mv),dist)*(180/Math.PI)*60
  const sdMoa=a.dMm>=7.8?1.25*Math.pow(tof,1.83)/(dist/1000)*.05:0
  const energy=.5*(a.wGr*6.48e-5)*vEnd*vEnd

  return{
    dropMoa:+dropMoa.toFixed(2), dropMrad:+(dropMoa/3.4377).toFixed(3),
    windMoa:+windMoa.toFixed(2), windMrad:+(windMoa/3.4377).toFixed(3),
    sdMoa:+sdMoa.toFixed(2), tofMs:+(tof*1000).toFixed(0),
    velMs:+vEnd.toFixed(0), eneJ:+energy.toFixed(0),
    dist, supersonic:vEnd>sos,
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const fmtTime=s=>{
  if(s===null||s===undefined)return"--:--"
  const m=Math.floor(Math.max(0,s)/60), sec=Math.max(0,s)%60
  return String(m).padStart(2,"0")+":"+String(sec).padStart(2,"0")
}

// Conversioni unità
const U = {
  dist:  (m,u)   => u==="imp" ? +(m*1.0936).toFixed(0) : m,
  distL: (u)     => u==="imp" ? "yd" : "m",
  vel:   (ms,u)  => u==="imp" ? +(ms*3.281).toFixed(0) : ms,
  velL:  (u)     => u==="imp" ? "fps" : "m/s",
  len:   (cm,u)  => u==="imp" ? +(cm/2.54).toFixed(2) : cm,
  lenL:  (u)     => u==="imp" ? "in" : "cm",
  temp:  (c,u)   => u==="imp" ? +(c*9/5+32).toFixed(0) : c,
  tempL: (u)     => u==="imp" ? "°F" : "°C",
  alt:   (m,u)   => u==="imp" ? +(m*3.281).toFixed(0) : m,
  altL:  (u)     => u==="imp" ? "ft" : "m",
  en:    (j,u)   => u==="imp" ? +(j*0.7376).toFixed(0) : j,
  enL:   (u)     => u==="imp" ? "ft·lb" : "J",
  // inverso per input
  toM:   (v,u)   => u==="imp" ? v/1.0936 : v,
  toMs:  (v,u)   => u==="imp" ? v/3.281 : v,
  toCm:  (v,u)   => u==="imp" ? v*2.54 : v,
  toC:   (v,u)   => u==="imp" ? (v-32)*5/9 : v,
}

// localStorage profili
const KEY_PROFILES = "vega_profiles_v1"
const KEY_SETTINGS = "vega_settings_v1"
function loadProfiles(){try{return JSON.parse(localStorage.getItem(KEY_PROFILES)||"[]")}catch{return[]}}
function saveProfiles(p){try{localStorage.setItem(KEY_PROFILES,JSON.stringify(p))}catch{}}
function loadSettings(){try{return JSON.parse(localStorage.getItem(KEY_SETTINGS)||"{}")}catch{return{}}}
function saveSettings(s){try{localStorage.setItem(KEY_SETTINGS,JSON.stringify(s))}catch{}}

function parseStageText(txt){
  const dists=[...txt.matchAll(/(\d{2,4})\s*m(?:etri|t)?\b/gi)].map(m=>+m[1]).filter(d=>d>=25&&d<=2500)
  const fall=dists.length?dists:[...txt.matchAll(/\b(\d{2,4})\b/g)].map(m=>+m[1]).filter(d=>d>=50&&d<=1500)
  const pm=txt.match(/(\d+)\s*(?:secondi|sec\b|s\b)/i)
  return{id:Date.now(),name:"Stage testo",desc:`${[...new Set(fall)].length} bersagli`,par:pm?+pm[1]:90,
    targets:[...new Set(fall)].map((d,i)=>({id:i+1,dist:d,shots:1,pos:"Prono"}))}
}

const PROFILE_TEMPLATE = {
  id:0, name:"", caliber:".22LR", barrelLengthIn:20,
  twistNum:1, twistDen:16,
  ammoGroup:"RIMFIRE", ammoKey:".22LR Lapua SLR",
  // Dati proiettile custom (sovrascrivono catalogo se compilati)
  bulletName:"", bulletWeightGr:0, bulletDiaMm:0,
  bcModel:"G7",  // "G7" | "G1"
  bcValue:0, mvMs:null,
  // Ottica
  scopeName:"", scopePlane:"FFP",
  scopeHeightCm:6.5, zoomMin:6, zoomMax:36,
  reticleType:"mrad",  // "mrad" | "MOA" | "ibrido"
  clickValue:0.1,
  // Reticolo - hash marks principali
  reticleHash:1.0,   // distanza tra hash (mrad o MOA)
  reticleSubHash:0.5, // sub-divisioni
  zeroM:50, notes:""
}

// ═══════════════════════════════════════════════════════════════
// AUDIO ENGINE
// ═══════════════════════════════════════════════════════════════
function makeBeep(freq, dur, vol){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)()
    const osc=ctx.createOscillator()
    const gain=ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type="sine"; osc.frequency.value=freq
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur)
    osc.start(); osc.stop(ctx.currentTime+dur+0.05)
    setTimeout(()=>ctx.close(), (dur+0.1)*1000)
  }catch(e){}
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTI
// ═══════════════════════════════════════════════════════════════
function WindRose({angle, setAngle}){
  const ref=useRef(null)
  const handle=e=>{
    const r=ref.current.getBoundingClientRect()
    const src=e.touches?.[0]??e
    const dx=src.clientX-r.left-r.width/2, dy=src.clientY-r.top-r.height/2
    let a=Math.atan2(dx,-dy)*180/Math.PI; if(a<0)a+=360
    setAngle(Math.round(a/45)*45%360)
  }
  const ax=Math.sin(angle*Math.PI/180)*26, ay=-Math.cos(angle*Math.PI/180)*26
  return(
    <svg ref={ref} width={70} height={70} viewBox="-35 -35 70 70"
      onClick={handle} onTouchEnd={handle} style={{cursor:"crosshair",flexShrink:0}}>
      <circle cx={0} cy={0} r={30} fill="none" stroke="rgba(0,255,65,.15)" strokeWidth={1}/>
      {[0,90,180,270].map(a=>{
        const x=Math.sin(a*Math.PI/180)*34, y=-Math.cos(a*Math.PI/180)*34
        return<text key={a} x={x} y={y+3} textAnchor="middle" fill="rgba(0,255,65,.3)" fontSize={7} fontFamily="monospace">
          {["N","E","S","O"][a/90]}
        </text>
      })}
      <line x1={0} y1={0} x2={ax} y2={ay} stroke={CYN} strokeWidth={2} strokeLinecap="round"/>
      <circle cx={ax} cy={ay} r={4} fill={CYN}/>
      <circle cx={0} cy={0} r={3} fill="rgba(0,212,255,.3)"/>
    </svg>
  )
}

function ShotDots({total, remaining}){
  return(
    <div style={{display:"flex",gap:5,justifyContent:"center",marginTop:4}}>
      {Array.from({length:total},(_,i)=>(
        <div key={i} style={{width:12,height:12,borderRadius:"50%",
          background:i<remaining?AMB:"rgba(255,170,0,.1)",
          border:`1px solid ${i<remaining?"rgba(255,170,0,.7)":"rgba(255,170,0,.2)"}`,
          transition:"all .2s"}}/>
      ))}
    </div>
  )
}

function StageProgress({targets, currentIdx}){
  return(
    <div style={{display:"flex",gap:2}}>
      {targets.map((t,i)=>(
        <div key={t.id} style={{
          width:i===currentIdx?16:8, height:4,
          background:i<currentIdx?"rgba(0,255,65,.4)":i===currentIdx?GRN:"rgba(0,255,65,.12)",
          transition:"all .3s", borderRadius:1}}/>
      ))}
    </div>
  )
}

function DbMeter({db, threshold}){
  const pct=Math.max(0,Math.min(100,(db+60)/55*100))
  const tPct=Math.max(0,Math.min(100,(threshold+60)/55*100))
  return(
    <div style={{flex:1,height:6,background:"rgba(0,255,65,.08)",borderRadius:2,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",left:0,top:0,height:"100%",width:pct+"%",
        background:db>threshold?RED:GRN,transition:"width .05s"}}/>
      <div style={{position:"absolute",top:0,left:tPct+"%",height:"100%",width:1,background:AMB}}/>
    </div>
  )
}

function MVPanel({mvList, onAdd, onRemove, onApply, appliedMv}){
  const [inp,setInp]=useState("")
  const avg=mvList.length?mvList.reduce((s,v)=>s+v,0)/mvList.length:null
  const sd=mvList.length>1?Math.sqrt(mvList.reduce((s,v)=>s+(v-avg)**2,0)/(mvList.length-1)):null
  const handleAdd=()=>{const v=parseFloat(inp);if(v>100&&v<2000){onAdd(v);setInp("")}}
  return(
    <div>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        <input type="number" className="vg-in" style={{flex:1}} placeholder="es. 318 m/s" value={inp}
          onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAdd()}/>
        <button className="btn-prim" style={{fontSize:9,padding:"6px 12px"}} onClick={handleAdd}>+</button>
      </div>
      {mvList.length>0&&(
        <>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
            {mvList.map((v,i)=>(
              <div key={i} style={{display:"flex",gap:4,alignItems:"center",padding:"2px 7px",
                background:"rgba(0,255,65,.06)",border:"1px solid rgba(0,255,65,.15)",fontSize:9}}>
                <span style={{fontFamily:"Orbitron,monospace"}}>{v}</span>
                <span style={{cursor:"pointer",color:RED,fontSize:10,padding:"0 2px"}} onClick={()=>onRemove(i)}>×</span>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}>
            {[["N",mvList.length,""],["MEDIA",avg?.toFixed(1),"m/s"],["SD",sd?.toFixed(1)??"—","m/s"]].map(([l,v,u])=>(
              <div key={l} style={{textAlign:"center",padding:"5px",background:"rgba(0,255,65,.025)",border:"1px solid rgba(0,255,65,.07)"}}>
                <div style={{fontSize:7,color:"rgba(0,255,65,.4)",letterSpacing:".1em"}}>{l}</div>
                <div style={{fontFamily:"Orbitron,monospace",fontSize:14,color:GRN}}>{v}</div>
                <div style={{fontSize:7,color:"rgba(0,255,65,.3)"}}>{u}</div>
              </div>
            ))}
          </div>
          {avg&&<button className="btn-prim" style={{width:"100%",fontSize:9}} onClick={()=>onApply(avg)}>
            APPLICA MV {avg.toFixed(1)} m/s {appliedMv===+avg.toFixed(1)?"✓":""}
          </button>}
        </>
      )}
    </div>
  )
}

function Widget({label, color, onClick, children, badge, active}){
  return(
    <div onClick={onClick} style={{
      background:"rgba(0,255,65,.025)",
      border:`1px solid ${active?color+"66":"rgba(0,255,65,.12)"}`,
      padding:"10px 8px", cursor:"pointer",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      gap:3, position:"relative", minHeight:140,
      transition:"border-color .1s", userSelect:"none",
      boxShadow:active?`0 0 14px ${color}22`:"none",
      WebkitTapHighlightColor:"transparent",
    }}>
      <div style={{position:"absolute",top:5,left:7,fontSize:6,color:active?color:"rgba(0,255,65,.3)",
        fontFamily:"Orbitron,monospace",letterSpacing:".15em"}}>{label}</div>
      {badge&&<div style={{position:"absolute",top:4,right:6,fontSize:6,color:color,
        fontFamily:"Orbitron,monospace",animation:"bleBlip 1s infinite"}}>{badge}</div>}
      <div style={{position:"absolute",bottom:4,right:7,fontSize:8,color:"rgba(0,255,65,.18)"}}>›</div>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// APP PRINCIPALE — V.E.G.A v4
// ═══════════════════════════════════════════════════════════════
export default function App(){

  // ── Splash ──
  const [splashOn, setSplashOn]   = useState(true)
  const [splashFade, setSplashFade] = useState(false)
  useEffect(()=>{
    const t1=setTimeout(()=>setSplashFade(true),1800)
    const t2=setTimeout(()=>setSplashOn(false),2500)
    return()=>{clearTimeout(t1);clearTimeout(t2)}
  },[])

  // ── Wake Lock ──
  const wakeLockRef = useRef(null)
  useEffect(()=>{
    const acquire=async()=>{
      if(!('wakeLock' in navigator))return
      try{wakeLockRef.current=await navigator.wakeLock.request('screen')}catch{}
    }
    acquire()
    const onVis=()=>{if(document.visibilityState==='visible')acquire()}
    document.addEventListener('visibilitychange',onVis)
    return()=>document.removeEventListener('visibilitychange',onVis)
  },[])

  // ── Navigazione ──
  // mainTab: "home" | "profiles" | "setup"
  // activePanel: null | "solver" | "wind" | "stage" | "timer" | "profile_edit"
  const [mainTab, setMainTab] = useState("home")
  const [activePanel, setActivePanel] = useState(null)

  const goHome = useCallback(()=>{setMainTab("home");setActivePanel(null)},[])

  // ── Unità ──
  const [units, setUnits] = useState(()=>loadSettings().units??"metric") // "metric" | "imp"

  // ── Unità display: MOA vs MRAD ──
  const [unit, setUnit] = useState(()=>loadSettings().unit??"MOA")
  const unitRef = useRef(unit)
  useEffect(()=>{unitRef.current=unit},[unit])
  const signU = useCallback((moa, dec=2)=>{
    if(moa===null||moa===undefined||isNaN(moa))return"—"
    const v=unit==="MOA"?moa:moa/3.4377
    return(v>=0?"+":"")+v.toFixed(dec)
  },[unit])
  const unitLbl = unit==="MOA"?"MOA":"mrad"
  const ttsU = useCallback((moa)=>{
    const u=unitRef.current, v=u==="MOA"?moa:moa/3.4377
    return`${Math.abs(v).toFixed(1).replace(".",",")} ${u==="MOA"?"MOA":"millirad"} ${v>=0?"su":"giù"}`
  },[])

  // ── Audio Settings ──
  const [audio, setAudio] = useState(()=>({
    enabled:true, volume:0.7, beepFreq:880, beepDur:0.12,
    ...loadSettings().audio
  }))
  const audioRef = useRef(audio)
  useEffect(()=>{audioRef.current=audio},[audio])

  const playBeep = useCallback((freq, dur, vol)=>{
    const a=audioRef.current
    if(!a.enabled)return
    makeBeep(freq??a.beepFreq, dur??a.beepDur, (vol??1)*a.volume)
  },[])

  const playTriple = useCallback(()=>{
    for(let i=0;i<3;i++) setTimeout(()=>playBeep(1000,0.18),i*320)
  },[playBeep])

  // ── Salva settings quando cambiano ──
  useEffect(()=>{
    saveSettings({units, unit, audio})
  },[units, unit, audio])

  // ── Profili ──
  const [profiles, setProfiles] = useState(()=>loadProfiles())
  const [activeProfileId, setActiveProfileId] = useState(()=>loadSettings().activeProfileId??null)
  const [editingProfile, setEditingProfile] = useState(null)
  useEffect(()=>saveProfiles(profiles),[profiles])

  const activeProfile = profiles.find(p=>p.id===activeProfileId)

  const applyProfile = useCallback((p)=>{
    setAmmoGroup(p.ammoGroup)
    setAmmoKey(p.ammoKey)
    setScopeH(p.scopeHeightCm)
    setZeroM(p.zeroM)
    if(p.mvMs) setWx(w=>({...w,mv:p.mvMs}))
    setActiveProfileId(p.id)
    saveSettings({...loadSettings(), activeProfileId:p.id})
    goHome()
  },[goHome])

  // ── Setup arma ──
  const [ammoGroup, setAmmoGroup] = useState(()=>activeProfile?.ammoGroup??"RIMFIRE")
  const [ammoKey,   setAmmoKey]   = useState(()=>activeProfile?.ammoKey??".22LR Lapua SLR")
  const [scopeH,    setScopeH]    = useState(()=>activeProfile?.scopeHeightCm??6.5)
  const [zeroM,     setZeroM]     = useState(()=>activeProfile?.zeroM??50)
  const ammoKeyRef = useRef(ammoKey)
  const scopeHRef  = useRef(scopeH)
  const zeroMRef   = useRef(zeroM)
  useEffect(()=>{ammoKeyRef.current=ammoKey},[ammoKey])
  useEffect(()=>{scopeHRef.current=scopeH},[scopeH])
  useEffect(()=>{zeroMRef.current=zeroM},[zeroM])

  // ── Meteo ──
  const [wx, setWx] = useState({temp:15,alt:0,wind:0,windAngle:90,mv:null})
  const wxRef = useRef(wx)
  useEffect(()=>{wxRef.current=wx},[wx])

  // ── Solver ──
  const [dist,      setDist]      = useState(150)
  const [sol,       setSol]       = useState(null)
  const [rangeCard, setRangeCard] = useState([])
  const [pulse,     setPulse]     = useState(false)
  const distRef = useRef(dist)
  useEffect(()=>{distRef.current=dist},[dist])

  useEffect(()=>{
    const r=physSolve(dist,ammoKey,scopeH,zeroM,wx,activeProfile??null)
    setSol(r); setPulse(true)
    const t=setTimeout(()=>setPulse(false),300)
    return()=>clearTimeout(t)
  },[dist,ammoKey,scopeH,zeroM,wx])

  useEffect(()=>{
    const isRim=ammoGroup==="RIMFIRE"
    const steps=isRim?[25,50,75,100,125,150,175,200,225,250]:[50,100,150,200,300,400,500,600,700,800]
    setRangeCard(steps.map(d=>({dist:d,...(physSolve(d,ammoKey,scopeH,zeroM,wx,activeProfile??null)||{})})))
  },[ammoKey,ammoGroup,scopeH,zeroM,wx])

  // ── Geolocation ──
  useEffect(()=>{
    if(!navigator.geolocation)return
    navigator.geolocation.getCurrentPosition(
      pos=>{setWx(w=>({...w,alt:Math.round(pos.coords.altitude??0)}))},
      ()=>{},{timeout:5000}
    )
  },[])

  // ── Stage ──
  const [stages,       setStages]       = useState(STAGES_BUILTIN)
  const [stageActive,  setStageActive]  = useState(false)
  const [currentStage, setCurrentStage] = useState(null)
  const [tgtIdx,       setTgtIdx]       = useState(0)
  const [shotsLeft,    setShotsLeft]    = useState(0)
  const [stageSols,    setStageSols]    = useState([])
  const [pdfLoading,   setPdfLoading]   = useState(false)
  const [stageMsg,     setStageMsg]     = useState("")
  const stageRef    = useRef(null)
  const tgtIdxRef   = useRef(0)
  const shotsLeftRef= useRef(0)
  const curTarget = currentStage?.targets[tgtIdx]
  const curSol = curTarget?physSolve(curTarget.dist,ammoKey,scopeH,zeroM,wx):null

  // ── Timer ──
  const [timerSecs,    setTimerSecs]    = useState(90)
  const [timerLeft,    setTimerLeft]    = useState(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [countdown10,  setCountdown10]  = useState(true) // bip ultimi 10s
  // Alert personalizzabili: [{id,secs,label,enabled}]
  const [timerAlerts, setTimerAlerts] = useState([
    {id:1,secs:60,label:"60 sec",enabled:true},
    {id:2,secs:30,label:"30 sec",enabled:true},
    {id:3,secs:10,label:"10 sec",enabled:true},
  ])
  const [newAlertSecs, setNewAlertSecs] = useState("")
  const timerRef     = useRef(null)
  const timerLeftRef = useRef(null)
  const timerAlertsRef = useRef(timerAlerts)
  const countdown10Ref = useRef(countdown10)
  useEffect(()=>{timerAlertsRef.current=timerAlerts},[timerAlerts])
  useEffect(()=>{countdown10Ref.current=countdown10},[countdown10])

  // ── Shot detection ──
  const [shotDetect,    setShotDetect]    = useState(false)
  const [shotThreshold, setShotThreshold] = useState(-25)
  const [audioDb,       setAudioDb]       = useState(-100)
  const [micReady,      setMicReady]      = useState(false)
  const shotDetRef    = useRef(false)
  const shotThreshRef = useRef(-25)
  const audioCtxRef   = useRef(null)
  const audioSrcRef   = useRef(null)
  const rafRef        = useRef(null)
  const lastShotRef   = useRef(0)
  const lastDbRef     = useRef(0)
  useEffect(()=>{shotDetRef.current=shotDetect},[shotDetect])
  useEffect(()=>{shotThreshRef.current=shotThreshold},[shotThreshold])

  // ── BLE Calypso ──
  const [bleConnected, setBleConnected] = useState(false)
  const [bleName,      setBleName]      = useState("")
  const [bleError,     setBleError]     = useState("")
  const bleDevRef  = useRef(null)
  // Kestrel 5700 Elite BLE
  const [kestrelConnected, setKestrelConnected] = useState(false)
  const [kestrelName,      setKestrelName]      = useState("")
  const kestrelDevRef = useRef(null)

  // ── MV manuale ──
  const [mvList, setMvList] = useState([])

  // Truing — misure reali per BC truing
  const [truingRows, setTruingRows] = useState([
    {id:1,dist:100,dropMeas:null,unit:"mrad"},
  ])
  const [truingMv, setTruingMv] = useState(null)
  const [truingMsg, setTruingMsg] = useState("")

  // ── Voice ──
  const [voiceState,      setVoiceState]      = useState("idle")
  const [voiceTranscript, setVoiceTranscript] = useState("")
  const [wakePending,     setWakePending]      = useState(false)
  const [voiceFeed,       setVoiceFeed]        = useState('dire "Vega + comando"')
  const wakePendRef    = useRef(false)
  const wakeTimeoutRef = useRef(null)
  const recRef         = useRef(null)
  useEffect(()=>{wakePendRef.current=wakePending},[wakePending])

  // ── TTS ──
  const speak = useCallback((text, priority=false)=>{
    if(!window.speechSynthesis)return
    if(priority)speechSynthesis.cancel()
    const u=new SpeechSynthesisUtterance(text)
    u.lang="it-IT"; u.rate=1.05; u.pitch=0.88; u.volume=1
    u.onstart=()=>setVoiceState("speaking")
    u.onend=()=>setVoiceState(wakePendRef.current?"waiting":"idle")
    speechSynthesis.speak(u)
  },[])

  // ── Stage logic ──
  const speakTarget = useCallback((stage, idx, wx_)=>{
    const t=stage.targets[idx]; if(!t)return
    const s=physSolve(t.dist,ammoKeyRef.current,scopeHRef.current,zeroMRef.current,wx_||wxRef.current)
    const wt=s&&Math.abs(s.windMoa)>0.2?`, deriva ${ttsU(s.windMoa)}`:""
    speak(`${t.pos}. Bersaglio ${t.id}, ${t.dist} metri, alza ${ttsU(s?.dropMoa??0)}${wt}`,true)
  },[speak,ttsU])

  const advanceTarget = useCallback(()=>{
    const stage=stageRef.current; if(!stage)return
    const nextIdx=tgtIdxRef.current+1
    if(nextIdx>=stage.targets.length){
      speak("Stage completato. Ottimo lavoro.",true)
      setStageActive(false); setCurrentStage(null); stageRef.current=null
      setTgtIdx(0); setShotsLeft(0); tgtIdxRef.current=0; shotsLeftRef.current=0
      return
    }
    const nextT=stage.targets[nextIdx], prevT=stage.targets[tgtIdxRef.current]
    tgtIdxRef.current=nextIdx; shotsLeftRef.current=nextT.shots
    setTgtIdx(nextIdx); setShotsLeft(nextT.shots); setDist(nextT.dist)
    const s=physSolve(nextT.dist,ammoKeyRef.current,scopeHRef.current,zeroMRef.current,wxRef.current)
    const wt=s&&Math.abs(s.windMoa)>0.2?`, deriva ${ttsU(s.windMoa)}`:""
    const pfx=nextT.pos!==prevT.pos?`Cambia — ${nextT.pos}. `:""
    speak(`${pfx}Bersaglio ${nextT.id}, ${nextT.dist} metri, alza ${ttsU(s?.dropMoa??0)}${wt}`,true)
  },[speak,ttsU])

  const onShotFired = useCallback(()=>{
    if(!stageRef.current)return
    const left=shotsLeftRef.current-1; shotsLeftRef.current=left; setShotsLeft(left)
    if(left>0)speak(`${left} col${left===1?"po":"pi"}`)
    else setTimeout(()=>advanceTarget(),600)
  },[speak,advanceTarget])

  const onShotFiredRef = useRef(onShotFired)
  useEffect(()=>{onShotFiredRef.current=onShotFired},[onShotFired])

  const loadStage = useCallback((stage)=>{
    if(!stage?.targets.length)return
    stageRef.current=stage; setCurrentStage(stage)
    setTgtIdx(0); setShotsLeft(stage.targets[0].shots)
    tgtIdxRef.current=0; shotsLeftRef.current=stage.targets[0].shots
    setDist(stage.targets[0].dist); setStageActive(true)
    setMainTab("home"); setActivePanel(null)
    setStageSols(stage.targets.map(t=>({...t,...(physSolve(t.dist,ammoKey,scopeH,zeroM,wx,activeProfile??null)||{})})))
    speak(`${stage.name}. ${stage.targets.length} bersagli, ${stage.par} secondi.`,true)
    setTimeout(()=>speakTarget(stage,0,wx),1100)
  },[speak,speakTarget,ammoKey,scopeH,zeroM,wx])

  // ── Timer ──
  const startTimer = useCallback((secs)=>{
    clearInterval(timerRef.current)
    const total=secs>0?secs:timerSecs
    const startTime=Date.now()
    const firedAlerts=new Set()
    setTimerLeft(total); timerLeftRef.current=total; setTimerRunning(true)
    timerRef.current=setInterval(()=>{
      // Usa Date.now() per evitare drift di setInterval
      const elapsed=Math.floor((Date.now()-startTime)/1000)
      const left=Math.max(0,total-elapsed)
      if(left===timerLeftRef.current)return // nessun cambio
      timerLeftRef.current=left
      setTimerLeft(left)
      // Alert personalizzati
      timerAlertsRef.current.forEach(al=>{
        if(al.enabled&&left===al.secs&&!firedAlerts.has(al.id)){
          firedAlerts.add(al.id)
          playBeep(880,0.15)
          speak(al.label,false)
        }
      })
      // Countdown ultimi 10s
      if(countdown10Ref.current&&left>0&&left<=10) playBeep(660,0.08)
      if(left<=0){
        clearInterval(timerRef.current); setTimerRunning(false)
        playTriple(); speak("Tempo scaduto",true)
      }
    },200) // poll ogni 200ms per reattività immediata
  },[timerSecs,speak,playBeep,playTriple])

  const stopTimer = useCallback(()=>{clearInterval(timerRef.current);setTimerRunning(false)},[])

  // ── Mic / shot detection ──
  const startMic = useCallback(async()=>{
    if(audioCtxRef.current)return
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false})
      const ctx=new(window.AudioContext||window.webkitAudioContext)()
      const src=ctx.createMediaStreamSource(stream)
      const analyser=ctx.createAnalyser()
      analyser.fftSize=512; analyser.smoothingTimeConstant=0.05; src.connect(analyser)
      const buf=new Float32Array(analyser.fftSize)
      const loop=()=>{
        analyser.getFloatTimeDomainData(buf)
        const peak=buf.reduce((m,v)=>Math.max(m,Math.abs(v)),0)
        const db=peak>0?20*Math.log10(peak):-100
        const now=Date.now()
        if(now-lastDbRef.current>100){lastDbRef.current=now;setAudioDb(Math.round(db))}
        if(shotDetRef.current&&db>shotThreshRef.current&&now-lastShotRef.current>800){
          lastShotRef.current=now; onShotFiredRef.current?.()
        }
        rafRef.current=requestAnimationFrame(loop)
      }
      loop(); audioCtxRef.current=ctx; audioSrcRef.current=stream; setMicReady(true)
    }catch(e){console.warn("[MIC]",e.message)}
  },[])
  useEffect(()=>{if(shotDetect&&!micReady)startMic()},[shotDetect,micReady,startMic])

  // ── BLE Calypso ──
  const connectCalypso = useCallback(async()=>{
    if(!navigator.bluetooth){setBleError("Web Bluetooth: usa Chrome/Edge Android");return}
    setBleError("")
    try{
      const device=await navigator.bluetooth.requestDevice({
        filters:[{namePrefix:"CALYPSO"},{namePrefix:"Calypso"}],
        optionalServices:[CALYPSO_SERVICE],
      })
      bleDevRef.current=device; setBleName(device.name||"Calypso")
      const server=await device.gatt.connect()
      const service=await server.getPrimaryService(CALYPSO_SERVICE)
      const char=await service.getCharacteristic(CALYPSO_WIND_CH)
      await char.startNotifications()
      char.addEventListener("characteristicvaluechanged",e=>{
        const dv=e.target.value
        setWx(w=>({...w,wind:+(dv.getUint16(0,true)/100).toFixed(1),windAngle:dv.getUint16(2,true)}))
      })
      setBleConnected(true)
      device.addEventListener("gattserverdisconnected",()=>{setBleConnected(false);setBleName("")})
    }catch(e){if(e.name!=="NotFoundError")setBleError("BLE: "+e.message)}
  },[])

  const disconnectCalypso = useCallback(()=>{
    bleDevRef.current?.gatt?.disconnect(); setBleConnected(false); setBleName("")
  },[])

  // ── BLE Kestrel 5700 Elite ──
  const connectKestrel = useCallback(async()=>{
    if(!navigator.bluetooth){setBleError("Web Bluetooth: usa Chrome/Edge Android");return}
    setBleError("")
    try{
      const device=await navigator.bluetooth.requestDevice({
        filters:[{namePrefix:"Kestrel"},{namePrefix:"KESTREL"}],
        optionalServices:[KESTREL_SERVICE],
      })
      kestrelDevRef.current=device; setKestrelName(device.name||"Kestrel")
      const server=await device.gatt.connect()
      const service=await server.getPrimaryService(KESTREL_SERVICE)
      const tx=await service.getCharacteristic(KESTREL_TX_CH)
      await tx.startNotifications()
      tx.addEventListener("characteristicvaluechanged",e=>{
        // Kestrel invia stringhe NMEA-like: temp,pressione,umidità,velocità_vento,direzione
        try{
          const txt=new TextDecoder().decode(e.target.value).trim()
          const parts=txt.split(",")
          if(parts.length>=5){
            const temp=parseFloat(parts[0])
            const wind=parseFloat(parts[3])
            const dir=parseFloat(parts[4])
            if(!isNaN(temp))setWx(w=>({...w,temp:+temp.toFixed(1)}))
            if(!isNaN(wind))setWx(w=>({...w,wind:+wind.toFixed(1)}))
            if(!isNaN(dir))setWx(w=>({...w,windAngle:Math.round(dir)}))
          }
        }catch{}
      })
      setKestrelConnected(true)
      device.addEventListener("gattserverdisconnected",()=>{
        setKestrelConnected(false); setKestrelName(""); kestrelDevRef.current=null
      })
    }catch(e){if(e.name!=="NotFoundError")setBleError("Kestrel BLE: "+e.message)}
  },[])

  const disconnectKestrel = useCallback(()=>{
    kestrelDevRef.current?.gatt?.disconnect()
    setKestrelConnected(false); setKestrelName("")
  },[])

  // ── Truing BC — bisezione sul BC G7 ──
  const computeTruing = useCallback(()=>{
    const validRows=truingRows.filter(r=>r.dropMeas!==null&&r.dist>0)
    if(validRows.length===0){setTruingMsg("Inserisci almeno una misura reale");return}

    // Converti tutte le misure in mrad
    const measures=validRows.map(r=>({
      dist:r.dist,
      mrad:r.unit==="MOA"?r.dropMeas/3.4377:r.dropMeas,
    }))

    // Funzione che calcola drop mrad con un dato BC G7
    const calcDrop=(dist,bc,mv)=>{
      const s=physSolve(dist,ammoKey,scopeH,zeroM,{...wx,mv:mv??wx.mv},
        activeProfile?{...activeProfile,bcValue:bc,bcModel:"G7"}:{bcValue:bc,bcModel:"G7"})
      return s?.dropMrad??0
    }

    // Bisezione sul BC per minimizzare errore su tutte le distanze
    let lo=0.03,hi=0.35
    for(let i=0;i<80;i++){
      const mid=(lo+hi)/2
      const err=measures.reduce((sum,m)=>sum+(calcDrop(m.dist,mid,null)-m.mrad),0)
      if(err>0) lo=mid; else hi=mid
    }
    const bcTruato=+((lo+hi)/2).toFixed(4)

    // Calcola errori per ogni distanza con BC truato
    const errors=measures.map(m=>{
      const calc=calcDrop(m.dist,bcTruato,null)
      return{...m,calc:+calc.toFixed(3),delta:+(calc-m.mrad).toFixed(3)}
    })

    const msg=`BC G7 truato: ${bcTruato} | Errori: ${errors.map(e=>`${e.dist}m:${e.delta>0?"+":""}${e.delta}mrad`).join(", ")}`
    setTruingMsg(msg)
    setTruingMv(bcTruato) // Temporaneo per visualizzazione

    // Offri di salvare nel profilo attivo
    if(activeProfileId){
      setProfiles(prev=>prev.map(p=>p.id===activeProfileId?{...p,bcValue:bcTruato,bcModel:"G7"}:p))
      setTruingMsg(msg+" → SALVATO nel profilo attivo")
    }
  },[truingRows,ammoKey,scopeH,zeroM,wx,activeProfile,activeProfileId,setProfiles])

  // ── PDF import ──
  const handlePdfFile = useCallback(async(file)=>{
    if(!file)return; setPdfLoading(true); setBleError("")
    try{
      let text=""
      if(file.type==="text/plain"){text=await file.text()}
      else{
        const pdfjsLib=await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs")
        pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs"
        const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise
        for(let i=1;i<=pdf.numPages;i++){
          const p=await pdf.getPage(i)
          text+=(await p.getTextContent()).items.map(x=>x.str).join(" ")+"\n"
        }
      }
      const parsed=parseStageText(text)
      if(!parsed.targets.length){setBleError("Nessuna distanza trovata");return}
      const ns={...parsed,name:`PDF: ${file.name.replace(/\.[^.]+$/,"")}`}
      setStages(prev=>[...prev,ns]); speak(`Stage importato: ${ns.targets.length} bersagli`)
    }catch(e){setBleError("Errore: "+e.message)}
    finally{setPdfLoading(false)}
  },[speak])

  // ── Voice ──
  const handleVoiceCommand = useCallback((txt)=>{
    const t=txt.toLowerCase().trim(); setVoiceTranscript(txt)
    const sm=t.match(/stage\s+(\d+)|palco\s+(\d+)/)
    if(sm){const n=+( sm[1]||sm[2]);const s=stages.find(s=>s.id===n);if(s){loadStage(s);return}speak("Stage non trovato",true);return}
    if(/prossimo|avanza|via/.test(t)){advanceTarget();return}
    if(/fuoco|colpo|sparo/.test(t)){onShotFiredRef.current?.();return}
    if(/alzo|correzione|dati/.test(t)){
      const s=physSolve(distRef.current,ammoKeyRef.current,scopeHRef.current,zeroMRef.current,wxRef.current)
      if(s)speak(`A ${distRef.current} metri: alza ${ttsU(s.dropMoa)}, deriva ${ttsU(s.windMoa)}`,true)
      return
    }
    const dm=t.match(/distanza\s+(\d+)/)
    if(dm){const d=+dm[1];setDist(d);distRef.current=d;const s=physSolve(d,ammoKeyRef.current,scopeHRef.current,zeroMRef.current,wxRef.current);if(s)speak(`${d} metri: alza ${ttsU(s.dropMoa)}`,true);return}
    if(/millirad|mrad/.test(t)){setUnit("MRAD");speak("Millirad attivo");return}
    if(/\bmoa\b/.test(t)){setUnit("MOA");speak("MOA attivo");return}
    const tmM=t.match(/timer\s+(\d+)\s*min/);if(tmM){startTimer(+tmM[1]*60);speak(`Timer ${tmM[1]} minuti`);return}
    const tmS=t.match(/timer\s+(\d+)/);if(tmS){startTimer(+tmS[1]);speak("Timer avviato");return}
    if(/avvia|start/.test(t)&&/timer/.test(t)){startTimer(0);speak("Timer avviato");return}
    if(/stop|ferma/.test(t)){stopTimer();speak("Timer fermo");return}
    speak("Comando non riconosciuto")
  },[advanceTarget,loadStage,speak,ttsU,startTimer,stopTimer,stages])

  useEffect(()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition
    if(!SR){setVoiceFeed("Voce: usa Chrome/Edge");return}
    const rec=new SR(); rec.continuous=true; rec.interimResults=true; rec.lang="it-IT"; recRef.current=rec
    rec.onresult=e=>{
      let interim="",final=""
      for(let i=e.resultIndex;i<e.results.length;i++){
        const r=e.results[i][0].transcript
        if(e.results[i].isFinal)final+=r; else interim+=r
      }
      if(interim)setVoiceTranscript(interim)
      if(final){
        setVoiceTranscript("")
        const tl=final.toLowerCase().trim()
        if(wakePendRef.current){
          setWakePending(false);wakePendRef.current=false
          clearTimeout(wakeTimeoutRef.current);setVoiceState("idle")
          setVoiceFeed("CMD: "+final); handleVoiceCommand(final)
        }else if(tl.includes("vega")){
          setWakePending(true);wakePendRef.current=true
          setVoiceState("waiting");setVoiceFeed("VEGA — dì il comando")
          speak("Dimmi")
          wakeTimeoutRef.current=setTimeout(()=>{setWakePending(false);wakePendRef.current=false;setVoiceState("idle");setVoiceFeed("Timeout")},8000)
        }
      }
    }
    rec.onerror=e=>{if(e.error!=="no-speech")setVoiceFeed("Mic: "+e.error)}
    rec.onend=()=>{try{rec.start()}catch{}}
    try{rec.start();setVoiceState("idle")}catch{setVoiceFeed("Mic N/D")}
    return()=>{try{rec.stop()}catch{}}
  },[handleVoiceCommand,speak])

  useEffect(()=>()=>{
    cancelAnimationFrame(rafRef.current)
    audioCtxRef.current?.close()
    audioSrcRef.current?.getTracks().forEach(t=>t.stop())
    clearInterval(timerRef.current)
    recRef.current?.stop()
    bleDevRef.current?.gatt?.disconnect()
    kestrelDevRef.current?.gatt?.disconnect()
    wakeLockRef.current?.release()
  },[])

  // ── Derived ──
  const ammoData   = FLAT[ammoKey]
  const timerColor = timerLeft!==null?(timerLeft<=10?RED:timerLeft<=30?AMB:GRN):GRN
  const vdotColor  = voiceState==="waiting"?AMB:voiceState==="speaking"?CYN:"rgba(0,255,65,.4)"

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return(
  <>
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    html,body{background:#020c04;height:100%;overflow:hidden;-webkit-text-size-adjust:100%}
    .vg-root{height:100vh;height:100dvh;background:#020c04;color:#00ff41;font-family:'IBM Plex Mono',monospace;display:flex;flex-direction:column;overflow:hidden}
    .orb{font-family:'Orbitron',monospace}
    .lbl{font-size:7px;letter-spacing:.15em;color:rgba(0,255,65,.45);text-transform:uppercase;margin-bottom:2px}
    .card{background:rgba(0,255,65,.025);border:1px solid rgba(0,255,65,.1);padding:10px 12px;margin-bottom:6px}
    .vg-in{background:rgba(0,255,65,.04);border:1px solid rgba(0,255,65,.18);color:#00ff41;font-family:'IBM Plex Mono',monospace;font-size:14px;padding:8px 10px;outline:none;width:100%;border-radius:2px}
    .vg-in:focus{border-color:rgba(0,255,65,.55)}
    .vg-in::placeholder{color:rgba(0,255,65,.2)}
    .vg-sel{background:rgba(0,255,65,.04);border:1px solid rgba(0,255,65,.18);color:#00ff41;font-family:'IBM Plex Mono',monospace;font-size:12px;padding:8px 9px;outline:none;cursor:pointer;width:100%;border-radius:2px}
    .vg-sel option{background:#020c04}
    .vg-range{-webkit-appearance:none;appearance:none;width:100%;height:4px;background:rgba(0,255,65,.15);outline:none;cursor:pointer;border-radius:2px}
    .vg-range::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:#00ff41;cursor:pointer}
    .vg-range::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#00ff41;cursor:pointer;border:none}
    .btn-prim{background:#00ff41;color:#020c04;border:none;font-family:'Orbitron',monospace;font-size:10px;font-weight:700;letter-spacing:.12em;padding:12px 18px;cursor:pointer;text-transform:uppercase;border-radius:2px;min-height:44px}
    .btn-prim:active{opacity:.8}
    .btn-prim.amb{background:${AMB}}
    .btn-prim.red{background:${RED};color:#fff}
    .btn-prim.prp{background:${PRP};color:#fff}
    .btn-out{background:transparent;color:#00ff41;border:1px solid rgba(0,255,65,.3);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:10px 12px;cursor:pointer;border-radius:2px;min-height:44px}
    .btn-out:active{background:rgba(0,255,65,.08)}
    .btn-out.red{color:${RED};border-color:rgba(255,51,68,.35)}
    .pill{background:transparent;border:1px solid rgba(0,255,65,.2);color:rgba(0,255,65,.55);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;min-height:36px;border-radius:2px}
    .pill.on{background:rgba(0,255,65,.12);border-color:rgba(0,255,65,.5);color:#00ff41}
    .toggle-wrap{display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;min-height:44px}
    .toggle-bg{width:44px;height:24px;border-radius:12px;background:rgba(0,255,65,.08);border:1px solid rgba(0,255,65,.2);position:relative;transition:all .2s;flex-shrink:0}
    .toggle-bg.on{background:rgba(0,255,65,.22);border-color:rgba(0,255,65,.5)}
    .toggle-knob{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#00ff41;transition:transform .2s}
    .toggle-bg.on .toggle-knob{transform:translateX(20px)}
    .unit-btn{background:transparent;font-family:'Orbitron',monospace;font-size:9px;letter-spacing:.1em;padding:5px 12px;cursor:pointer;border:1px solid rgba(0,255,65,.2);color:rgba(0,255,65,.45);min-height:36px;border-radius:2px}
    .unit-btn.on{background:${GRN};color:#020c04;border-color:${GRN};font-weight:700}
    .scroll-panel{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 12px;padding-bottom:70px}
    .bottom-nav{display:flex;border-top:1px solid rgba(0,255,65,.12);flex-shrink:0;background:#020c04}
    .bnav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;cursor:pointer;color:rgba(0,255,65,.35);font-family:'Orbitron',monospace;font-size:7px;letter-spacing:.1em;gap:3px;min-height:54px;border:none;background:transparent}
    .bnav-btn.on{color:${GRN}}
    .bnav-btn .bn-icon{font-size:18px;line-height:1}
    .scan{position:fixed;inset:0;pointer-events:none;z-index:1;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,65,.012) 2px,rgba(0,255,65,.012) 4px)}
    @keyframes cwSpin{to{transform:rotate(360deg)}}
    @keyframes ccwSpin{to{transform:rotate(-360deg)}}
    @keyframes glowT{0%,100%{text-shadow:0 0 8px rgba(0,255,65,.55)}50%{text-shadow:0 0 20px rgba(0,255,65,1)}}
    @keyframes timerWarn{0%,100%{opacity:1}50%{opacity:.1}}
    @keyframes bleBlip{0%,100%{opacity:1}50%{opacity:.2}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    @keyframes pulseSol{0%{box-shadow:0 0 0 0 rgba(0,255,65,.3)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
    .pulse-sol{animation:pulseSol .35s ease}
    .glow-t{animation:glowT 4s ease-in-out infinite}
    .ring-a{position:absolute;inset:0;border-radius:50%;border:1px solid rgba(0,255,65,.48);border-top-color:transparent;border-left-color:transparent;animation:cwSpin 5s linear infinite}
    .ring-b{position:absolute;inset:8px;border-radius:50%;border:1px dashed rgba(0,255,65,.2);animation:ccwSpin 9s linear infinite}
    .ring-c{position:absolute;inset:15px;border-radius:50%;border:1px solid rgba(0,255,65,.3);border-bottom-color:transparent;animation:cwSpin 3s linear infinite}
    ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(0,255,65,.18)}
    @media(min-width:600px){.widget-grid{grid-template-columns:1fr 1fr 1fr 1fr!important}}
  `}</style>

  {/* SPLASH */}
  {splashOn&&(
    <div style={{position:"fixed",inset:0,background:"#000",zIndex:9999,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      opacity:splashFade?0:1,transition:"opacity .7s",pointerEvents:splashFade?"none":"all"}}>
      <img src={vegaImg} alt="VEGA" style={{width:220,maxWidth:"70vw",filter:"drop-shadow(0 0 24px #00ff41)"}}/>
      <div className="orb glow-t" style={{fontSize:24,letterSpacing:".5em",fontWeight:900,color:GRN,marginTop:20}}>V.E.G.A</div>
      <div style={{fontSize:9,color:"rgba(0,255,65,.4)",letterSpacing:".15em",marginTop:8}}>Shooting Labs · v4</div>
    </div>
  )}

  <div className="vg-root">
    <div className="scan"/>

    {/* ═══ HEADER ═══ */}
    <div style={{padding:"6px 12px",borderBottom:"1px solid rgba(0,255,65,.1)",
      display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:8,minHeight:48}}>

      {activePanel?(
        <button className="btn-out" style={{fontSize:10,padding:"5px 10px",minHeight:36}}
          onClick={()=>setActivePanel(null)}>‹ {mainTab==="profiles"?"PROFILI":"HOME"}</button>
      ):(
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div className="orb glow-t" style={{fontSize:14,letterSpacing:".3em",fontWeight:900,color:GRN}}>V·E·G·A</div>
          {stageActive&&(
            <span style={{fontSize:7,color:AMB,fontFamily:"Orbitron,monospace",animation:"bleBlip 1.2s infinite"}}>
              ● STAGE
            </span>
          )}
        </div>
      )}

      {activePanel&&(
        <div className="orb" style={{fontSize:10,color:GRN,letterSpacing:".15em",flex:1,textAlign:"center"}}>
          {activePanel.replace("_"," ").toUpperCase()}
        </div>
      )}

      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        <button className={`unit-btn${unit==="MOA"?" on":""}`} onClick={()=>setUnit("MOA")}>MOA</button>
        <button className={`unit-btn${unit==="MRAD"?" on":""}`} onClick={()=>setUnit("MRAD")}>MRAD</button>
        <div style={{width:8,height:8,borderRadius:"50%",background:vdotColor,flexShrink:0}}/>
      </div>
    </div>

    {/* Voice bar */}
    {(voiceTranscript||voiceState!=="idle")&&(
      <div style={{fontSize:8,color:"rgba(0,255,65,.5)",textAlign:"center",padding:"2px 12px",
        borderBottom:"1px solid rgba(0,255,65,.06)",background:"rgba(0,10,2,.8)"}}>
        {voiceTranscript?<span style={{color:CYN}}>{voiceTranscript}</span>:voiceFeed}
      </div>
    )}

    {/* ═══ STAGE BAR — sempre visibile in home ═══ */}
    {stageActive&&curTarget&&!activePanel&&mainTab==="home"&&(
      <div style={{padding:"6px 12px",background:"rgba(0,16,4,.95)",borderBottom:`1px solid ${AMB}44`,
        display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
        <div style={{flex:1,minWidth:0}}>
          <StageProgress targets={currentStage.targets} currentIdx={tgtIdx}/>
          <div style={{fontSize:9,color:AMB,marginTop:2}}>{currentStage.name}</div>
        </div>
        <div style={{textAlign:"center",flexShrink:0}}>
          <div className="orb" style={{fontSize:22,color:AMB,lineHeight:1}}>T{curTarget.id}</div>
          <div className="orb" style={{fontSize:16,color:GRN}}>{curTarget.dist}m</div>
          {curSol&&<div className="orb" style={{fontSize:14,color:GRN}}>{signU(curSol.dropMoa)}<span style={{fontSize:7}}> {unitLbl}</span></div>}
        </div>
        <div style={{display:"flex",gap:5,flexShrink:0}}>
          <button className="btn-prim amb" style={{fontSize:10,padding:"8px 12px"}} onClick={advanceTarget}>▶</button>
          <button className="btn-out red" style={{fontSize:10,padding:"8px 10px"}}
            onClick={()=>{setStageActive(false);stageRef.current=null;speak("Interrotto")}}>■</button>
        </div>
      </div>
    )}

    {/* ═══ CONTENUTO ═══ */}
    <div className="scroll-panel" style={{animation:"fadeUp .2s ease"}}>

      {/* ═══ HOME — 4 Widget ═══ */}
      {mainTab==="home"&&!activePanel&&(
        <>
          <div className="widget-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>

            {/* WIDGET SOLUZIONE */}
            <Widget label="SOLUZIONE" color={GRN} onClick={()=>setActivePanel("solver")} active={!!sol} badge={unit}>
              {sol?(
                <div className={pulse?"pulse-sol":""} style={{textAlign:"center",width:"100%",paddingTop:6}}>
                  <div className="orb" style={{fontSize:30,lineHeight:1,color:sol.dropMoa>=0?GRN:AMB}}>{signU(sol.dropMoa)}</div>
                  <div style={{fontSize:7,color:"rgba(0,255,65,.4)",marginBottom:6}}>{unitLbl} ALZO</div>
                  <div className="orb" style={{fontSize:18,color:Math.abs(sol.windMoa)>0.5?CYN:"rgba(0,255,65,.4)"}}>{signU(sol.windMoa)}</div>
                  <div style={{fontSize:7,color:"rgba(0,212,255,.4)",marginBottom:4}}>{unitLbl} VENTO</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,marginTop:4}}>
                    {[[dist+"m","dist"],[sol.tofMs+"ms","TOF"],
                      [(wx.mv??ammoData?.mv)+"m/s","MV"],
                      [U.en(sol.eneJ,units)+" "+U.enL(units),"energia"]].map(([v,l])=>(
                      <div key={l} style={{textAlign:"center"}}>
                        <div className="orb" style={{fontSize:10,color:l==="MV"&&wx.mv?CYN:GRN}}>{v}</div>
                        <div style={{fontSize:5,color:l==="MV"&&wx.mv?"rgba(0,212,255,.4)":"rgba(0,255,65,.3)"}}>{l}{l==="MV"&&wx.mv?" ✓":""}</div>
                      </div>
                    ))}
                  </div>
                  {!sol.supersonic&&<div style={{fontSize:5,color:AMB,marginTop:3}}>⚠ SUBSONICO</div>}
                </div>
              ):(
                <div style={{color:"rgba(0,255,65,.2)",fontSize:20}}>—</div>
              )}
            </Widget>

            {/* WIDGET BERSAGLIO */}
            <Widget label="BERSAGLIO" color={AMB} onClick={()=>setActivePanel("stage")} active={stageActive}
              badge={stageActive?`${tgtIdx+1}/${currentStage?.targets.length}`:null}>
              {stageActive&&curTarget?(
                <div style={{textAlign:"center",width:"100%",paddingTop:6}}>
                  <div className="orb" style={{fontSize:26,color:AMB,lineHeight:1}}>T{curTarget.id}</div>
                  <div className="orb" style={{fontSize:20,color:GRN,lineHeight:1.1}}>{curTarget.dist}m</div>
                  {curSol&&(
                    <>
                      <div className="orb" style={{fontSize:18,color:GRN,marginTop:4}}>{signU(curSol.dropMoa)}</div>
                      <div style={{fontSize:6,color:"rgba(0,255,65,.4)"}}>{unitLbl}</div>
                      {Math.abs(curSol.windMoa)>0.2&&<div style={{fontSize:9,color:CYN}}>{signU(curSol.windMoa)} ⇾</div>}
                    </>
                  )}
                  <div style={{fontSize:8,color:"rgba(255,170,0,.6)",marginTop:4}}>{curTarget.pos}</div>
                  <ShotDots total={curTarget.shots} remaining={shotsLeft}/>
                </div>
              ):(
                <div style={{textAlign:"center",paddingTop:10}}>
                  <div style={{fontSize:22,color:"rgba(0,255,65,.1)"}}>⊙</div>
                  <div style={{fontSize:9,color:"rgba(0,255,65,.25)",marginTop:6}}>TAP PER<br/>STAGE</div>
                </div>
              )}
            </Widget>

            {/* WIDGET VENTO */}
            <Widget label="VENTO" color={CYN} onClick={()=>setActivePanel("wind")} active={bleConnected}
              badge={bleConnected?"◉":null}>
              <div style={{textAlign:"center",paddingTop:6}}>
                <div className="orb" style={{fontSize:28,color:CYN,lineHeight:1}}>{wx.wind.toFixed(1)}</div>
                <div style={{fontSize:8,color:"rgba(0,212,255,.5)"}}>m/s</div>
                <div style={{fontSize:14,color:"rgba(0,212,255,.6)",marginTop:4}}>
                  {WIND_DIRS.find(d=>Math.abs(d.a-wx.windAngle)<23)?.l??`${wx.windAngle}°`}
                </div>
                <div style={{fontSize:7,color:"rgba(0,255,65,.35)",marginTop:4}}>{wx.temp}°C · {wx.alt}m</div>
                {bleConnected&&<div style={{fontSize:6,color:CYN,marginTop:2}}>{bleName}</div>}
              </div>
            </Widget>

            {/* WIDGET TIMER */}
            <Widget label="TIMER" color={timerColor} onClick={()=>setActivePanel("timer")} active={timerRunning}>
              <div style={{textAlign:"center",paddingTop:6}}>
                <div className="orb" style={{
                  fontSize:28,color:timerColor,lineHeight:1,
                  animation:timerLeft!==null&&timerLeft<=10?"timerWarn .5s ease-in-out infinite":"none",
                }}>{fmtTime(timerLeft??timerSecs)}</div>
                {timerRunning&&<div style={{fontSize:7,color:timerColor,marginTop:4,animation:"bleBlip 1s infinite"}}>IN CORSO</div>}
                {!timerRunning&&timerLeft===null&&<div style={{fontSize:7,color:"rgba(0,255,65,.3)",marginTop:4}}>{timerSecs}s</div>}
                {shotDetect&&<div style={{fontSize:6,color:RED,marginTop:6}}>🎙 {audioDb}dB</div>}
              </div>
            </Widget>
          </div>

          {/* Range card rapida */}
          {rangeCard.length>0&&(
            <div className="card">
              <div className="lbl" style={{marginBottom:5}}>RANGE CARD — {unitLbl}</div>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(rangeCard.length,ammoGroup==="RIMFIRE"?10:7)},1fr)`,gap:3}}>
                {rangeCard.map(r=>(
                  <div key={r.dist} onClick={()=>setDist(r.dist)} style={{
                    background:r.dist===dist?"rgba(0,255,65,.1)":"rgba(0,255,65,.02)",
                    border:`1px solid ${r.dist===dist?"rgba(0,255,65,.35)":"rgba(0,255,65,.06)"}`,
                    padding:"3px 1px",textAlign:"center",cursor:"pointer",borderRadius:2}}>
                    <div style={{fontSize:6,color:"rgba(0,255,65,.3)"}}>{r.dist}</div>
                    <div className="orb" style={{fontSize:9,color:r.supersonic===false?AMB:GRN}}>{signU(r.dropMoa??0,1)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profilo attivo + slider dist */}
          <div className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontSize:9,color:GRN,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {activeProfile?.name??ammoKey}
                </div>
                <div style={{fontSize:6,color:"rgba(0,255,65,.35)",marginTop:1}}>
                  BC:{ammoData?.bc_g7} · MV:<span style={{color:wx.mv?CYN:GRN}}>{wx.mv??ammoData?.mv}m/s{wx.mv?' ✓':''}</span> · ◎{zeroM}m
                </div>
              </div>
            </div>
            <div className="lbl">DISTANZA — <span className="orb" style={{fontSize:13,color:GRN}}>{dist}m</span></div>
            <input type="range" className="vg-range" min={10} max={zeroM<=50?500:2000} value={dist}
              onChange={e=>setDist(+e.target.value)}/>
          </div>

          {stageActive&&(
            <button className="btn-prim amb" style={{width:"100%",fontSize:14,padding:"16px",letterSpacing:".2em"}}
              onClick={advanceTarget}>▶ AVANZA</button>
          )}
        </>
      )}

      {/* ═══ PANNELLO SOLVER ═══ */}
      {mainTab==="home"&&activePanel==="solver"&&(
        <>
          <div className="card">
            <div className="lbl">DISTANZA</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <input type="number" className="vg-in" value={dist} min={10} max={2500}
                onChange={e=>setDist(+e.target.value)}
                style={{width:100,fontSize:24,textAlign:"center",fontFamily:"Orbitron,monospace",fontWeight:700}}/>
              <span style={{fontSize:12,color:"rgba(0,255,65,.4)"}}>{U.distL(units)}</span>
              <div style={{flex:1}}>
                <input type="range" className="vg-range" min={10} max={zeroM<=50?500:2000} value={dist}
                  onChange={e=>setDist(+e.target.value)}/>
              </div>
            </div>
          </div>

          {sol&&(
            <>
              <div className={pulse?"pulse-sol":""} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div className="card" style={{borderColor:"rgba(0,255,65,.3)"}}>
                  <div className="lbl">ALZO</div>
                  <div className="orb" style={{fontSize:34,color:sol.dropMoa>=0?GRN:AMB,lineHeight:1}}>{signU(sol.dropMoa)}</div>
                  <div style={{fontSize:9,color:"rgba(0,255,65,.35)",marginTop:2}}>{unitLbl}</div>
                  <div style={{fontSize:9,color:"rgba(0,255,65,.25)",marginTop:4}}>
                    {unit==="MOA"?`${signU(sol.dropMoad??sol.dropMoa/3.4377,3)} mrad`:`${signU(sol.dropMoa*3.4377)} MOA`}
                  </div>
                </div>
                <div className="card" style={{borderColor:"rgba(0,212,255,.25)"}}>
                  <div className="lbl">DERIVA VENTO</div>
                  <div className="orb" style={{fontSize:34,color:Math.abs(sol.windMoa)>1.5?AMB:GRN,lineHeight:1}}>{signU(sol.windMoa)}</div>
                  <div style={{fontSize:9,color:"rgba(0,255,65,.35)",marginTop:2}}>{unitLbl}</div>
                  <div style={{fontSize:9,color:"rgba(0,212,255,.45)",marginTop:4}}>{wx.wind}m/s@{wx.windAngle}°</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:8}}>
                {[
                  ["TOF",sol.tofMs,"ms",GRN],
                  ["VEL",U.vel(sol.velMs,units),U.velL(units),sol.supersonic?GRN:AMB],
                  ["ENERGIA",U.en(sol.eneJ,units),U.enL(units),GRN],
                  ["SPIN",signU(sol.sdMoa,unit==="MOA"?2:3),unitLbl,"rgba(0,255,65,.5)"],
                ].map(([l,v,u,c])=>(
                  <div key={l} style={{background:"rgba(0,255,65,.025)",border:"1px solid rgba(0,255,65,.08)",padding:"8px 4px",textAlign:"center",borderRadius:2}}>
                    <div className="lbl">{l}</div>
                    <div className="orb" style={{fontSize:13,color:c,marginTop:2}}>{v}</div>
                    <div style={{fontSize:7,color:"rgba(0,255,65,.3)"}}>{u}</div>
                  </div>
                ))}
              </div>
              {!sol.supersonic&&(
                <div style={{padding:"8px 10px",background:"rgba(255,170,0,.05)",border:"1px solid rgba(255,170,0,.2)",fontSize:9,color:AMB,marginBottom:8}}>
                  ⚠ SUBSONICO A {dist}m
                </div>
              )}
            </>
          )}

          {/* Range card completa */}
          <div className="card">
            <div className="lbl" style={{marginBottom:6}}>RANGE CARD — {unitLbl}</div>
            <div style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr 44px 36px",gap:4,padding:"3px 6px",
              background:"rgba(0,255,65,.04)",borderRadius:2,marginBottom:4}}>
              {["DIST","ALZO","VENTO","TOF","VEL"].map(h=>(
                <div key={h} style={{fontSize:6,color:"rgba(0,255,65,.38)",letterSpacing:".06em"}}>{h}</div>
              ))}
            </div>
            {rangeCard.map(r=>(
              <div key={r.dist} onClick={()=>{setDist(r.dist);setActivePanel(null)}}
                style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr 44px 36px",gap:4,
                  padding:"6px 6px",border:`1px solid ${r.dist===dist?"rgba(0,255,65,.3)":"rgba(0,255,65,.06)"}`,
                  background:r.dist===dist?"rgba(0,255,65,.06)":"transparent",marginBottom:2,cursor:"pointer",borderRadius:2}}>
                <div className="orb" style={{fontSize:11,color:GRN}}>{r.dist}m</div>
                <div className="orb" style={{fontSize:13,color:r.dropMoa>=0?GRN:AMB}}>{signU(r.dropMoa??0,1)}</div>
                <div className="orb" style={{fontSize:13,color:Math.abs(r.windMoa??0)>0.5?CYN:"rgba(0,255,65,.4)"}}>{signU(r.windMoa??0,1)}</div>
                <div style={{fontSize:9,color:"rgba(0,255,65,.45)"}}>{r.tofMs}ms</div>
                <div style={{fontSize:8,color:r.supersonic===false?AMB:"rgba(0,255,65,.4)"}}>{r.velMs}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══ PANNELLO VENTO ═══ */}
      {mainTab==="home"&&activePanel==="wind"&&(
        <>
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>VENTO LIVE</div>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              <WindRose angle={wx.windAngle} setAngle={a=>setWx(w=>({...w,windAngle:a}))}/>
              <div style={{flex:1}}>
                <div className="orb" style={{fontSize:36,color:CYN,lineHeight:1}}>{wx.wind.toFixed(1)}</div>
                <div style={{fontSize:9,color:"rgba(0,212,255,.5)"}}>m/s</div>
                <div style={{fontSize:14,color:CYN,marginTop:4}}>
                  {WIND_DIRS.find(d=>Math.abs(d.a-wx.windAngle)<23)?.l??`${wx.windAngle}°`}
                </div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,marginTop:10}}>
              {WIND_DIRS.map(({a,l})=>(
                <button key={a} className={`pill${Math.abs(wx.windAngle-a)<23?" on":""}`}
                  style={{textAlign:"center"}}
                  onClick={()=>setWx(w=>({...w,windAngle:a}))}>{l}</button>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>CALYPSO BLE</div>
            {!bleConnected?(
              <button className="btn-prim" style={{width:"100%"}} onClick={connectCalypso}>◉ CONNETTI CALYPSO</button>
            ):(
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:10,color:GRN}}>◉ {bleName}</div>
                  <div style={{fontSize:7,color:"rgba(0,255,65,.4)"}}>Dati live</div>
                </div>
                <button className="btn-out red" style={{fontSize:9,padding:"6px 10px"}} onClick={disconnectCalypso}>DISC.</button>
              </div>
            )}
            {bleError&&<div style={{fontSize:8,color:AMB,marginTop:8}}>{bleError}</div>}
          </div>
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>KESTREL 5700 ELITE BLE</div>
            {!kestrelConnected?(
              <button className="btn-prim" style={{width:"100%",background:CYN,color:"#020c04"}}
                onClick={connectKestrel}>◉ CONNETTI KESTREL</button>
            ):(
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:10,color:CYN}}>◉ {kestrelName}</div>
                  <div style={{fontSize:7,color:"rgba(0,212,255,.4)"}}>Temp · Vento · Umidità live</div>
                </div>
                <button className="btn-out" style={{fontSize:9,padding:"6px 10px",color:RED,borderColor:"rgba(255,51,68,.3)"}}
                  onClick={disconnectKestrel}>DISC.</button>
              </div>
            )}
            {bleError&&bleError.includes("Kestrel")&&(
              <div style={{fontSize:8,color:AMB,marginTop:6}}>{bleError}</div>
            )}
          </div>

          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>ATMOSFERA</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                ["VENTO (m/s)","wind",wx.wind,.1],
                ["DIREZIONE °","windAngle",wx.windAngle,1],
                [`TEMP (${U.tempL(units)})`,"temp",U.temp(wx.temp,units),1],
                [`QUOTA (${U.altL(units)})`,"alt",U.alt(wx.alt,units),10],
              ].map(([l,k,v,step])=>(
                <div key={k}>
                  <div className="lbl">{l}</div>
                  <input type="number" className="vg-in" step={step} value={v}
                    onChange={e=>{
                      const raw=+e.target.value
                      if(k==="temp")setWx(w=>({...w,temp:U.toC(raw,units)}))
                      else if(k==="alt")setWx(w=>({...w,alt:+(raw/(units==="imp"?3.281:1)).toFixed(0)}))
                      else setWx(w=>({...w,[k]:raw}))
                    }}/>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="lbl" style={{marginBottom:6}}>XERO C1 — INPUT LASER MANUALE</div>
            <div style={{fontSize:7,color:"rgba(0,255,65,.3)",marginBottom:8,lineHeight:1.7}}>
              Il Garmin Xero C1 usa ANT+, non supportato via browser.
              Inserisci distanza misurata o usa il comando vocale "Vega distanza 150".
            </div>
            <div style={{display:"flex",gap:8}}>
              <input type="number" className="vg-in"
                style={{flex:1,fontSize:22,fontFamily:"Orbitron,monospace",textAlign:"center"}}
                value={dist} min={10} max={2500} onChange={e=>setDist(+e.target.value)}/>
              <span style={{alignSelf:"center",fontSize:10,color:"rgba(0,255,65,.4)"}}>m</span>
              <button className="btn-prim" style={{fontSize:9,padding:"10px 14px"}}
                onClick={()=>{setMainTab("home");setActivePanel(null)}}>→</button>
            </div>
          </div>

          <div className="card">
            <div className="lbl" style={{marginBottom:6}}>MV CRONOGRAFO</div>
            <MVPanel mvList={mvList} onAdd={v=>setMvList(l=>[...l,v])} onRemove={i=>setMvList(l=>l.filter((_,j)=>j!==i))}
              onApply={avg=>{setWx(w=>({...w,mv:+avg.toFixed(1)}));speak(`MV ${avg.toFixed(1)}`)}}
              appliedMv={wx.mv}/>
            {wx.mv&&<button className="btn-out" style={{marginTop:8,width:"100%",fontSize:9}}
              onClick={()=>setWx(w=>({...w,mv:null}))}>RESET MV</button>}
          </div>
        </>
      )}

      {/* ═══ PANNELLO STAGE ═══ */}
      {mainTab==="home"&&activePanel==="stage"&&(
        <>
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>STAGE LIBRARY — {stages.length}</div>
            {stages.map(s=>(
              <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"10px",border:`1px solid ${currentStage?.id===s.id?"rgba(255,170,0,.4)":"rgba(0,255,65,.1)"}`,
                background:currentStage?.id===s.id?"rgba(255,170,0,.04)":"transparent",
                cursor:"pointer",transition:"all .15s",marginBottom:5,borderRadius:2}}>
                <div style={{minWidth:0,flex:1}} onClick={()=>loadStage(s)}>
                  <div style={{fontSize:10,color:currentStage?.id===s.id?AMB:GRN,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                  <div style={{fontSize:7,color:"rgba(0,255,65,.35)",marginTop:2}}>{s.desc} · {s.par}s · {s.targets.length}T</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  {s.id>5&&<span style={{color:RED,fontSize:14,cursor:"pointer",padding:"0 4px"}}
                    onClick={()=>setStages(prev=>prev.filter(x=>x.id!==s.id))}>×</span>}
                  <button className="btn-prim" style={{fontSize:9,padding:"6px 12px"}} onClick={()=>loadStage(s)}>CARICA</button>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>IMPORTA PDF / TXT</div>
            <label style={{display:"block",padding:"18px",border:"1px dashed rgba(0,255,65,.25)",
              textAlign:"center",cursor:"pointer",background:"rgba(0,255,65,.02)",borderRadius:2}}>
              <input type="file" accept=".pdf,.txt" style={{display:"none"}} onChange={e=>handlePdfFile(e.target.files[0])}/>
              <div style={{fontSize:28,color:"rgba(0,255,65,.3)",marginBottom:6}}>⊕</div>
              <div style={{fontSize:10,color:"rgba(0,255,65,.5)"}}>{pdfLoading?"Analisi...":"TAP PER SELEZIONARE"}</div>
            </label>
            {bleError&&<div style={{fontSize:8,color:AMB,marginTop:6}}>{bleError}</div>}
          </div>
          {stageSols.length>0&&currentStage&&(
            <div className="card">
              <div className="lbl" style={{marginBottom:6}}>DOPE CARD — {currentStage.name}</div>
              {stageSols.map((s,i)=>(
                <div key={s.id} style={{display:"grid",gridTemplateColumns:"24px 44px 1fr 1fr 42px",gap:4,
                  padding:"7px 6px",border:`1px solid ${i===tgtIdx&&stageActive?"rgba(255,170,0,.4)":"rgba(0,255,65,.06)"}`,
                  background:i===tgtIdx&&stageActive?"rgba(255,170,0,.04)":"transparent",
                  marginBottom:2,cursor:"pointer",borderRadius:2}} onClick={()=>{setDist(s.dist);setActivePanel(null)}}>
                  <div className="orb" style={{fontSize:9,color:i===tgtIdx&&stageActive?AMB:"rgba(0,255,65,.35)"}}>T{s.id}</div>
                  <div className="orb" style={{fontSize:11,color:i===tgtIdx&&stageActive?AMB:GRN}}>{s.dist}m</div>
                  <div className="orb" style={{fontSize:13,color:GRN}}>{signU(s.dropMoa??0,1)} <span style={{fontSize:6,opacity:.4}}>{unitLbl}</span></div>
                  <div className="orb" style={{fontSize:13,color:Math.abs(s.windMoa??0)>0.5?CYN:"rgba(0,255,65,.4)"}}>{signU(s.windMoa??0,1)}</div>
                  <div style={{fontSize:8,color:s.supersonic===false?AMB:"rgba(0,255,65,.4)"}}>{s.velMs}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ PANNELLO TIMER ═══ */}
      {mainTab==="home"&&activePanel==="timer"&&(
        <>
          <div className="card" style={{textAlign:"center"}}>
            <div className="orb" style={{
              fontSize:72,fontWeight:900,lineHeight:1,color:timerColor,
              filter:timerLeft!==null?`drop-shadow(0 0 ${timerLeft<=10?28:6}px ${timerColor})`:"none",
              animation:timerLeft!==null&&timerLeft<=10?"timerWarn .5s ease-in-out infinite":"none",
              marginBottom:12,marginTop:8,
            }}>{fmtTime(timerLeft)}</div>
            <div style={{display:"flex",gap:8,justifyContent:"center",alignItems:"center",marginBottom:12}}>
              <input type="number" className="vg-in" style={{width:90,textAlign:"center",fontFamily:"Orbitron,monospace",fontSize:20}}
                value={timerSecs} onChange={e=>setTimerSecs(+e.target.value)} min={10} max={600}/>
              <span style={{fontSize:10,color:"rgba(0,255,65,.4)"}}>sec</span>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button className="btn-prim" style={{fontSize:13,padding:"12px 28px"}} onClick={()=>startTimer(0)}>▶ AVVIA</button>
              {timerRunning&&<button className="btn-out red" style={{fontSize:13,padding:"12px 18px"}} onClick={stopTimer}>■ STOP</button>}
            </div>
          </div>

          {/* Alert personalizzabili */}
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>ALERT TIMER</div>
            {timerAlerts.map(al=>(
              <div key={al.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",
                borderBottom:"1px solid rgba(0,255,65,.06)"}}>
                <div className="toggle-wrap" style={{flex:1}}
                  onClick={()=>setTimerAlerts(prev=>prev.map(a=>a.id===al.id?{...a,enabled:!a.enabled}:a))}>
                  <div className={`toggle-bg${al.enabled?" on":""}`}><div className="toggle-knob"/></div>
                  <span style={{fontSize:10,color:al.enabled?GRN:"rgba(0,255,65,.35)"}}>{al.label} — {al.secs}s</span>
                </div>
                <span style={{color:RED,fontSize:16,cursor:"pointer",padding:"0 4px"}}
                  onClick={()=>setTimerAlerts(prev=>prev.filter(a=>a.id!==al.id))}>×</span>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <input type="number" className="vg-in" style={{flex:1}} placeholder="secondi (es. 45)"
                value={newAlertSecs} onChange={e=>setNewAlertSecs(e.target.value)}/>
              <button className="btn-prim" style={{fontSize:9,padding:"8px 14px"}}
                onClick={()=>{
                  const s=+newAlertSecs
                  if(s>0&&s<=600){
                    setTimerAlerts(prev=>[...prev,{id:Date.now(),secs:s,label:`${s} sec`,enabled:true}])
                    setNewAlertSecs("")
                  }
                }}>+ ADD</button>
            </div>
            {/* Countdown 10s toggle */}
            <div className="toggle-wrap" style={{marginTop:12}}
              onClick={()=>setCountdown10(v=>!v)}>
              <div className={`toggle-bg${countdown10?" on":""}`}><div className="toggle-knob"/></div>
              <span style={{fontSize:10,color:countdown10?GRN:"rgba(0,255,65,.35)"}}>Bip countdown ultimi 10 secondi</span>
            </div>
            {/* 3 bip allo scadere — sempre attivo */}
            <div style={{fontSize:8,color:"rgba(0,255,65,.3)",marginTop:8,lineHeight:1.8}}>
              Allo scadere: 3 bip consecutivi + voce "Tempo scaduto"
            </div>
          </div>

          {/* Shot detection */}
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>RILEVAMENTO COLPO AUDIO</div>
            <div className="toggle-wrap" style={{marginBottom:10}} onClick={()=>setShotDetect(v=>!v)}>
              <div className={`toggle-bg${shotDetect?" on":""}`}><div className="toggle-knob"/></div>
              <span style={{fontSize:10,color:shotDetect?GRN:"rgba(0,255,65,.4)"}}>
                {shotDetect?"ATTIVO":"DISATTIVATO"}
              </span>
            </div>
            {shotDetect&&(
              <>
                <div style={{marginBottom:8}}>
                  <div className="lbl">SOGLIA ({shotThreshold} dB)</div>
                  <input type="range" className="vg-range" min={-60} max={-5} value={shotThreshold}
                    onChange={e=>setShotThreshold(+e.target.value)}/>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:9,color:"rgba(0,255,65,.4)",minWidth:34}}>{audioDb}dB</span>
                  <DbMeter db={audioDb} threshold={shotThreshold}/>
                </div>
                {!micReady&&<div style={{fontSize:8,color:AMB,marginTop:6}}>⚠ Autorizzazione microfono...</div>}
              </>
            )}
          </div>
        </>
      )}

      {/* ═══ TAB PROFILI ═══ */}
      {mainTab==="profiles"&&!activePanel&&(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div className="lbl">PROFILI FUCILE — max 10</div>
            {profiles.length<10&&(
              <button className="btn-prim prp" style={{fontSize:9,padding:"6px 14px"}}
                onClick={()=>{
                  setEditingProfile({...PROFILE_TEMPLATE,id:Date.now()})
                  setActivePanel("profile_edit")
                }}>+ NUOVO</button>
            )}
          </div>
          {profiles.length===0&&(
            <div className="card" style={{textAlign:"center",padding:"30px"}}>
              <div style={{fontSize:30,color:"rgba(0,255,65,.1)",marginBottom:10}}>⊙</div>
              <div style={{fontSize:10,color:"rgba(0,255,65,.3)"}}>Nessun profilo.<br/>Crea il tuo setup fucile.</div>
            </div>
          )}
          {profiles.map(p=>(
            <div key={p.id} style={{
              padding:"12px",border:`1px solid ${activeProfileId===p.id?"rgba(0,255,65,.5)":"rgba(0,255,65,.12)"}`,
              background:activeProfileId===p.id?"rgba(0,255,65,.06)":"rgba(0,255,65,.02)",
              marginBottom:8,borderRadius:2}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:activeProfileId===p.id?GRN:AMB,fontFamily:"Orbitron,monospace",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name||"—"}</div>
                  <div style={{fontSize:8,color:"rgba(0,255,65,.45)",marginTop:3}}>
                    {p.caliber} · {p.ammoKey} · ◎{p.zeroM}m
                    {p.bcValue>0&&<span style={{color:CYN}}> · BC✓{p.bcValue}</span>}
                    {p.mvMs&&<span style={{color:GRN}}> · MV:{p.mvMs}m/s</span>}
                  </div>
                  <div style={{fontSize:8,color:"rgba(0,212,255,.45)",marginTop:2}}>
                    {p.scopeName||"—"} · {p.scopePlane} · h={p.scopeHeightCm}cm · {p.reticleType} {p.clickValue}cl
                  </div>
                  <div style={{fontSize:7,color:"rgba(0,255,65,.3)",marginTop:2}}>
                    Canna: {p.barrelLengthIn}" · Twist: 1:{p.twistDen}
                    {p.mvMs?" · MV:"+p.mvMs+"m/s":""}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,marginLeft:8,flexShrink:0}}>
                  <button className="btn-out" style={{fontSize:8,padding:"5px 8px"}}
                    onClick={()=>{setEditingProfile({...p});setActivePanel("profile_edit")}}>✏</button>
                  <button className="btn-prim" style={{fontSize:8,padding:"5px 10px"}}
                    onClick={()=>applyProfile(p)}>USA</button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ═══ EDITOR PROFILO ═══ */}
      {mainTab==="profiles"&&activePanel==="profile_edit"&&editingProfile&&(
        <>
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>IDENTITÀ</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[["NOME PROFILO","name",editingProfile.name,"es. Bergara B14 .22LR"],
                ["CALIBRO","caliber",editingProfile.caliber,"es. .22LR"]].map(([l,k,v,ph])=>(
                <div key={k}>
                  <div className="lbl">{l}</div>
                  <input type="text" className="vg-in" placeholder={ph} value={v}
                    onChange={e=>setEditingProfile(p=>({...p,[k]:e.target.value}))}/>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>CANNA</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div>
                <div className="lbl">LUNGHEZZA (pollici)</div>
                <input type="number" className="vg-in" step={.5} value={editingProfile.barrelLengthIn}
                  onChange={e=>setEditingProfile(p=>({...p,barrelLengthIn:+e.target.value}))}/>
              </div>
              <div>
                <div className="lbl">TWIST 1:___"</div>
                <input type="number" className="vg-in" step={1} value={editingProfile.twistDen}
                  onChange={e=>setEditingProfile(p=>({...p,twistDen:+e.target.value}))}/>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>PROIETTILE CUSTOM</div>
            <div style={{fontSize:7,color:"rgba(0,255,65,.3)",marginBottom:8}}>
              Lascia vuoto per usare i valori del catalogo munizioni
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div style={{gridColumn:"1/-1"}}>
                <div className="lbl">NOME PROIETTILE</div>
                <input type="text" className="vg-in" placeholder="es. Lapua Center-X 40gr"
                  value={editingProfile.bulletName??""} onChange={e=>setEditingProfile(p=>({...p,bulletName:e.target.value}))}/>
              </div>
              <div>
                <div className="lbl">PESO (gr)</div>
                <input type="number" className="vg-in" step={.5} placeholder="es. 40"
                  value={editingProfile.bulletWeightGr||""} onChange={e=>setEditingProfile(p=>({...p,bulletWeightGr:+e.target.value}))}/>
              </div>
              <div>
                <div className="lbl">DIAMETRO (mm)</div>
                <input type="number" className="vg-in" step={.01} placeholder="es. 5.59"
                  value={editingProfile.bulletDiaMm||""} onChange={e=>setEditingProfile(p=>({...p,bulletDiaMm:+e.target.value}))}/>
              </div>
              <div>
                <div className="lbl">MODELLO BC</div>
                <div style={{display:"flex",gap:4}}>
                  {["G7","G1"].map(v=>(
                    <button key={v} className={`pill${editingProfile.bcModel===v?" on":""}`}
                      style={{flex:1}} onClick={()=>setEditingProfile(p=>({...p,bcModel:v}))}>{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="lbl">BC {editingProfile.bcModel??'G7'}</div>
                <input type="number" className="vg-in" step={.001} placeholder="es. 0.065"
                  value={editingProfile.bcValue||""} onChange={e=>setEditingProfile(p=>({...p,bcValue:+e.target.value}))}/>
              </div>
              <div>
                <div className="lbl">MV CUSTOM (m/s)</div>
                <input type="number" className="vg-in" step={1} placeholder="vuoto = tabellare"
                  value={editingProfile.mvMs??""} onChange={e=>setEditingProfile(p=>({...p,mvMs:e.target.value?+e.target.value:null}))}/>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>MUNIZIONE</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
              {Object.keys(AMMO_CATALOG).map(g=>(
                <button key={g} className={`pill${editingProfile.ammoGroup===g?" on":""}`}
                  onClick={()=>setEditingProfile(p=>({...p,ammoGroup:g,ammoKey:Object.keys(AMMO_CATALOG[g])[0]}))}>
                  {g}
                </button>
              ))}
            </div>
            <select className="vg-sel" value={editingProfile.ammoKey}
              onChange={e=>setEditingProfile(p=>({...p,ammoKey:e.target.value}))}>
              {Object.keys(AMMO_CATALOG[editingProfile.ammoGroup]).map(k=>(
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>OTTICA</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div>
                <div className="lbl">MODELLO OTTICA</div>
                <input type="text" className="vg-in" placeholder="es. Discovery XED 6-36x56"
                  value={editingProfile.scopeName}
                  onChange={e=>setEditingProfile(p=>({...p,scopeName:e.target.value}))}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div>
                  <div className="lbl">PIANO FOCALE</div>
                  <div style={{display:"flex",gap:4}}>
                    {["FFP","SFP"].map(v=>(
                      <button key={v} className={`pill${editingProfile.scopePlane===v?" on":""}`}
                        style={{flex:1}} onClick={()=>setEditingProfile(p=>({...p,scopePlane:v}))}>{v}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="lbl">RETICOLO</div>
                  <div style={{display:"flex",gap:4}}>
                    {["mrad","MOA","ibrido"].map(v=>(
                      <button key={v} className={`pill${editingProfile.reticleType===v?" on":""}`}
                        style={{flex:1,fontSize:9}} onClick={()=>setEditingProfile(p=>({...p,reticleType:v}))}>{v}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="lbl">H LINEA VISIVA (cm)</div>
                  <input type="number" className="vg-in" step={.1} value={editingProfile.scopeHeightCm}
                    onChange={e=>setEditingProfile(p=>({...p,scopeHeightCm:+e.target.value}))}/>
                </div>
                <div>
                  <div className="lbl">CLICK VALUE</div>
                  <input type="number" className="vg-in" step={.01} value={editingProfile.clickValue}
                    onChange={e=>setEditingProfile(p=>({...p,clickValue:+e.target.value}))}/>
                </div>
                <div>
                  <div className="lbl">ZOOM MIN</div>
                  <input type="number" className="vg-in" step={1} value={editingProfile.zoomMin??6}
                    onChange={e=>setEditingProfile(p=>({...p,zoomMin:+e.target.value}))}/>
                </div>
                <div>
                  <div className="lbl">ZOOM MAX</div>
                  <input type="number" className="vg-in" step={1} value={editingProfile.zoomMax??36}
                    onChange={e=>setEditingProfile(p=>({...p,zoomMax:+e.target.value}))}/>
                </div>
                <div>
                  <div className="lbl">HASH {editingProfile.reticleType??'mrad'}</div>
                  <input type="number" className="vg-in" step={.1} value={editingProfile.reticleHash??1.0}
                    onChange={e=>setEditingProfile(p=>({...p,reticleHash:+e.target.value}))}/>
                </div>
                <div>
                  <div className="lbl">SUB-HASH</div>
                  <input type="number" className="vg-in" step={.1} value={editingProfile.reticleSubHash??0.5}
                    onChange={e=>setEditingProfile(p=>({...p,reticleSubHash:+e.target.value}))}/>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>ZERO</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div>
                <div className="lbl">ZERO (m)</div>
                <input type="number" className="vg-in" step={5} value={editingProfile.zeroM}
                  onChange={e=>setEditingProfile(p=>({...p,zeroM:+e.target.value}))}/>
              </div>
              <div>
                <div className="lbl">MV CUSTOM (m/s)</div>
                <input type="number" className="vg-in" step={1} placeholder="vuoto = tabellare"
                  value={editingProfile.mvMs??""} 
                  onChange={e=>setEditingProfile(p=>({...p,mvMs:e.target.value?+e.target.value:null}))}/>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="lbl" style={{marginBottom:6}}>NOTE</div>
            <textarea className="vg-in" rows={3} style={{resize:"vertical"}}
              placeholder="cariche, condizioni, note gara..."
              value={editingProfile.notes??""} onChange={e=>setEditingProfile(p=>({...p,notes:e.target.value}))}/>
          </div>

          <div className="card" style={{borderColor:"rgba(0,212,255,.2)"}}>
            <div className="lbl" style={{marginBottom:8,color:CYN}}>TRUING BALISTICO — BC G7</div>
            <div style={{fontSize:8,color:"rgba(0,255,65,.4)",marginBottom:10,lineHeight:1.7}}>
              Inserisci il drop REALE misurato al poligono per ogni distanza.
              VEGA calcola il BC G7 truato e lo salva nel profilo.
            </div>

            {/* Tabella misure */}
            <div style={{display:"grid",gridTemplateColumns:"52px 1fr 70px 32px",gap:4,
              padding:"4px 0",marginBottom:4}}>
              {["DIST","DROP REALE","UNITÀ",""].map(h=>(
                <div key={h} style={{fontSize:6,color:"rgba(0,255,65,.3)",letterSpacing:".1em"}}>{h}</div>
              ))}
            </div>
            {truingRows.map((row,i)=>(
              <div key={row.id} style={{display:"grid",gridTemplateColumns:"52px 1fr 70px 32px",
                gap:4,marginBottom:6,alignItems:"center"}}>
                <input type="number" className="vg-in" style={{fontSize:13,textAlign:"center"}}
                  placeholder="m" value={row.dist||""}
                  onChange={e=>setTruingRows(prev=>prev.map(r=>r.id===row.id?{...r,dist:+e.target.value}:r))}/>
                <input type="number" className="vg-in" style={{fontSize:13}} step={.01}
                  placeholder="es. 2.10" value={row.dropMeas??""} 
                  onChange={e=>setTruingRows(prev=>prev.map(r=>r.id===row.id?{...r,dropMeas:e.target.value?+e.target.value:null}:r))}/>
                <div style={{display:"flex",gap:2}}>
                  {["mrad","MOA"].map(u=>(
                    <button key={u} className={`pill${row.unit===u?" on":""}`}
                      style={{flex:1,fontSize:8,padding:"4px 2px"}}
                      onClick={()=>setTruingRows(prev=>prev.map(r=>r.id===row.id?{...r,unit:u}:r))}>
                      {u}
                    </button>
                  ))}
                </div>
                {truingRows.length>1?(
                  <span style={{color:RED,fontSize:14,cursor:"pointer",textAlign:"center"}}
                    onClick={()=>setTruingRows(prev=>prev.filter(r=>r.id!==row.id))}>×</span>
                ):<div/>}
              </div>
            ))}

            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <button className="btn-out" style={{fontSize:9,flex:1}}
                onClick={()=>setTruingRows(prev=>[...prev,{id:Date.now(),dist:150,dropMeas:null,unit:"mrad"}])}>
                + AGGIUNGI DISTANZA
              </button>
              <button className="btn-prim" style={{fontSize:9,flex:1,background:CYN,color:"#020c04"}}
                onClick={computeTruing}>
                CALCOLA BC TRUATO
              </button>
            </div>

            {truingMsg&&(
              <div style={{fontSize:8,color:CYN,background:"rgba(0,212,255,.06)",
                border:"1px solid rgba(0,212,255,.2)",padding:"8px 10px",lineHeight:1.8}}>
                {truingMsg}
              </div>
            )}

            {/* MV truing */}
            <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(0,255,65,.08)"}}>
              <div className="lbl" style={{marginBottom:6}}>TRUING MV — inserisci drop a zero noto</div>
              <div style={{fontSize:8,color:"rgba(0,255,65,.35)",marginBottom:8,lineHeight:1.6}}>
                Spara a distanza di zero, misura l'impatto reale vs aspettato.
                Oppure usa il cronografo per MV diretta.
              </div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}>
                  <div className="lbl">MV MISURATA (m/s)</div>
                  <input type="number" className="vg-in" step={1}
                    placeholder={String(ammoData?.mv??320)}
                    value={editingProfile.mvMs??""} 
                    onChange={e=>setEditingProfile(p=>({...p,mvMs:e.target.value?+e.target.value:null}))}/>
                </div>
                {editingProfile.bcValue>0&&(
                  <div style={{flex:1,textAlign:"center",padding:"8px",
                    background:"rgba(0,212,255,.04)",border:"1px solid rgba(0,212,255,.15)"}}>
                    <div className="lbl">BC TRUATO</div>
                    <div className="orb" style={{fontSize:18,color:CYN}}>{editingProfile.bcValue}</div>
                    <div style={{fontSize:7,color:"rgba(0,212,255,.4)"}}>G7 salvato</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <button className="btn-prim" style={{flex:1,fontSize:11}} onClick={()=>{
              setProfiles(prev=>{
                const idx=prev.findIndex(p=>p.id===editingProfile.id)
                if(idx>=0){const n=[...prev];n[idx]=editingProfile;return n}
                return [...prev,editingProfile]
              })
              setActivePanel(null); setEditingProfile(null)
            }}>SALVA PROFILO</button>
            {profiles.find(p=>p.id===editingProfile.id)&&(
              <button className="btn-out red" style={{fontSize:11,padding:"10px 14px"}} onClick={()=>{
                setProfiles(prev=>prev.filter(p=>p.id!==editingProfile.id))
                if(activeProfileId===editingProfile.id)setActiveProfileId(null)
                setActivePanel(null); setEditingProfile(null)
              }}>ELIMINA</button>
            )}
          </div>
        </>
      )}

      {/* ═══ TAB SETUP ═══ */}
      {mainTab==="setup"&&(
        <>
          {/* Munizione */}
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>MUNIZIONE RAPIDA</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
              {Object.keys(AMMO_CATALOG).map(g=>(
                <button key={g} className={`pill${ammoGroup===g?" on":""}`}
                  onClick={()=>{setAmmoGroup(g);setAmmoKey(Object.keys(AMMO_CATALOG[g])[0])}}>
                  {g}
                </button>
              ))}
            </div>
            <select className="vg-sel" value={ammoKey} onChange={e=>setAmmoKey(e.target.value)}>
              {Object.keys(AMMO_CATALOG[ammoGroup]).map(k=>(
                <option key={k} value={k}>{k} · BC G7:{AMMO_CATALOG[ammoGroup][k].bc_g7} · {AMMO_CATALOG[ammoGroup][k].mv}m/s</option>
              ))}
            </select>
            {ammoData&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginTop:8}}>
                {[["BC G7",ammoData.bc_g7],["MV",ammoData.mv+"m/s"],["PESO",ammoData.wGr+"gr"],["CAL.",ammoData.dMm+"mm"]].map(([l,v])=>(
                  <div key={l} style={{textAlign:"center",padding:"5px",background:"rgba(0,255,65,.025)",border:"1px solid rgba(0,255,65,.07)",borderRadius:2}}>
                    <div className="lbl">{l}</div>
                    <div className="orb" style={{fontSize:11,color:GRN}}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ottica */}
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>OTTICA / MONTATURA</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div>
                <div className="lbl">H OTTICA (cm)</div>
                <input type="number" className="vg-in" step={.1} value={scopeH} onChange={e=>setScopeH(+e.target.value)}/>
              </div>
              <div>
                <div className="lbl">ZERO (m)</div>
                <input type="number" className="vg-in" step={5} value={zeroM} onChange={e=>setZeroM(+e.target.value)}/>
              </div>
            </div>
          </div>

          {/* Sistema unità */}
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>SISTEMA UNITÀ</div>
            <div style={{display:"flex",gap:8}}>
              <button className={`pill${units==="metric"?" on":""}`} style={{flex:1,fontSize:11}}
                onClick={()=>setUnits("metric")}>🌍 METRICO (m · m/s · °C)</button>
              <button className={`pill${units==="imp"?" on":""}`} style={{flex:1,fontSize:11}}
                onClick={()=>setUnits("imp")}>🇺🇸 IMPERIALE (yd · fps · °F)</button>
            </div>
            <div style={{fontSize:7,color:"rgba(0,255,65,.3)",marginTop:8,lineHeight:1.8}}>
              La fisica interna è sempre in SI (m, m/s, kg). Le unità influenzano solo il display e gli input.
              MOA e mrad restano invariati.
            </div>
          </div>

          {/* MOA/MRAD */}
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>UNITÀ ANGOLARI</div>
            <div style={{display:"flex",gap:8}}>
              <button className={`unit-btn${unit==="MOA"?" on":""}`} style={{flex:1,minHeight:44,fontSize:12}}
                onClick={()=>setUnit("MOA")}>MOA</button>
              <button className={`unit-btn${unit==="MRAD"?" on":""}`} style={{flex:1,minHeight:44,fontSize:12}}
                onClick={()=>setUnit("MRAD")}>MRAD</button>
            </div>
          </div>

          {/* Audio */}
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>AUDIO</div>
            <div className="toggle-wrap" style={{marginBottom:12}} onClick={()=>setAudio(a=>({...a,enabled:!a.enabled}))}>
              <div className={`toggle-bg${audio.enabled?" on":""}`}><div className="toggle-knob"/></div>
              <span style={{fontSize:10,color:audio.enabled?GRN:"rgba(0,255,65,.4)"}}>
                {audio.enabled?"AUDIO ATTIVO":"AUDIO DISATTIVATO"}
              </span>
            </div>
            {audio.enabled&&(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <div className="lbl">VOLUME</div>
                    <span className="orb" style={{fontSize:11,color:GRN}}>{Math.round(audio.volume*100)}%</span>
                  </div>
                  <input type="range" className="vg-range" min={0} max={1} step={.05} value={audio.volume}
                    onChange={e=>setAudio(a=>({...a,volume:+e.target.value}))}/>
                </div>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <div className="lbl">FREQUENZA BIP (Hz)</div>
                    <span className="orb" style={{fontSize:11,color:GRN}}>{audio.beepFreq}Hz</span>
                  </div>
                  <input type="range" className="vg-range" min={220} max={1760} step={110} value={audio.beepFreq}
                    onChange={e=>setAudio(a=>({...a,beepFreq:+e.target.value}))}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:7,color:"rgba(0,255,65,.3)",marginTop:2}}>
                    <span>220Hz basso</span><span>880Hz medio</span><span>1760Hz alto</span>
                  </div>
                </div>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <div className="lbl">DURATA BIP</div>
                    <span className="orb" style={{fontSize:11,color:GRN}}>{Math.round(audio.beepDur*1000)}ms</span>
                  </div>
                  <input type="range" className="vg-range" min={.05} max={.5} step={.05} value={audio.beepDur}
                    onChange={e=>setAudio(a=>({...a,beepDur:+e.target.value}))}/>
                </div>
                <button className="btn-out" style={{fontSize:10}}
                  onClick={()=>playBeep(audio.beepFreq,audio.beepDur,1)}>
                  ▶ TEST BIP
                </button>
              </div>
            )}
          </div>

          {/* Preset */}
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>PRESET RAPIDI</div>
            {[
              {name:"Bergara B14 · XED · .22LR",ammo:".22LR Lapua SLR",grp:"RIMFIRE",h:6.5,z:50},
              {name:"Discovery XED · SK LR",      ammo:".22LR SK LR Match",grp:"RIMFIRE",h:6.5,z:50},
              {name:"6.5 CM PRS Open",             ammo:"6.5 CM 140gr Berger",grp:"CF PRS",h:4.5,z:100},
              {name:".308 Win Match",               ammo:".308 Win 175gr SMK",grp:"CF PRS",h:4.0,z:100},
              {name:".338 LM ELR",                  ammo:".338 LM 300gr Lapua",grp:"MAGNUM",h:5.5,z:100},
            ].map(p=>(
              <button key={p.name} className="btn-out" style={{textAlign:"left",padding:"10px",width:"100%",marginBottom:6,borderRadius:2}}
                onClick={()=>{setAmmoGroup(p.grp);setAmmoKey(p.ammo);setScopeH(p.h);setZeroM(p.z)}}>
                <div style={{fontSize:10,color:GRN}}>{p.name}</div>
                <div style={{fontSize:7,color:"rgba(0,255,65,.35)",marginTop:2}}>{p.ammo} · h={p.h}cm · zero {p.z}m</div>
              </button>
            ))}
          </div>

          {/* Info */}
          <div className="card">
            <div className="lbl" style={{marginBottom:6}}>COMANDI VOCALI "Vega + ..."</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,fontSize:8,lineHeight:2.1}}>
              {[["stage [n]","carica stage"],["prossimo","avanza target"],["fuoco","registra colpo"],
                ["alzo","legge MOA corrente"],["distanza [n]","imposta dist"],["millirad/MOA","cambia unità"],
                ["timer [n]","avvia timer"],["stop","ferma timer"]].map(([c,d])=>(
                <div key={c} style={{display:"flex",gap:4}}>
                  <span style={{color:GRN,fontFamily:"Orbitron,monospace",fontSize:7}}>{c}</span>
                  <span style={{color:"rgba(0,255,65,.35)",fontSize:7}}>→ {d}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>

    {/* ═══ STATUS BAR ═══ */}
    <div style={{padding:"2px 12px",background:"rgba(2,12,4,.98)",
      borderTop:"1px solid rgba(0,255,65,.07)",display:"flex",
      justifyContent:"space-between",alignItems:"center",flexShrink:0,fontSize:7}}>
      <span style={{color:"rgba(0,255,65,.2)"}}>V·E·G·A v4</span>
      <span className="orb" style={{color:GRN}}>
        {ammoKey.split(" ").slice(0,2).join(" ")} · {dist}m → {sol?`${signU(sol.dropMoa)} ${unitLbl}`:"—"}
      </span>
      <span style={{color:"rgba(0,255,65,.25)",display:"flex",gap:5}}>
        {bleConnected&&<span style={{color:CYN}}>◉CAL</span>}
        {kestrelConnected&&<span style={{color:CYN}}>◉KST</span>}
        {stageActive&&<span style={{color:AMB}}>S{tgtIdx+1}</span>}
        {shotDetect&&<span style={{color:RED}}>🎙</span>}
        {units==="imp"&&<span>IMP</span>}
      </span>
    </div>

    {/* ═══ BOTTOM NAV ═══ */}
    <nav className="bottom-nav">
      {[
        {tab:"home",   icon:"⊙", label:"HOME"},
        {tab:"profiles",icon:"👤",label:"PROFILI"},
        {tab:"setup",  icon:"⚙", label:"SETUP"},
      ].map(({tab,icon,label})=>(
        <button key={tab} className={`bnav-btn${mainTab===tab?" on":""}`}
          onClick={()=>{setMainTab(tab);setActivePanel(null)}}>
          <span className="bn-icon">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  </div>
</>
)
}
