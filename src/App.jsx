import { useState, useEffect, useRef, useCallback } from "react"
import vegaImg from '../public/vega.jpg'

// ═══════════════════════════════════════════════════════════════
// PALETTE & COSTANTI
// ═══════════════════════════════════════════════════════════════
const GRN="#00ff41", AMB="#ffaa00", CYN="#00d4ff", RED="#ff3344", PRP="#cc44ff"
let _GRN=GRN // aggiornato da App ad ogni render per i sub-componenti fuori da App
let _dk=true  // dark mode flag per sub-componenti
const _grna=(a)=>_dk?`rgba(0,255,65,${a})`:`rgba(28,28,30,${Math.min(+a*1.5,.95)})`
const BC_CONV = 703.07
const CALYPSO_SERVICE = "0000fd00-0000-1000-8000-00805f9b34fb"
const CALYPSO_WIND_CH = "0000fd01-0000-1000-8000-00805f9b34fb"

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

function physSolve(dist, ammoKey, scopeH_cm, zeroM, wx={}, dragFactor=1.0){
  const a=FLAT[ammoKey]; if(!a||dist<=0)return null
  const h=scopeH_cm/100, g=9.80665, dt=.002
  const tk=273.15+(wx.temp??15)
  const rhoAir=Math.exp(-(wx.alt??0)/8500)*(288.15/tk)*1.225
  const sos=331.3*Math.sqrt(tk/273.15)
  const mv=wx.mv??a.mv
  // dragFactor>1 = più resistenza (bullet cade di più), <1 = meno resistenza
  const BC_SI=(a.bc_g7/Math.max(0.1,dragFactor))*BC_CONV

  const fly=(ang,maxX)=>{
    let vx=mv*Math.cos(ang),vy=mv*Math.sin(ang),x=0,y=-h,t=0
    const acc=(vx2,vy2)=>{
      const v=Math.sqrt(vx2*vx2+vy2*vy2); if(v<1)return[vx2,vy2,0,-g]
      const drag=rhoAir*v*v*g7cd(v/sos)/(2*BC_SI)
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
function loadProfiles(){try{const s=localStorage.getItem(KEY_PROFILES);if(!s)return[SK_GIALLE_PROFILE];return JSON.parse(s)||[]}catch{return[SK_GIALLE_PROFILE]}}
function saveProfiles(p){try{localStorage.setItem(KEY_PROFILES,JSON.stringify(p))}catch{}}
function loadSettings(){try{return JSON.parse(localStorage.getItem(KEY_SETTINGS)||"{}")}catch{return{}}}
function saveSettings(s){try{localStorage.setItem(KEY_SETTINGS,JSON.stringify(s))}catch{}}

// Parser singolo stage (fallback generico)
function parseStageText(txt){
  const dists=[...txt.matchAll(/(\d{2,4})\s*m(?:etri|t)?\b/gi)].map(m=>+m[1]).filter(d=>d>=25&&d<=2500)
  const fall=dists.length?dists:[...txt.matchAll(/\b(\d{2,4})\b/g)].map(m=>+m[1]).filter(d=>d>=50&&d<=1500)
  const pm=txt.match(/TEMPO[:\s]*(\d+)/i)||txt.match(/(\d+)\s*(?:secondi|sec\b)/i)
  return{id:Date.now(),name:"Stage",desc:`${[...new Set(fall)].length} bersagli`,par:pm?+pm[1]:90,
    targets:[...new Set(fall)].map((d,i)=>({id:i+1,dist:d,shots:1,pos:"Prono",step:`Bersaglio a ${d}m`}))}
}

// Parser PRS: estrae lettera→distanza e costruisce passi per posizione
function parsePRSChunk(chunk, stageNum, baseId){
  // Normalizza OCR: collassa spazi multipli, normalizza trattini e apostrofi
  const txt=chunk.replace(/[–—]/g,"-").replace(/[''`]/g,"'")
  // ── Nome ──
  const nmM=txt.match(/Stage\s+\d+[-\s]*([^\n]{1,60})(?:TEMPO|$)/i)
  const name=nmM?nmM[1].replace(/\s+/g," ").trim().replace(/[^a-zA-Z0-9àèéìòùÀÈÉÌÒÙ '\-]/g,"").trim():`Stage ${stageNum}`
  // ── Parametri — robusto a OCR che usa . o ; invece di : ──
  const par=+(txt.match(/TEMPO\s*[.:\-]?\s*"?\s*(\d+)/i)||[0,90])[1]
  const colpiTot=+(txt.match(/COLPI\s*[.:\-]?\s*(\d+)/i)||[0,0])[1]
  const nPos=+(txt.match(/POSIZIONI\s*[.:\-]?\s*(\d+)/i)||[0,0])[1]||
             +(txt.match(/(\d+)\s*POSIZIONI/i)||[0,0])[1]||1
  // ── Mappa lettera→distanza ──
  // Non usa \b perché OCR può fondere "BERSAGLID: 139m" (header+lettera senza spazio)
  // Pattern principale: lettera singola maiuscola preceduta da non-lettera, poi "NNm"
  const distMap={}
  // Prima cerca nella sezione BERSAGLI dedicata (lettera:distanza;...)
  const berSec=txt.match(/BERSAGLI[^\n:]*\n([\s\S]*?)(?:\n\n|Stage\s+\d|$)/i)
  const scanSrc=berSec?berSec[1]+"\n"+txt:txt
  for(const m of scanSrc.matchAll(/(?:^|[\s\n;,])([A-Z])\s*[.:]\s*(\d{2,4})\s*m/gm)){
    const k=m[1].toUpperCase()
    if(!'TCPSBNU'.includes(k)&&!distMap[k]) distMap[k]=+m[2]
  }
  // Fallback: "a NNNm" con bersaglio menzionato nella stessa frase
  if(!Object.keys(distMap).length){
    for(const m of txt.matchAll(/bersaglio\s+([A-Za-z])[\s\S]{0,40}?\b(\d{2,4})\s*m/gi)){
      const k=m[1].toUpperCase()
      if(!distMap[k]) distMap[k]=+m[2]
    }
  }
  // ── Istruzioni complete stage (per briefing TTS) ──
  let instrText=""
  // Cattura "Per/Da/Ad ogni posizione..." oppure tutta la frase descrittiva
  const instrM=txt.match(/(?:(?:Da|Per|Ad)\s+ogni\s+posizione\s*:?\s*)([\s\S]*?)(?=\n\n|BERSAGLI\s*\n|Stage\s+\d|$)/i)
  if(instrM) instrText=instrM[1].replace(/\s+/g," ").trim()
  // Se non trovato, cerca la prima frase con "bersaglio" (stile "Per ogni posizione bersaglio D…")
  if(!instrText){
    const fb=txt.match(/(?:Per|Da|Ad)\s+ogni\s+posizione[^\n]{0,200}/i)
    if(fb) instrText=fb[0].replace(/\s+/g," ").trim()
  }
  // ── Costruisci targets ──
  let targets=[]
  // Metodo 1: "Posizione N, bersaglio X, N colpi, [istruzione]" espliciti
  const posLines=[...txt.matchAll(/Posizione\s+([A-Z0-9]+)[,:\s]+([^\n]{5,200})/gi)]
  if(posLines.length>0){
    for(const m of posLines){
      const instr=m[2].trim()
      const berM=instr.match(/bersaglio\s+([A-Za-z])/i)
      const shotsM=instr.match(/(\d+)\s*colp/i)
      const berL=berM?berM[1].toUpperCase():null
      const dist=berL&&distMap[berL]?distMap[berL]:null
      if(!dist)continue
      // Rileva "da ripetere N volte" — crea N entries per questa posizione
      const ripM=instr.match(/(?:da\s+)?ripetere?\s+(\d+)\s*volt/i)
      const rip=ripM?+ripM[1]:1
      const shots=shotsM?+shotsM[1]:1
      // step pulito senza "da ripetere N volte" per il TTS
      const stepClean=instr.replace(/[,;]?\s*da\s+ripetere?\s+\d+\s*volt[ae]?/i,"").trim()
      for(let r=1;r<=rip;r++){
        const repLabel=rip>1?` (${r}/${rip})`:""
        targets.push({id:targets.length+1,pos:`Posizione ${m[1]}${repLabel}`,berLabel:berL,dist,shots,step:stepClean})
      }
    }
  }
  // Metodo 2: "Da/Per ogni posizione bersaglio X, N colpi" — scansiona tutto il testo
  if(!targets.length){
    const searchIn=instrText||txt
    // Pattern A: "N colpi su[l]/a bersaglio X"
    const pA=/(\d+)\s*colp[a-z]*\s+su[a-z]*\s+bersaglio\s+([A-Za-z])/gi
    // Pattern B: "bersaglio X [sx-dx, ...] N colpi"
    const pB=/bersaglio\s+([A-Za-z])[^.\n]*?(\d+)\s*colp/gi
    // Pattern C: "bersaglio X" + distMap + colpiTot/nPos
    const hitsA=[...searchIn.matchAll(pA)]
    const hitsB=[...searchIn.matchAll(pB)]
    const shotsPerPos=nPos>0&&colpiTot>0?Math.round(colpiTot/nPos):1
    if(hitsA.length>0){
      for(let p=1;p<=Math.max(nPos,1);p++)
        for(const m of hitsA){
          const shots=+m[1], berL=m[2].toUpperCase()
          const dist=distMap[berL]; if(!dist)continue
          targets.push({id:targets.length+1,pos:`Posizione ${p}`,berLabel:berL,dist,shots,step:(instrText||searchIn).slice(0,120)})
        }
    } else if(hitsB.length>0){
      for(let p=1;p<=Math.max(nPos,1);p++)
        for(const m of hitsB){
          const berL=m[1].toUpperCase(), shots=+m[2]
          const dist=distMap[berL]; if(!dist)continue
          targets.push({id:targets.length+1,pos:`Posizione ${p}`,berLabel:berL,dist,shots,step:(instrText||searchIn).slice(0,120)})
        }
    } else if(Object.keys(distMap).length>0){
      // Fallback: nPos posizioni × ogni bersaglio in distMap
      for(let p=1;p<=Math.max(nPos,1);p++)
        for(const[berL,dist] of Object.entries(distMap))
          targets.push({id:targets.length+1,pos:`Posizione ${p}`,berLabel:berL,dist,shots:shotsPerPos,step:instrText||`Bersaglio ${berL} a ${dist}m`})
    }
  }
  // Metodo 3: distMap pura — ultimo fallback
  if(!targets.length && Object.keys(distMap).length>0){
    const shotsEach=nPos>0&&colpiTot>0?Math.round(colpiTot/nPos):colpiTot||1
    for(let p=1;p<=Math.max(nPos,1);p++)
      Object.entries(distMap).forEach(([l,d])=>
        targets.push({id:targets.length+1,pos:`Posizione ${p}`,berLabel:l,dist:d,shots:shotsEach,step:instrText||`Bersaglio ${l} a ${d}m`}))
  }
  if(!targets.length) return null
  const effNPos=targets.length/Math.max(Object.keys(distMap).length||1,1)
  return{
    id:baseId+stageNum, stageNum,
    name:`Stage ${stageNum} — ${name}`,
    desc:`${colpiTot||targets.reduce((s,t)=>s+t.shots,0)} colpi · ${Math.round(effNPos)||nPos} posizioni`,
    par, targets,
    instructions: instrText.slice(0,400)
  }
}

// Punto di ingresso: divide il testo in chunk per stage e li parsa
function parseMultiStageText(txt){
  const hdrRe=/(Stage\s+\d+[^\n]{0,80}(?:TEMPO)?)/gi
  const matches=[...txt.matchAll(hdrRe)]
  const base=Date.now()
  if(matches.length>=2){
    const stages=[]
    for(let i=0;i<matches.length;i++){
      const start=matches[i].index
      const end=i+1<matches.length?matches[i+1].index:txt.length
      const chunk=txt.slice(start,end)
      const stageNumM=matches[i][0].match(/(\d+)/)
      const stageNum=stageNumM?+stageNumM[1]:i+1
      let parsed=parsePRSChunk(chunk,stageNum,base)
      // Rescue: anche se parsePRSChunk non trova bersagli, salva lo stage come placeholder
      if(!parsed){
        const par=+(chunk.match(/TEMPO\s*[.:\-]?\s*"?\s*(\d+)/i)||[0,90])[1]
        const colpiTot=+(chunk.match(/COLPI\s*[.:\-]?\s*(\d+)/i)||[0,0])[1]
        const nmM2=chunk.match(/Stage\s+\d+[-\s]*([^\n]{1,60})/i)
        const nm2=nmM2?nmM2[1].replace(/\s+/g," ").trim():`Stage ${stageNum}`
        parsed={id:base+stageNum,stageNum,name:`Stage ${stageNum} — ${nm2}`,
                desc:`${colpiTot} colpi (bersagli non rilevati)`,par,targets:[],instructions:""}
      }
      stages.push(parsed)
    }
    if(stages.length>=2)return stages
  }
  // Stage singolo: prova parsePRSChunk prima del fallback semplice
  if(matches.length===1){
    const stageNumM=matches[0][0].match(/(\d+)/)
    const stageNum=stageNumM?+stageNumM[1]:1
    const parsed=parsePRSChunk(txt,stageNum,base)
    if(parsed&&parsed.targets.length)return[parsed]
  }
  // Nessun header Stage N trovato: tenta comunque il parser PRS su tutto il testo
  const fallbackPRS=parsePRSChunk(txt,1,base)
  if(fallbackPRS&&fallbackPRS.targets.length)return[fallbackPRS]
  return[parseStageText(txt)]
}

const PROFILE_TEMPLATE = {
  id:0, name:"", caliber:".22LR",
  // Bullet Data
  bulletName:"", bulletWeightGr:0, bulletDiaMm:0, bulletLengthMm:0,
  bcModel:"G1",             // "G1" | "G7"
  bcValue:0, customDragFactor:1.0,
  // Gun Data
  mvMs:null,
  zeroM:50,
  scopeHeightCm:6.5,
  twistCm:40.64, twistDir:"R",   // twist rate in cm, direction R/L
  barrelLengthIn:20,
  // Ammo catalog (solver)
  ammoGroup:"RIMFIRE", ammoKey:".22LR Lapua SLR",
  // Scope
  scopeUnit:"MRAD",         // "MRAD" | "MOA"
  scopeName:"", scopePlane:"FFP",
  zoomMin:6, zoomMax:36,
  reticleType:"mrad", clickValue:0.1,
  reticleHash:1.0, reticleSubHash:0.5,
  // Advanced
  zeroHeightCm:0, zeroOffsetCm:0,
  ssfElevation:1.0, ssfWindage:1.0,
  // MV-Temp Table
  useMvTempTable:false,
  mvTempTable:[],           // [{id,temp,mv}]
  dropScaleTable:[],        // [{id,dist,factor}]
  // Truing
  truingPoints:[],          // [{id,dist,measuredMrad,date,notes}]
  useTruing:false,          // applica customDragFactor al solver
  notes:""
}

const SK_GIALLE_PROFILE = {
  ...PROFILE_TEMPLATE,
  id:1, name:"SK gialle", caliber:".22LR",
  bulletName:"SK Standard Plus", bulletWeightGr:40.0, bulletDiaMm:5.69, bulletLengthMm:12.19,
  bcModel:"G1", bcValue:0.131, customDragFactor:1.0,
  mvMs:326.1, zeroM:50, scopeHeightCm:6.5,
  twistCm:40.64, twistDir:"R",
  ammoGroup:"RIMFIRE", ammoKey:".22LR Lapua SLR",
  scopeUnit:"MRAD", reticleType:"mrad",
  useMvTempTable:true,
  mvTempTable:[
    {id:1,temp:26,mv:330.1},
    {id:2,temp:23,mv:327.1},
    {id:3,temp:18,mv:331.9},
    {id:4,temp:15,mv:326.1},
  ],
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
      <circle cx={0} cy={0} r={30} fill="none" stroke={grna(.15)} strokeWidth={1}/>
      {[0,90,180,270].map(a=>{
        const x=Math.sin(a*Math.PI/180)*34, y=-Math.cos(a*Math.PI/180)*34
        return<text key={a} x={x} y={y+3} textAnchor="middle" fill={grna(.3)} fontSize={7} fontFamily="monospace">
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
          background:i<currentIdx?_grna(.4):i===currentIdx?_GRN:_grna(.12),
          transition:"all .3s", borderRadius:1}}/>
      ))}
    </div>
  )
}

function DbMeter({db, threshold}){
  const pct=Math.max(0,Math.min(100,(db+60)/55*100))
  const tPct=Math.max(0,Math.min(100,(threshold+60)/55*100))
  return(
    <div style={{flex:1,height:6,background:_grna(.08),borderRadius:2,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",left:0,top:0,height:"100%",width:pct+"%",
        background:db>threshold?RED:_GRN,transition:"width .05s"}}/>
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
                background:_grna(.06),border:`1px solid _grna(.15)`,fontSize:9}}>
                <span style={{fontFamily:"Orbitron,monospace"}}>{v}</span>
                <span style={{cursor:"pointer",color:RED,fontSize:10,padding:"0 2px"}} onClick={()=>onRemove(i)}>×</span>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}>
            {[["N",mvList.length,""],["MEDIA",avg?.toFixed(1),"m/s"],["SD",sd?.toFixed(1)??"—","m/s"]].map(([l,v,u])=>(
              <div key={l} style={{textAlign:"center",padding:"5px",background:_grna(.025),border:`1px solid _grna(.07)`}}>
                <div style={{fontSize:7,color:_grna(.4),letterSpacing:".1em"}}>{l}</div>
                <div style={{fontFamily:"Orbitron,monospace",fontSize:14,color:_GRN}}>{v}</div>
                <div style={{fontSize:7,color:_grna(.3)}}>{u}</div>
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
      background:_grna(.025),
      border:`1px solid ${active?color+"66":_grna(.12)}`,
      padding:"10px 8px", cursor:"pointer",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      gap:3, position:"relative", minHeight:140,
      transition:"border-color .1s", userSelect:"none",
      boxShadow:active?`0 0 14px ${color}22`:"none",
      WebkitTapHighlightColor:"transparent",
    }}>
      <div style={{position:"absolute",top:5,left:7,fontSize:6,color:active?color:_grna(.3),
        fontFamily:"Orbitron,monospace",letterSpacing:".15em"}}>{label}</div>
      {badge&&<div style={{position:"absolute",top:4,right:6,fontSize:6,color:color,
        fontFamily:"Orbitron,monospace",animation:"bleBlip 1s infinite"}}>{badge}</div>}
      <div style={{position:"absolute",bottom:4,right:7,fontSize:8,color:_grna(.18)}}>›</div>
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

  // ── Tema ──
  const [theme, setTheme] = useState(()=>loadSettings().theme??"dark") // "dark" | "light"

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
    saveSettings({units, unit, audio, theme})
  },[units, unit, audio, theme])

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
    const r=physSolve(dist,ammoKey,scopeH,zeroM,wx)
    setSol(r); setPulse(true)
    const t=setTimeout(()=>setPulse(false),300)
    return()=>clearTimeout(t)
  },[dist,ammoKey,scopeH,zeroM,wx])

  useEffect(()=>{
    const isRim=ammoGroup==="RIMFIRE"
    const steps=isRim?[25,50,75,100,125,150,175,200,225,250]:[50,100,150,200,300,400,500,600,700,800]
    setRangeCard(steps.map(d=>({dist:d,...(physSolve(d,ammoKey,scopeH,zeroM,wx)||{})})))
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
  const [stages,        setStages]        = useState(STAGES_BUILTIN)
  const [stageActive,   setStageActive]   = useState(false)
  const [stagePending,  setStagePending]  = useState(false) // caricato, in attesa di "go"
  const [currentStage,  setCurrentStage]  = useState(null)
  const [tgtIdx,        setTgtIdx]        = useState(0)
  const [shotsLeft,     setShotsLeft]     = useState(0)
  const [stageSols,     setStageSols]     = useState([])
  const stagePendingRef = useRef(false)
  useEffect(()=>{stagePendingRef.current=stagePending},[stagePending])
  const [pdfLoading,   setPdfLoading]   = useState(false)
  const [camLoading,   setCamLoading]   = useState(false)
  const [camPreview,   setCamPreview]   = useState(null)
  const [stageMsg,     setStageMsg]     = useState("")
  // Gara (competizione multi-stage)
  const [gara,         setGara]         = useState(null) // {id,name,stages:[],currentIdx:0}
  const [garaActive,   setGaraActive]   = useState(false)
  const garaRef = useRef(null)
  const stageRef       = useRef(null)
  const stageActiveRef = useRef(false)
  const tgtIdxRef      = useRef(0)
  const shotsLeftRef   = useRef(0)
  useEffect(()=>{stageActiveRef.current=stageActive},[stageActive])
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

  // ── MV manuale ──
  const [mvList, setMvList] = useState([])

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
    if(priority&&speechSynthesis.speaking)speechSynthesis.cancel()
    // iOS: ripristina synthesis se messa in pausa dal sistema
    if(speechSynthesis.paused)speechSynthesis.resume()
    const u=new SpeechSynthesisUtterance(text)
    u.lang="it-IT"; u.rate=1.15; u.pitch=1.0; u.volume=1
    u.onstart=()=>setVoiceState("speaking")
    u.onend=()=>setVoiceState(wakePendRef.current?"waiting":"idle")
    // iOS workaround: tiny delay evita artefatti dopo cancel
    const delay=(priority&&speechSynthesis.speaking)?80:0
    setTimeout(()=>speechSynthesis.speak(u),delay)
  },[])

  // ── Stage logic ──
  const speakTarget = useCallback((stage, idx, wx_)=>{
    const t=stage.targets[idx]; if(!t)return
    const s=physSolve(t.dist,ammoKeyRef.current,scopeHRef.current,zeroMRef.current,wx_||wxRef.current)
    const wt=s&&Math.abs(s.windMoa??0)>0.2?`, vento ${ttsU(s.windMoa)}`:""
    // Solo: lettera bersaglio + alza + vento
    speak(`${t.berLabel||t.id}. Alza ${ttsU(s?.dropMoa??0)}${wt}.`,true)
  },[speak,ttsU])

  const advanceTarget = useCallback(()=>{
    const stage=stageRef.current; if(!stage)return
    const nextIdx=tgtIdxRef.current+1
    if(nextIdx>=stage.targets.length){
      setStageActive(false); setCurrentStage(null); stageRef.current=null
      setTgtIdx(0); setShotsLeft(0); tgtIdxRef.current=0; shotsLeftRef.current=0
      const g=garaRef.current
      if(g){
        const nextStageIdx=g.currentIdx+1
        if(nextStageIdx<g.stages.length){
          speak(`Stage ${g.currentIdx+1} completato. Prossimo: ${g.stages[nextStageIdx].name}. Di "stage ${nextStageIdx+1}" per iniziare.`,true)
          const ng={...g,currentIdx:nextStageIdx}
          garaRef.current=ng; setGara(ng)
        }else{
          speak(`Gara completata! Ottimo lavoro.`,true)
          garaRef.current=null; setGara(null); setGaraActive(false)
        }
      }else{
        speak("Stage completato. Ottimo lavoro.",true)
      }
      return
    }
    const nextT=stage.targets[nextIdx]
    tgtIdxRef.current=nextIdx; shotsLeftRef.current=nextT.shots
    setTgtIdx(nextIdx); setShotsLeft(nextT.shots); setDist(nextT.dist)
    // Usa speakTarget per annuncio completo: posizione + istruzione + DOPE
    speakTarget(stage, nextIdx, wxRef.current)
  },[speak,speakTarget])

  const onShotFired = useCallback(()=>{
    if(!stageRef.current)return
    const left=shotsLeftRef.current-1; shotsLeftRef.current=left; setShotsLeft(left)
    if(left>0)speak(`${left} col${left===1?"po":"pi"}`)
    else setTimeout(()=>advanceTarget(),600)
  },[speak,advanceTarget])

  const onShotFiredRef    = useRef(onShotFired)
  const advanceTargetRef  = useRef(null)
  const nextGaraStageRef  = useRef(null)
  const loadStageRef      = useRef(null)
  const startStageRef     = useRef(null)
  useEffect(()=>{onShotFiredRef.current=onShotFired},[onShotFired])

  const loadStage = useCallback((stage)=>{
    if(!stage?.targets.length)return
    const curWx=wxRef.current
    // Calcola DOPE per tutti i bersagli/posizioni
    const sols=stage.targets.map(t=>({...t,...(physSolve(t.dist,ammoKey,scopeH,zeroM,curWx)||{})}))
    stageRef.current=stage; setCurrentStage(stage)
    setTgtIdx(0); setShotsLeft(stage.targets[0].shots)
    tgtIdxRef.current=0; shotsLeftRef.current=stage.targets[0].shots
    setDist(stage.targets[0].dist)
    setStageSols(sols)
    // Stato pending: caricato ma timer non ancora partito
    setStageActive(false); setStagePending(true); stagePendingRef.current=true
    setMainTab("home"); setActivePanel(null)

    // Nessun briefing vocale — l'atleta conosce già lo stage
    // Segnale minimo: solo il nome e il comando per partire
    speak(`${stage.name}. Pronto. Di "go" per iniziare.`,true)
  },[speak,ttsU,ammoKey,scopeH,zeroM,bleConnected])

  // Attivazione effettiva dello stage ("go")
  const startGara = useCallback((garaObj)=>{
    if(!garaObj?.stages?.length)return
    const g={...garaObj,currentIdx:0}
    garaRef.current=g; setGara(g); setGaraActive(true)
    setMainTab("home"); setActivePanel(null)
    speak(`Gara "${g.name}" avviata. ${g.stages.length} stage. Inizio ${g.stages[0].name}.`,true)
    setTimeout(()=>loadStage(g.stages[0]),1400)
  },[speak,loadStage])

  const nextGaraStage = useCallback(()=>{
    const g=garaRef.current; if(!g)return
    const idx=g.currentIdx
    if(idx>=g.stages.length){speak("Gara già completata.",true);return}
    const stage=g.stages[idx]
    speak(`Stage ${idx+1}: ${stage.name}`,true)
    setTimeout(()=>loadStage(stage),900)
  },[speak,loadStage])

  // Mantieni le ref aggiornate per il fast-path vocale
  useEffect(()=>{advanceTargetRef.current=advanceTarget},[advanceTarget])
  useEffect(()=>{nextGaraStageRef.current=nextGaraStage},[nextGaraStage])
  useEffect(()=>{loadStageRef.current=loadStage},[loadStage])
  // nota: startStageRef.current viene aggiornato dopo la definizione di startStage (evita TDZ)

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

  // Attivazione effettiva dello stage ("go") — definita DOPO startTimer per evitare TDZ
  const startStage = useCallback(()=>{
    const stage=stageRef.current; if(!stage)return
    setStagePending(false); stagePendingRef.current=false
    setStageActive(true)
    startTimer(stage.par)
    // Annuncia solo il primo bersaglio con valori torretta
    setTimeout(()=>speakTarget(stage,0,wxRef.current),300)
  },[speakTarget,startTimer])
  useEffect(()=>{startStageRef.current=startStage},[startStage])

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
      const stagesFound=parseMultiStageText(text)
      if(!stagesFound.length||!stagesFound[0].targets.length){setBleError("Nessuna distanza trovata");return}
      const baseName=file.name.replace(/\.[^.]+$/,"")
      const namedStages=stagesFound.map((s,i)=>({...s,name:stagesFound.length>1?s.name:`PDF: ${baseName}`}))
      setStages(prev=>[...prev,...namedStages])
      if(namedStages.length>1){
        const garaObj={id:Date.now(),name:`Gara — ${baseName}`,stages:namedStages,currentIdx:0}
        setGara(garaObj); garaRef.current=garaObj; setGaraActive(false)
        speak(`Gara importata: ${namedStages.length} stage. Dì "Vega avvia gara" per iniziare.`)
      }else{
        speak(`Stage importato: ${namedStages[0].targets.length} bersagli`)
      }
    }catch(e){setBleError("Errore: "+e.message)}
    finally{setPdfLoading(false)}
  },[speak])

  // ── Camera OCR import ──
  const handleCameraPhoto = useCallback(async(file)=>{
    if(!file)return
    setCamLoading(true); setBleError("")
    const previewUrl=URL.createObjectURL(file)
    setCamPreview(previewUrl)
    try{
      // Carica Tesseract.js v4 UMD via script tag — più affidabile su PWA/GitHub Pages
      // ESM v5 con dynamic import non riesce a risolvere i worker path da CDN
      if(!window.Tesseract){
        await new Promise((res,rej)=>{
          const s=document.createElement('script')
          s.src='https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js'
          s.onload=res
          s.onerror=()=>rej(new Error('Tesseract CDN non raggiungibile — verifica connessione'))
          document.head.appendChild(s)
        })
      }
      const {data:{text}}=await window.Tesseract.recognize(file,'ita+eng',{logger:()=>{}})
      URL.revokeObjectURL(previewUrl)
      const stagesFound=parseMultiStageText(text)
      if(!stagesFound.length||!stagesFound[0].targets.length){setBleError("Nessuna distanza trovata nella foto");setCamPreview(null);return}
      const fname=file.name?.replace(/\.[^.]+$/,"")||"Foto"
      const namedStages=stagesFound.map((s,i)=>({...s,name:stagesFound.length>1?s.name:`Foto: ${fname}`}))
      setStages(prev=>[...prev,...namedStages])
      if(namedStages.length>1){
        const garaObj={id:Date.now(),name:`Gara — ${fname}`,stages:namedStages,currentIdx:0}
        setGara(garaObj); garaRef.current=garaObj; setGaraActive(false)
        speak(`Gara da foto: ${namedStages.length} stage rilevati. Dì "Vega avvia gara" per iniziare.`)
      }else{
        speak(`Stage da foto: ${namedStages[0].targets.length} bersagli`)
      }
      setCamPreview(null)
    }catch(e){setBleError("OCR: "+e.message);setCamPreview(null)}
    finally{setCamLoading(false)}
  },[speak])

  // ── Voice ──
  const handleVoiceCommand = useCallback((txt)=>{
    const t=txt.toLowerCase().trim(); setVoiceTranscript(txt)

    const IT_NUM={'uno':1,'due':2,'tre':3,'quattro':4,'cinque':5,'sei':6,'sette':7,'otto':8,'nove':9,'dieci':10}

    // ── Comandi GARA ──
    if(/avvia\s*gara|inizia\s*gara|start\s*gara/.test(t)){
      if(garaRef.current){startGara(garaRef.current)}
      else speak("Nessuna gara caricata. Importa un PDF con gli stage.",true)
      return
    }
    if(/stato\s*gara|gara\s*stato|gara\s*info/.test(t)){
      const g=garaRef.current
      if(!g){speak("Nessuna gara attiva",true);return}
      speak(`Gara: stage ${g.currentIdx+1} di ${g.stages.length}. ${stageActive?"In corso.":"In attesa."}`,true)
      return
    }
    if(/annulla\s*gara|esci\s*gara|fine\s*gara/.test(t)){
      garaRef.current=null; setGara(null); setGaraActive(false)
      speak("Gara annullata",true); return
    }

    // ── "next" / "prossimo" — solo avanza bersaglio/posizione dentro lo stage ──
    if(/^(next|prossimo|avanza|via|vai)$/.test(t.trim())){
      if(stageActive){advanceTarget();return}
      speak("Nessuno stage attivo",true); return
    }

    // ── "stage N" / "inizio stage N" / "carica stage N" ──
    const sm=t.match(/(?:inizio|carica|avvia|vai\s+a)?\s*stage\s+(\d+|uno|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)/i)
             ||t.match(/palco\s+(\d+)/i)
    if(sm){
      const raw=sm[1].toLowerCase(); const n=IT_NUM[raw]??+raw
      const g=garaRef.current
      // Prima cerca in gara per stageNum, poi per posizione nell'array, poi in tutta la library
      const target=g?.stages.find(s=>s.stageNum===n)
                  ||(g?.stages[n-1]??null)
                  ||stages.find(s=>s.stageNum===n)
      if(target){
        if(g){const ng={...g,currentIdx:g.stages.indexOf(target)};garaRef.current=ng;setGara(ng)}
        loadStage(target)
      }else speak(`Stage ${n} non trovato`,true)
      return
    }
    if(/fuoco|colpo|sparo/.test(t)){onShotFiredRef.current?.();return}
    if(/ripeti|risenti|ridillo/.test(t)){
      if(currentStage&&stageActive)speakTarget(currentStage,tgtIdx,wx)
      return
    }
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
  },[advanceTarget,nextGaraStage,startGara,loadStage,speakTarget,speak,ttsU,startTimer,stopTimer,stages,stageActive,currentStage,tgtIdx,wx])

  useEffect(()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition
    if(!SR){setVoiceFeed("Voce: usa Chrome/Edge");return}
    const rec=new SR(); rec.continuous=true; rec.interimResults=true; rec.lang="it-IT"; recRef.current=rec
    // Regex permissivi — permettono punteggiatura iOS e parole extra brevi
    const DIRECT_NEXT  = /\b(next|avanti|vai)\b/i      // vai = avanza posizione
    const DIRECT_GO    = /\b(go|inizia|start|pronti|fuoco)\b/i // go = parte cronometro
    const DIRECT_STOP  = /\b(stop|ferma)\b/i            // stop = ferma cronometro
    const DIRECT_SHOT  = /\b(colpo|sparo)\b/i
    // "stage uno/1" ... "stage dieci/10" — numeri in lettere italiane
    const IT_NUM={'uno':1,'due':2,'tre':3,'quattro':4,'cinque':5,'sei':6,'sette':7,'otto':8,'nove':9,'dieci':10}
    const DIRECT_STAGE = /\bstage\s+(\d+|uno|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\b/i
    // Deduplication: evita doppio trigger interim+final
    let lastCmd=""; let lastCmdTs=0

    const fireCmd=(cmd, fn)=>{
      const now=Date.now()
      if(cmd===lastCmd&&now-lastCmdTs<1500)return // già eseguito
      lastCmd=cmd; lastCmdTs=now; fn()
    }

    rec.onresult=e=>{
      let interim="",final=""
      for(let i=e.resultIndex;i<e.results.length;i++){
        const r=e.results[i][0].transcript
        if(e.results[i].isFinal)final+=r; else interim+=r
      }
      if(interim){
        setVoiceTranscript(interim)
        const itl=interim.toLowerCase()
        const itlLen=itl.replace(/[^a-zàèéìòù]/gi,"").length
        // Interim fast-path: risposta immediata per parole singole
        if(stageActiveRef.current && DIRECT_NEXT.test(itl) && itlLen<8){
          fireCmd("next",()=>{setVoiceFeed("▶ VAI/NEXT"); advanceTargetRef.current?.()})
          return
        }
        if(stagePendingRef.current && DIRECT_GO.test(itl) && itlLen<8){
          fireCmd("go",()=>{setVoiceFeed("▶ GO"); startStageRef.current?.()})
          return
        }
        if(DIRECT_STOP.test(itl) && itlLen<8){
          fireCmd("stop",()=>{setVoiceFeed("⏹ STOP"); stopTimer()})
          return
        }
      }
      if(final){
        setVoiceTranscript("")
        const tl=final.toLowerCase().trim()

        // ── FAST PATH ──
        if(stagePendingRef.current && DIRECT_GO.test(tl)){
          fireCmd("go",()=>{setVoiceFeed("▶ GO"); startStageRef.current?.()}); return
        }
        if(stageActiveRef.current && DIRECT_NEXT.test(tl)){
          fireCmd("next",()=>{setVoiceFeed("▶ VAI/NEXT"); advanceTargetRef.current?.()}); return
        }
        if(DIRECT_STOP.test(tl)){
          fireCmd("stop",()=>{setVoiceFeed("⏹ STOP"); stopTimer()}); return
        }
        if(stageActiveRef.current && DIRECT_SHOT.test(tl)){
          fireCmd("shot",()=>{setVoiceFeed("◉ COLPO"); onShotFiredRef.current?.()}); return
        }
        // "stage N" → carica stage N dalla gara (durante gara, con o senza stage attivo)
        if(garaRef.current){
          const sm=tl.match(DIRECT_STAGE)
          if(sm){
            const raw=sm[1]; const n=IT_NUM[raw]??+raw
            const g=garaRef.current
            const target=g.stages.find(s=>s.stageNum===n)||(g.stages[n-1]??null)
            if(target){
              setVoiceFeed(`STAGE ${n}`)
              const ng={...g,currentIdx:g.stages.indexOf(target)}
              garaRef.current=ng; setGara(ng)
              loadStageRef.current?.(target)
            }else speak(`Stage ${n} non trovato`,true)
            return
          }
        }

        // ── NORMAL FLOW: wake word "Vega" ──
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
    wakeLockRef.current?.release()
  },[])

  // ── Derived ──
  const ammoData   = FLAT[ammoKey]
  const vdotColor  = voiceState==="waiting"?AMB:voiceState==="speaking"?CYN:grna(.4)

  // ══════════════════════════════════════════════════════════════
  // THEME
  // ══════════════════════════════════════════════════════════════
  const dk = theme === "dark"
  _GRN = dk ? GRN : "#1C1C1E"
  _dk = dk
  const T = {
    bg:          dk ? "#020c04"              : "#F0F2F5",
    card:        dk ? "rgba(0,255,65,.025)"  : "#FFFFFF",
    cardBorder:  dk ? "rgba(0,255,65,.1)"    : "rgba(0,0,0,.08)",
    text:        dk ? "#e8ffe8"              : "#1C1C1E",
    textDim:     dk ? "rgba(0,255,65,.45)"   : "#8E8E93",
    lbl:         dk ? "rgba(0,255,65,.45)"   : "#007AFF",
    inputBg:     dk ? "rgba(0,255,65,.04)"   : "#F2F2F7",
    inputBorder: dk ? "rgba(0,255,65,.18)"   : "rgba(0,0,0,.12)",
    inputText:   dk ? "#00ff41"              : "#1C1C1E",
    navBg:       dk ? "#020c04"              : "#FFFFFF",
    navBorder:   dk ? "rgba(0,255,65,.12)"   : "rgba(0,0,0,.1)",
    hdrBorder:   dk ? "rgba(0,255,65,.1)"    : "rgba(0,0,0,.1)",
    hdrBg:       dk ? "transparent"          : "#FFFFFF",
    pillBorder:  dk ? "rgba(0,255,65,.2)"    : "rgba(0,0,0,.15)",
    pillText:    dk ? "rgba(0,255,65,.55)"   : "#555",
    pillOnBg:    dk ? "rgba(0,255,65,.12)"   : "#007AFF",
    pillOnText:  dk ? "#00ff41"              : "#FFF",
    pillOnBorder:dk ? "rgba(0,255,65,.5)"    : "#007AFF",
    grn:         dk ? GRN                    : "#1C1C1E",
    accent:      dk ? GRN                    : "#007AFF",
    accentDim:   dk ? "rgba(0,255,65,.3)"    : "rgba(0,122,255,.3)",
    statusBg:    dk ? "rgba(2,12,4,.98)"     : "#FFFFFF",
    voiceBarBg:  dk ? "rgba(0,10,2,.8)"      : "rgba(240,245,255,.95)",
    scan:        dk,
  }

  const timerColor = timerLeft!==null?(timerLeft<=10?RED:timerLeft<=30?AMB:T.grn):T.grn
  // Helper: green-alpha adattato al tema (light mode → grigio scuro)
  const grna=(a)=>dk?`rgba(0,255,65,${a})`:`rgba(28,28,30,${Math.min(+a*1.5,0.95)})`


  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return(
  <>
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    html,body{background:${T.bg};height:100%;overflow:hidden;-webkit-text-size-adjust:100%}
    .vg-root{height:100vh;height:100dvh;background:${T.bg};color:${T.text};font-family:'IBM Plex Mono',monospace;display:flex;flex-direction:column;overflow:hidden}
    .orb{font-family:'Orbitron',monospace}
    .lbl{font-size:7px;letter-spacing:.15em;color:${T.lbl};text-transform:uppercase;margin-bottom:2px}
    .card{background:${T.card};border:1px solid ${T.cardBorder};padding:10px 12px;margin-bottom:6px;${dk?"":"box-shadow:0 1px 4px rgba(0,0,0,.06);"}}
    .vg-in{background:${T.inputBg};border:1px solid ${T.inputBorder};color:${T.inputText};font-family:'IBM Plex Mono',monospace;font-size:14px;padding:8px 10px;outline:none;width:100%;border-radius:${dk?"2px":"8px"}}
    .vg-in:focus{border-color:${T.accent}}
    .vg-in::placeholder{color:${T.textDim}}
    .vg-sel{background:${T.inputBg};border:1px solid ${T.inputBorder};color:${T.inputText};font-family:'IBM Plex Mono',monospace;font-size:12px;padding:8px 9px;outline:none;cursor:pointer;width:100%;border-radius:${dk?"2px":"8px"}}
    .vg-sel option{background:${T.bg}}
    .vg-range{-webkit-appearance:none;appearance:none;width:100%;height:4px;background:${T.accentDim};outline:none;cursor:pointer;border-radius:2px}
    .vg-range::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${T.accent};cursor:pointer}
    .vg-range::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:${T.accent};cursor:pointer;border:none}
    .btn-prim{background:${dk?GRN:"#007AFF"};color:${dk?"#020c04":"#FFF"};border:none;font-family:'Orbitron',monospace;font-size:10px;font-weight:700;letter-spacing:.12em;padding:12px 18px;cursor:pointer;text-transform:uppercase;border-radius:${dk?"2px":"10px"};min-height:44px}
    .btn-prim:active{opacity:.8}
    .btn-prim.amb{background:${AMB}}
    .btn-prim.red{background:${RED};color:#fff}
    .btn-prim.prp{background:${PRP};color:#fff}
    .btn-out{background:transparent;color:${dk?GRN:"#007AFF"};border:1px solid ${dk?"rgba(0,255,65,.3)":"rgba(0,122,255,.3)"};font-family:'IBM Plex Mono',monospace;font-size:11px;padding:10px 12px;cursor:pointer;border-radius:${dk?"2px":"10px"};min-height:44px}
    .btn-out:active{background:${dk?"rgba(0,255,65,.08)":"rgba(0,122,255,.06)"}}
    .btn-out.red{color:${RED};border-color:rgba(255,51,68,.35)}
    .pill{background:transparent;border:1px solid ${T.pillBorder};color:${T.pillText};font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;min-height:36px;border-radius:${dk?"2px":"20px"}}
    .pill.on{background:${T.pillOnBg};border-color:${T.pillOnBorder};color:${T.pillOnText}}
    .toggle-wrap{display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none;min-height:44px}
    .toggle-bg{width:44px;height:24px;border-radius:12px;background:${dk?"rgba(0,255,65,.08)":"rgba(120,120,128,.2)"};border:1px solid ${dk?"rgba(0,255,65,.2)":"transparent"};position:relative;transition:all .2s;flex-shrink:0}
    .toggle-bg.on{background:${dk?"rgba(0,255,65,.22)":"#34C759"};border-color:${dk?"rgba(0,255,65,.5)":"transparent"}}
    .toggle-knob{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:${dk?GRN:"#FFF"};transition:transform .2s;box-shadow:${dk?"none":"0 1px 3px rgba(0,0,0,.3)"}}
    .toggle-bg.on .toggle-knob{transform:translateX(20px)}
    .unit-btn{background:transparent;font-family:'Orbitron',monospace;font-size:9px;letter-spacing:.1em;padding:5px 12px;cursor:pointer;border:1px solid ${dk?"rgba(0,255,65,.2)":"rgba(0,0,0,.15)"};color:${dk?"rgba(0,255,65,.45)":"#8E8E93"};min-height:36px;border-radius:${dk?"2px":"8px"}}
    .unit-btn.on{background:${dk?GRN:"#007AFF"};color:${dk?"#020c04":"#FFF"};border-color:${dk?GRN:"#007AFF"};font-weight:700}
    .scroll-panel{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 12px;padding-bottom:70px;background:${T.bg}}
    .bottom-nav{display:flex;border-top:1px solid ${T.navBorder};flex-shrink:0;background:${T.navBg}}
    .bnav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;cursor:pointer;color:${dk?"rgba(0,255,65,.35)":"#8E8E93"};font-family:'Orbitron',monospace;font-size:7px;letter-spacing:.1em;gap:3px;min-height:54px;border:none;background:transparent}
    .bnav-btn.on{color:${dk?GRN:"#007AFF"}}
    .bnav-btn .bn-icon{font-size:18px;line-height:1}
    .scan{position:fixed;inset:0;pointer-events:none;z-index:1;background:repeating-linear-gradient(0deg,transparent,transparent 2px,grna(.012) 2px,grna(.012) 4px)}
    @keyframes cwSpin{to{transform:rotate(360deg)}}
    @keyframes ccwSpin{to{transform:rotate(-360deg)}}
    @keyframes glowT{0%,100%{text-shadow:0 0 8px ${dk?"rgba(0,255,65,.55)":"rgba(0,122,255,.4)"}}50%{text-shadow:0 0 20px ${dk?"rgba(0,255,65,1)":"rgba(0,122,255,.8)"}}}
    @keyframes timerWarn{0%,100%{opacity:1}50%{opacity:.1}}
    @keyframes bleBlip{0%,100%{opacity:1}50%{opacity:.2}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    @keyframes pulseSol{0%{box-shadow:0 0 0 0 ${grna(.3)}}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
    .pulse-sol{animation:pulseSol .35s ease}
    .glow-t{animation:glowT 4s ease-in-out infinite}
    .ring-a{position:absolute;inset:0;border-radius:50%;border:1px solid ${grna(.48)};border-top-color:transparent;border-left-color:transparent;animation:cwSpin 5s linear infinite}
    .ring-b{position:absolute;inset:8px;border-radius:50%;border:1px dashed ${grna(.2)};animation:ccwSpin 9s linear infinite}
    .ring-c{position:absolute;inset:15px;border-radius:50%;border:1px solid ${grna(.3)};border-bottom-color:transparent;animation:cwSpin 3s linear infinite}
    ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:${T.accentDim}}
    @media(min-width:600px){.widget-grid{grid-template-columns:1fr 1fr 1fr 1fr!important}}
  `}</style>

  {/* SPLASH */}
  {splashOn&&(
    <div style={{position:"fixed",inset:0,background:"#000",zIndex:9999,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      opacity:splashFade?0:1,transition:"opacity .7s",pointerEvents:splashFade?"none":"all"}}>
      <img src={vegaImg} alt="VEGA" style={{width:220,maxWidth:"70vw",filter:"drop-shadow(0 0 24px #00ff41)"}}/>
      <div className="orb glow-t" style={{fontSize:24,letterSpacing:".5em",fontWeight:900,color:T.grn,marginTop:20}}>V.E.G.A</div>
      <div style={{fontSize:9,color:grna(.4),letterSpacing:".15em",marginTop:8}}>Shooting Labs · v4</div>
    </div>
  )}

  <div className="vg-root">
    {T.scan&&<div className="scan"/>}

    {/* ═══ HEADER ═══ */}
    <div style={{padding:"6px 12px",borderBottom:`1px solid ${T.hdrBorder}`,background:T.hdrBg,
      display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:8,minHeight:48}}>

      {activePanel?(
        <button className="btn-out" style={{fontSize:10,padding:"5px 10px",minHeight:36}}
          onClick={()=>setActivePanel(null)}>‹ {mainTab==="profiles"?"PROFILI":"HOME"}</button>
      ):(
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div className="orb glow-t" style={{fontSize:14,letterSpacing:".3em",fontWeight:900,color:T.grn}}>V·E·G·A</div>
          {stageActive&&(
            <span style={{fontSize:7,color:AMB,fontFamily:"Orbitron,monospace",animation:"bleBlip 1.2s infinite"}}>● STAGE</span>
          )}
          {stagePending&&!stageActive&&(
            <span style={{fontSize:7,color:CYN,fontFamily:"Orbitron,monospace",animation:"bleBlip 1s infinite"}}>◌ PRONTO</span>
          )}
        </div>
      )}

      {activePanel&&(
        <div className="orb" style={{fontSize:10,color:T.grn,letterSpacing:".15em",flex:1,textAlign:"center"}}>
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
    {(voiceTranscript||voiceState!=="idle"||(stageActive||stagePending||gara))&&(
      <div style={{fontSize:8,textAlign:"center",padding:"3px 12px",
        borderBottom:`1px solid ${stageActive?"rgba(255,170,0,.15)":stagePending?"rgba(0,212,255,.15)":T.hdrBorder}`,
        background:stageActive?(dk?"rgba(10,6,0,.9)":"rgba(255,170,0,.06)"):stagePending?(dk?"rgba(0,8,12,.95)":"rgba(0,212,255,.06)"):T.voiceBarBg,
        color:stageActive?AMB:stagePending?CYN:T.textDim}}>
        {voiceTranscript
          ?<span style={{color:CYN}}>{voiceTranscript}</span>
          :stageActive
            ?<span>Di <b style={{color:AMB}}>"next"</b> per colpo / avanzare</span>
            :stagePending
              ?<span style={{animation:"bleBlip 1s infinite"}}>Di <b style={{color:CYN}}>"go"</b> per avviare timer e iniziare</span>
              :gara&&!stageActive
                ?<span>Di <b style={{color:PRP}}>"stage {gara.currentIdx+1}"</b> per iniziare</span>
                :voiceFeed}
      </div>
    )}

    {/* ═══ STAGE BAR — pending (briefing, attesa GO) ═══ */}
    {stagePending&&currentStage&&!activePanel&&mainTab==="home"&&(
      <div style={{padding:"6px 12px",background:"rgba(0,8,16,.97)",borderBottom:`1px solid ${CYN}44`,
        display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
        <div style={{flex:1,minWidth:0}}>
          <StageProgress targets={currentStage.targets} currentIdx={-1}/>
          <div style={{fontSize:8,color:CYN,marginTop:2,fontFamily:"Orbitron,monospace",letterSpacing:".1em"}}>
            {currentStage.name} · {currentStage.par}s
          </div>
        </div>
        <button className="btn-prim" style={{fontSize:12,padding:"10px 20px",background:CYN,color:"#001820",
          fontWeight:900,letterSpacing:".15em",animation:"bleBlip .8s infinite"}}
          onClick={startStage}>GO</button>
        <button className="btn-out red" style={{fontSize:10,padding:"8px 10px"}}
          onClick={()=>{setStagePending(false);stagePendingRef.current=false;stageRef.current=null;setCurrentStage(null);speak("Annullato")}}>■</button>
      </div>
    )}

    {/* ═══ STAGE BAR — attivo (timer in corso) ═══ */}
    {stageActive&&curTarget&&!activePanel&&mainTab==="home"&&(
      <div style={{padding:"6px 12px",background:"rgba(0,16,4,.95)",borderBottom:`1px solid ${AMB}44`,
        display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
        <div style={{flex:1,minWidth:0}}>
          <StageProgress targets={currentStage.targets} currentIdx={tgtIdx}/>
          <div style={{fontSize:9,color:AMB,marginTop:2}}>{currentStage.name}</div>
        </div>
        <div style={{textAlign:"center",flexShrink:0}}>
          <div className="orb" style={{fontSize:22,color:AMB,lineHeight:1}}>T{curTarget.id}</div>
          <div className="orb" style={{fontSize:16,color:T.grn}}>{curTarget.dist}m</div>
          {curSol&&<div className="orb" style={{fontSize:14,color:T.grn}}>{signU(curSol.dropMoa)}<span style={{fontSize:7}}> {unitLbl}</span></div>}
        </div>
        <div style={{display:"flex",gap:5,flexShrink:0}}>
          <button className="btn-prim amb" style={{fontSize:10,padding:"8px 12px"}} onClick={onShotFired}>▶</button>
          <button className="btn-out red" style={{fontSize:10,padding:"8px 10px"}}
            onClick={()=>{setStageActive(false);setStagePending(false);stageRef.current=null;stopTimer();speak("Interrotto")}}>■</button>
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
            <Widget label="SOLUZIONE" color={T.grn} onClick={()=>setActivePanel("solver")} active={!!sol} badge={unit}>
              {sol?(
                <div className={pulse?"pulse-sol":""} style={{textAlign:"center",width:"100%",paddingTop:6}}>
                  <div className="orb" style={{fontSize:30,lineHeight:1,color:sol.dropMoa>=0?T.grn:AMB}}>{signU(sol.dropMoa)}</div>
                  <div style={{fontSize:7,color:grna(.4),marginBottom:6}}>{unitLbl} ALZO</div>
                  <div className="orb" style={{fontSize:18,color:Math.abs(sol.windMoa)>0.5?CYN:(dk?"rgba(0,255,65,.4)":CYN)}}>{signU(sol.windMoa)}</div>
                  <div style={{fontSize:7,color:"rgba(0,212,255,.4)",marginBottom:4}}>{unitLbl} VENTO</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,marginTop:4}}>
                    {[[dist+"m","dist"],[sol.tofMs+"ms","TOF"],
                      [(wx.mv??ammoData?.mv)+"m/s","MV"],
                      [U.en(sol.eneJ,units)+" "+U.enL(units),"energia"]].map(([v,l])=>(
                      <div key={l} style={{textAlign:"center"}}>
                        <div className="orb" style={{fontSize:10,color:l==="MV"&&wx.mv?CYN:T.grn}}>{v}</div>
                        <div style={{fontSize:5,color:l==="MV"&&wx.mv?"rgba(0,212,255,.4)":grna(.3)}}>{l}{l==="MV"&&wx.mv?" ✓":""}</div>
                      </div>
                    ))}
                  </div>
                  {!sol.supersonic&&<div style={{fontSize:5,color:AMB,marginTop:3}}>⚠ SUBSONICO</div>}
                </div>
              ):(
                <div style={{color:grna(.2),fontSize:20}}>—</div>
              )}
            </Widget>

            {/* WIDGET BERSAGLIO */}
            <Widget label="BERSAGLIO" color={stageActive?AMB:stagePending?CYN:gara?PRP:AMB}
              onClick={()=>setActivePanel("stage")} active={stageActive||stagePending||!!gara}
              badge={stageActive?`${tgtIdx+1}/${currentStage?.targets.length}`:stagePending?"RDY":gara?`G${gara.currentIdx+1}/${gara.stages.length}`:null}>
              {stageActive&&curTarget?(
                <div style={{textAlign:"center",width:"100%",paddingTop:6}}>
                  <div className="orb" style={{fontSize:26,color:AMB,lineHeight:1}}>T{curTarget.id}</div>
                  <div className="orb" style={{fontSize:20,color:T.grn,lineHeight:1.1}}>{curTarget.dist}m</div>
                  {curSol&&(
                    <>
                      <div className="orb" style={{fontSize:18,color:T.grn,marginTop:4}}>{signU(curSol.dropMoa)}</div>
                      <div style={{fontSize:6,color:grna(.4)}}>{unitLbl}</div>
                      {Math.abs(curSol.windMoa)>0.2&&<div style={{fontSize:9,color:CYN}}>{signU(curSol.windMoa)} ⇾</div>}
                    </>
                  )}
                  <div style={{fontSize:8,color:"rgba(255,170,0,.6)",marginTop:4}}>{curTarget.pos}</div>
                  <ShotDots total={curTarget.shots} remaining={shotsLeft}/>
                </div>
              ):stagePending&&currentStage?(
                <div style={{textAlign:"center",paddingTop:4,width:"100%"}}>
                  <div className="orb" style={{fontSize:9,color:CYN,lineHeight:1.2,animation:"bleBlip .8s infinite"}}>BRIEFING</div>
                  <div style={{fontSize:7,color:"rgba(0,212,255,.6)",marginTop:2}}>{currentStage.name?.slice(0,22)}</div>
                  <div style={{marginTop:6,display:"flex",flexDirection:"column",gap:2,width:"100%"}}>
                    {[...new Map(stageSols.map(s=>[s.dist,s])).values()].slice(0,4).map(s=>(
                      <div key={s.dist} style={{display:"flex",justifyContent:"space-between",
                        padding:"2px 4px",background:"rgba(0,212,255,.05)",fontSize:8}}>
                        <span style={{color:CYN,fontFamily:"Orbitron,monospace"}}>{s.berLabel||"·"} {s.dist}m</span>
                        <span style={{color:T.grn,fontFamily:"Orbitron,monospace"}}>{signU(s.dropMoa??0,1)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:6,color:CYN,marginTop:4}}>"go" per iniziare</div>
                </div>
              ):(
                <div style={{textAlign:"center",paddingTop:6}}>
                  {gara?(
                    <>
                      <div className="orb" style={{fontSize:11,color:PRP,lineHeight:1.2}}>GARA</div>
                      <div className="orb" style={{fontSize:18,color:PRP,lineHeight:1.1}}>{gara.currentIdx+1}/{gara.stages.length}</div>
                      <div style={{fontSize:7,color:"rgba(204,68,255,.5)",marginTop:3,lineHeight:1.4,maxWidth:80,margin:"3px auto 0"}}>
                        {gara.stages[gara.currentIdx]?.name?.slice(0,20)}
                      </div>
                      {!stageActive&&<div style={{fontSize:6,color:"rgba(204,68,255,.4)",marginTop:4}}>
                        "Vega next"
                      </div>}
                    </>
                  ):(
                    <>
                      <div style={{fontSize:22,color:grna(.1)}}>⊙</div>
                      <div style={{fontSize:9,color:grna(.25),marginTop:6}}>TAP PER<br/>STAGE</div>
                    </>
                  )}
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
                <div style={{fontSize:7,color:grna(.35),marginTop:4}}>{wx.temp}°C · {wx.alt}m</div>
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
                {!timerRunning&&timerLeft===null&&<div style={{fontSize:7,color:grna(.3),marginTop:4}}>{timerSecs}s</div>}
                {shotDetect&&<div style={{fontSize:6,color:RED,marginTop:6}}>🎙 {audioDb}dB</div>}
              </div>
            </Widget>

            {/* WIDGET TRUING */}
            {(()=>{
              const prof=activeProfile
              const pts=(prof?.truingPoints||[]).filter(p=>p.measuredMrad!=null)
              const nPts=pts.length
              // calcola delta medio se ci sono punti
              let meanDelta=null
              if(nPts>0){
                const deltas=pts.map(p=>{
                  const s=physSolve(p.dist,ammoKey,scopeH,zeroM,wx,prof?.customDragFactor??1)
                  if(!s)return null
                  const pred=unit==="MOA"?s.dropMoa:s.dropMrad
                  return p.measuredMrad-(unit==="MOA"?s.dropMoa:s.dropMrad)
                }).filter(d=>d!==null)
                meanDelta=deltas.length?deltas.reduce((a,b)=>a+b,0)/deltas.length:null
              }
              const hasTruing=prof?.useTruing&&prof?.customDragFactor&&prof.customDragFactor!==1
              return(
                <div style={{gridColumn:"1/-1"}}>
                  <Widget label="TRUING" color={PRP} onClick={()=>setActivePanel("truing")}
                    active={hasTruing} badge={nPts>0?`${nPts}pt`:null}>
                    <div style={{width:"100%",paddingTop:4,paddingBottom:2}}>
                      {nPts===0?(
                        <div style={{textAlign:"center",color:"rgba(204,68,255,.35)",fontSize:9,padding:"6px 0"}}>
                          Nessun punto misurato<br/>
                          <span style={{fontSize:7,opacity:.7}}>Apri per inserire dati reali</span>
                        </div>
                      ):(
                        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>
                          <div style={{textAlign:"center"}}>
                            <div className="orb" style={{fontSize:16,color:PRP}}>{nPts}</div>
                            <div style={{fontSize:6,color:"rgba(204,68,255,.45)"}}>PUNTI</div>
                          </div>
                          <div style={{textAlign:"center"}}>
                            <div className="orb" style={{fontSize:16,color:meanDelta!=null&&Math.abs(meanDelta)>0.3?AMB:PRP}}>
                              {meanDelta!=null?(meanDelta>=0?"+":"")+meanDelta.toFixed(2):"—"}
                            </div>
                            <div style={{fontSize:6,color:"rgba(204,68,255,.45)"}}>Δ MEDIO {unit==="MOA"?"MOA":"mrad"}</div>
                          </div>
                          <div style={{textAlign:"center"}}>
                            <div className="orb" style={{fontSize:16,color:hasTruing?PRP:"rgba(204,68,255,.3)"}}>
                              {prof?.customDragFactor!=null?prof.customDragFactor.toFixed(3):"1.000"}
                            </div>
                            <div style={{fontSize:6,color:"rgba(204,68,255,.45)"}}>DRAG F.</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Widget>
                </div>
              )
            })()}
          </div>

          {/* Range card rapida */}
          {rangeCard.length>0&&(
            <div className="card">
              <div className="lbl" style={{marginBottom:5}}>RANGE CARD — {unitLbl}</div>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(rangeCard.length,ammoGroup==="RIMFIRE"?10:7)},1fr)`,gap:3}}>
                {rangeCard.map(r=>(
                  <div key={r.dist} onClick={()=>setDist(r.dist)} style={{
                    background:r.dist===dist?(dk?"rgba(0,255,65,.1)":"rgba(255,200,50,.35)"):(dk?"rgba(0,255,65,.02)":"rgba(255,210,80,.1)"),
                    border:`1px solid ${r.dist===dist?(dk?"rgba(0,255,65,.35)":"rgba(180,140,0,.5)"):(dk?"rgba(0,255,65,.06)":"rgba(180,140,0,.18)")}`,
                    padding:"3px 1px",textAlign:"center",cursor:"pointer",borderRadius:2}}>
                    <div style={{fontSize:6,color:dk?"rgba(0,255,65,.3)":"#1C1C1E"}}>{r.dist}</div>
                    <div className="orb" style={{fontSize:9,color:r.supersonic===false?AMB:(dk?T.grn:"#1C1C1E")}}>{signU(r.dropMoa??0,1)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profilo attivo + slider dist */}
          <div className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontSize:9,color:T.grn,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {activeProfile?.name??ammoKey}
                </div>
                <div style={{fontSize:6,color:dk?"rgba(0,255,65,.35)":T.textDim,marginTop:1}}>
                  BC:{ammoData?.bc_g7} · MV:<span style={{color:wx.mv?CYN:T.grn}}>{wx.mv??ammoData?.mv}m/s{wx.mv?' ✓':''}</span> · ◎{zeroM}m
                </div>
              </div>
            </div>
            <div className="lbl">DISTANZA — <span className="orb" style={{fontSize:13,color:T.grn}}>{dist}m</span></div>
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
              <span style={{fontSize:12,color:grna(.4)}}>{U.distL(units)}</span>
              <div style={{flex:1}}>
                <input type="range" className="vg-range" min={10} max={zeroM<=50?500:2000} value={dist}
                  onChange={e=>setDist(+e.target.value)}/>
              </div>
            </div>
          </div>

          {sol&&(
            <>
              <div className={pulse?"pulse-sol":""} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div className="card" style={{borderColor:grna(.3)}}>
                  <div className="lbl">ALZO</div>
                  <div className="orb" style={{fontSize:34,color:sol.dropMoa>=0?T.grn:AMB,lineHeight:1}}>{signU(sol.dropMoa)}</div>
                  <div style={{fontSize:9,color:grna(.35),marginTop:2}}>{unitLbl}</div>
                  <div style={{fontSize:9,color:grna(.25),marginTop:4}}>
                    {unit==="MOA"?`${signU(sol.dropMoad??sol.dropMoa/3.4377,3)} mrad`:`${signU(sol.dropMoa*3.4377)} MOA`}
                  </div>
                </div>
                <div className="card" style={{borderColor:"rgba(0,212,255,.25)"}}>
                  <div className="lbl">DERIVA VENTO</div>
                  <div className="orb" style={{fontSize:34,color:Math.abs(sol.windMoa)>1.5?AMB:T.grn,lineHeight:1}}>{signU(sol.windMoa)}</div>
                  <div style={{fontSize:9,color:grna(.35),marginTop:2}}>{unitLbl}</div>
                  <div style={{fontSize:9,color:"rgba(0,212,255,.45)",marginTop:4}}>{wx.wind}m/s@{wx.windAngle}°</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:8}}>
                {[
                  ["TOF",sol.tofMs,"ms",T.grn],
                  ["VEL",U.vel(sol.velMs,units),U.velL(units),sol.supersonic?T.grn:AMB],
                  ["ENERGIA",U.en(sol.eneJ,units),U.enL(units),T.grn],
                  ["SPIN",signU(sol.sdMoa,unit==="MOA"?2:3),unitLbl,grna(.5)],
                ].map(([l,v,u,c])=>(
                  <div key={l} style={{background:grna(.025),border:`1px solid grna(.08)`,padding:"8px 4px",textAlign:"center",borderRadius:2}}>
                    <div className="lbl">{l}</div>
                    <div className="orb" style={{fontSize:13,color:c,marginTop:2}}>{v}</div>
                    <div style={{fontSize:7,color:grna(.3)}}>{u}</div>
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
              background:grna(.04),borderRadius:2,marginBottom:4}}>
              {["DIST","ALZO","VENTO","TOF","VEL"].map(h=>(
                <div key={h} style={{fontSize:6,color:grna(.38),letterSpacing:".06em"}}>{h}</div>
              ))}
            </div>
            {rangeCard.map(r=>(
              <div key={r.dist} onClick={()=>{setDist(r.dist);setActivePanel(null)}}
                style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr 44px 36px",gap:4,
                  padding:"6px 6px",border:`1px solid ${r.dist===dist?grna(.3):grna(.06)}`,
                  background:r.dist===dist?grna(.06):"transparent",marginBottom:2,cursor:"pointer",borderRadius:2}}>
                <div className="orb" style={{fontSize:11,color:T.grn}}>{r.dist}m</div>
                <div className="orb" style={{fontSize:13,color:r.dropMoa>=0?T.grn:AMB}}>{signU(r.dropMoa??0,1)}</div>
                <div className="orb" style={{fontSize:13,color:Math.abs(r.windMoa??0)>0.5?CYN:grna(.4)}}>{signU(r.windMoa??0,1)}</div>
                <div style={{fontSize:9,color:grna(.45)}}>{r.tofMs}ms</div>
                <div style={{fontSize:8,color:r.supersonic===false?AMB:grna(.4)}}>{r.velMs}</div>
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
                  <div style={{fontSize:10,color:T.grn}}>◉ {bleName}</div>
                  <div style={{fontSize:7,color:grna(.4)}}>Dati live</div>
                </div>
                <button className="btn-out red" style={{fontSize:9,padding:"6px 10px"}} onClick={disconnectCalypso}>DISC.</button>
              </div>
            )}
            {bleError&&<div style={{fontSize:8,color:AMB,marginTop:8}}>{bleError}</div>}
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
          {/* GARA ATTIVA / CARICATA */}
          {gara&&(
            <div className="card" style={{border:`1px solid ${garaActive?"rgba(204,68,255,.5)":"rgba(204,68,255,.25)"}`,
              background:garaActive?"rgba(204,68,255,.06)":"rgba(204,68,255,.02)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div>
                  <div className="lbl" style={{color:PRP}}>GARA {garaActive?"IN CORSO":"CARICATA"}</div>
                  <div style={{fontSize:11,color:PRP,fontFamily:"Orbitron,monospace",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:200}}>{gara.name}</div>
                </div>
                <span style={{color:RED,fontSize:20,cursor:"pointer",padding:"0 6px"}}
                  onClick={()=>{garaRef.current=null;setGara(null);setGaraActive(false);speak("Gara annullata")}}>×</span>
              </div>
              {/* Progressione stage nella gara */}
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                {gara.stages.map((s,i)=>(
                  <div key={s.id} style={{
                    padding:"4px 8px",fontSize:8,fontFamily:"Orbitron,monospace",borderRadius:2,
                    background:i<gara.currentIdx?grna(.12):i===gara.currentIdx?"rgba(204,68,255,.25)":"rgba(204,68,255,.06)",
                    border:`1px solid ${i<gara.currentIdx?grna(.3):i===gara.currentIdx?PRP:"rgba(204,68,255,.2)"}`,
                    color:i<gara.currentIdx?grna(.6):i===gara.currentIdx?PRP:"rgba(204,68,255,.4)"}}>
                    {i<gara.currentIdx?"✓ ":i===gara.currentIdx?"▶ ":""}{i+1}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                {!garaActive&&(
                  <button className="btn-prim prp" style={{flex:1,fontSize:10}}
                    onClick={()=>startGara(gara)}>▶ AVVIA GARA</button>
                )}
                {gara.currentIdx<gara.stages.length&&!stageActive&&(
                  <button className="btn-prim prp" style={{flex:1,fontSize:10}}
                    onClick={()=>{const s=gara.stages[gara.currentIdx];if(s)loadStage(s)}}>
                    ▶ STAGE {gara.currentIdx+1}
                  </button>
                )}
                <button className="btn-out" style={{fontSize:10,padding:"10px 14px"}}
                  onClick={()=>{
                    const imported=stages.filter(s=>s.id>5)
                    if(imported.length>1){
                      const ng={id:Date.now(),name:"Gara custom",stages:imported,currentIdx:0}
                      garaRef.current=ng;setGara(ng);setGaraActive(false)
                      speak(`Gara aggiornata: ${imported.length} stage`)
                    }
                  }}>RICOSTRUISCI</button>
              </div>
              <div style={{fontSize:7,color:"rgba(204,68,255,.4)",marginTop:8,lineHeight:1.7}}>
                Voce: "Vega avvia gara" · "Vega next" · "Vega stato gara" · "Vega annulla gara"
              </div>
            </div>
          )}

          {/* Crea gara manuale dagli stage importati */}
          {!gara&&stages.filter(s=>s.id>5).length>=2&&(
            <div className="card" style={{border:"1px dashed rgba(204,68,255,.3)",background:"rgba(204,68,255,.02)"}}>
              <div className="lbl" style={{color:PRP,marginBottom:6}}>CREA GARA</div>
              <div style={{fontSize:9,color:"rgba(204,68,255,.6)",marginBottom:8}}>
                {stages.filter(s=>s.id>5).length} stage importati disponibili
              </div>
              <button className="btn-prim prp" style={{width:"100%",fontSize:10}}
                onClick={()=>{
                  const imported=stages.filter(s=>s.id>5)
                  const ng={id:Date.now(),name:"Gara",stages:imported,currentIdx:0}
                  garaRef.current=ng;setGara(ng);setGaraActive(false)
                  speak(`Gara creata: ${imported.length} stage`)
                }}>RAGGRUPPA IN GARA</button>
            </div>
          )}

          <div className="card">
            {(()=>{
              // Quando c'è una gara importata, mostra solo gli stage importati (id>5)
              // I 5 builtin si nascondono per non confondersi con quelli della gara
              const hasImported = stages.some(s=>s.id>5)
              const libStages = hasImported ? stages.filter(s=>s.id>5) : stages
              return(<>
            <div className="lbl" style={{marginBottom:8}}>
              STAGE LIBRARY — {libStages.length}
              {hasImported&&<span style={{color:"rgba(204,68,255,.5)",marginLeft:6,fontSize:6}}>· STAGE IMPORTATI (builtin nascosti)</span>}
            </div>
            {libStages.map(s=>(
              <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"10px",border:`1px solid ${currentStage?.id===s.id?"rgba(255,170,0,.4)":grna(.1)}`,
                background:currentStage?.id===s.id?"rgba(255,170,0,.04)":"transparent",
                cursor:"pointer",transition:"all .15s",marginBottom:5,borderRadius:2}}>
                <div style={{minWidth:0,flex:1}} onClick={()=>loadStage(s)}>
                  <div style={{fontSize:10,color:currentStage?.id===s.id?AMB:T.grn,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                  <div style={{fontSize:7,color:grna(.35),marginTop:2}}>{s.desc} · {s.par}s · {s.targets.length}T</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  {s.id>5&&<span style={{color:RED,fontSize:14,cursor:"pointer",padding:"0 4px"}}
                    onClick={()=>setStages(prev=>prev.filter(x=>x.id!==s.id))}>×</span>}
                  <button className="btn-prim" style={{fontSize:9,padding:"6px 12px"}} onClick={()=>loadStage(s)}>CARICA</button>
                </div>
              </div>
            ))}
            </>)
            })()}
          </div>
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>IMPORTA STAGE</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>

              {/* PDF / TXT */}
              <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                padding:"16px 8px",border:`1px dashed grna(.25)`,
                textAlign:"center",cursor:"pointer",background:grna(.02),borderRadius:4,gap:6}}>
                <input type="file" accept=".pdf,.txt" style={{display:"none"}}
                  onChange={e=>handlePdfFile(e.target.files[0])}/>
                <div style={{fontSize:24,color:grna(.4)}}>⊕</div>
                <div style={{fontSize:9,color:grna(.5),lineHeight:1.4}}>
                  {pdfLoading?"Analisi...":"PDF / TXT"}
                </div>
              </label>

              {/* FOTOCAMERA */}
              <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                padding:"16px 8px",border:`1px dashed ${camLoading?"rgba(0,212,255,.5)":"rgba(0,212,255,.25)"}`,
                textAlign:"center",cursor:"pointer",
                background:camLoading?"rgba(0,212,255,.04)":"rgba(0,212,255,.01)",borderRadius:4,gap:6,
                position:"relative",overflow:"hidden"}}>
                <input type="file" accept="image/*" capture="environment" style={{display:"none"}}
                  onChange={e=>handleCameraPhoto(e.target.files[0])}/>
                {camPreview?(
                  <img src={camPreview} alt="preview"
                    style={{position:"absolute",inset:0,width:"100%",height:"100%",
                      objectFit:"cover",opacity:.25,borderRadius:4}}/>
                ):null}
                <div style={{fontSize:22,color:`rgba(0,212,255,${camLoading?.6:.4})`,zIndex:1}}>
                  {camLoading?"◌":"◎"}
                </div>
                <div style={{fontSize:9,color:`rgba(0,212,255,${camLoading?.8:.5})`,lineHeight:1.4,zIndex:1}}>
                  {camLoading?"OCR...":"FOTOCAMERA"}
                </div>
                {camLoading&&(
                  <div style={{position:"absolute",bottom:0,left:0,height:2,
                    background:`linear-gradient(90deg,${CYN},rgba(0,212,255,.2))`,
                    animation:"bleBlip .8s ease-in-out infinite",width:"60%",zIndex:1}}/>
                )}
              </label>
            </div>

            {/* Messaggio errore / stato */}
            {bleError&&(
              <div style={{fontSize:8,color:AMB,marginTop:8,padding:"5px 8px",
                background:"rgba(255,170,0,.04)",border:"1px solid rgba(255,170,0,.15)",borderRadius:3}}>
                {bleError}
              </div>
            )}
            <div style={{fontSize:7,color:grna(.25),marginTop:8,lineHeight:1.7}}>
              Fotocamera: scatta la photo del foglio stage — OCR estrae automaticamente le distanze.
            </div>
          </div>
          {stageSols.length>0&&currentStage&&(
            <div className="card">
              <div className="lbl" style={{marginBottom:6}}>DOPE CARD — {currentStage.name}</div>
              {stageSols.map((s,i)=>(
                <div key={s.id} style={{display:"grid",gridTemplateColumns:"24px 44px 1fr 1fr 42px",gap:4,
                  padding:"7px 6px",border:`1px solid ${i===tgtIdx&&stageActive?"rgba(255,170,0,.4)":grna(.06)}`,
                  background:i===tgtIdx&&stageActive?"rgba(255,170,0,.04)":"transparent",
                  marginBottom:2,cursor:"pointer",borderRadius:2}} onClick={()=>{setDist(s.dist);setActivePanel(null)}}>
                  <div className="orb" style={{fontSize:9,color:i===tgtIdx&&stageActive?AMB:grna(.35)}}>T{s.id}</div>
                  <div className="orb" style={{fontSize:11,color:i===tgtIdx&&stageActive?AMB:T.grn}}>{s.dist}m</div>
                  <div className="orb" style={{fontSize:13,color:T.grn}}>{signU(s.dropMoa??0,1)} <span style={{fontSize:6,opacity:.4}}>{unitLbl}</span></div>
                  <div className="orb" style={{fontSize:13,color:Math.abs(s.windMoa??0)>0.5?CYN:grna(.4)}}>{signU(s.windMoa??0,1)}</div>
                  <div style={{fontSize:8,color:s.supersonic===false?AMB:grna(.4)}}>{s.velMs}</div>
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
              <span style={{fontSize:10,color:grna(.4)}}>sec</span>
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
                borderBottom:`1px solid grna(.06)`}}>
                <div className="toggle-wrap" style={{flex:1}}
                  onClick={()=>setTimerAlerts(prev=>prev.map(a=>a.id===al.id?{...a,enabled:!a.enabled}:a))}>
                  <div className={`toggle-bg${al.enabled?" on":""}`}><div className="toggle-knob"/></div>
                  <span style={{fontSize:10,color:al.enabled?T.grn:grna(.35)}}>{al.label} — {al.secs}s</span>
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
              <span style={{fontSize:10,color:countdown10?T.grn:grna(.35)}}>Bip countdown ultimi 10 secondi</span>
            </div>
            {/* 3 bip allo scadere — sempre attivo */}
            <div style={{fontSize:8,color:grna(.3),marginTop:8,lineHeight:1.8}}>
              Allo scadere: 3 bip consecutivi + voce "Tempo scaduto"
            </div>
          </div>

          {/* Shot detection */}
          <div className="card">
            <div className="lbl" style={{marginBottom:8}}>RILEVAMENTO COLPO AUDIO</div>
            <div className="toggle-wrap" style={{marginBottom:10}} onClick={()=>setShotDetect(v=>!v)}>
              <div className={`toggle-bg${shotDetect?" on":""}`}><div className="toggle-knob"/></div>
              <span style={{fontSize:10,color:shotDetect?T.grn:grna(.4)}}>
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
                  <span style={{fontSize:9,color:grna(.4),minWidth:34}}>{audioDb}dB</span>
                  <DbMeter db={audioDb} threshold={shotThreshold}/>
                </div>
                {!micReady&&<div style={{fontSize:8,color:AMB,marginTop:6}}>⚠ Autorizzazione microfono...</div>}
              </>
            )}
          </div>
        </>
      )}

      {/* ═══ PANNELLO TRUING ═══ */}
      {mainTab==="home"&&activePanel==="truing"&&(()=>{
        const prof=activeProfile
        if(!prof)return <div className="card" style={{textAlign:"center",padding:30,color:"rgba(204,68,255,.4)"}}>Nessun profilo attivo</div>
        const pts=(prof.truingPoints||[]).filter(p=>p.measuredMrad!=null&&p.dist>0)
        // Calcola predicted per ogni punto
        const rows=pts.map(p=>{
          const s=physSolve(p.dist,ammoKey,scopeH,zeroM,wx,1.0)
          const pred=s?(unit==="MOA"?s.dropMoa:s.dropMrad):null
          const meas=unit==="MOA"?p.measuredMrad*3.4377:p.measuredMrad
          const delta=pred!=null?+(meas-pred).toFixed(3):null
          return{...p,pred,meas:+meas.toFixed(3),delta}
        }).sort((a,b)=>a.dist-b.dist)
        // Calcola drag factor ottimale (metodo ratio medio)
        const ratios=rows.filter(r=>r.pred&&r.pred>0.01).map(r=>r.meas/r.pred)
        const suggestedDf=ratios.length?+(ratios.reduce((a,b)=>a+b,0)/ratios.length).toFixed(4):1.0
        const meanDelta=rows.filter(r=>r.delta!=null).length
          ? +(rows.filter(r=>r.delta!=null).map(r=>r.delta).reduce((a,b)=>a+b,0)/rows.filter(r=>r.delta!=null).length).toFixed(3)
          : null
        const unitL=unit==="MOA"?"MOA":"mrad"
        return(
          <>
            <div className="card" style={{background:"rgba(204,68,255,.04)",border:"1px solid rgba(204,68,255,.2)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div>
                  <div className="orb" style={{fontSize:12,color:PRP,letterSpacing:".15em"}}>TRUING</div>
                  <div style={{fontSize:7,color:"rgba(204,68,255,.5)",marginTop:2}}>{prof.name} · {prof.caliber}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:7,color:"rgba(204,68,255,.4)"}}>DRAG FACTOR ATTIVO</div>
                  <div className="orb" style={{fontSize:18,color:prof.useTruing&&prof.customDragFactor!==1?PRP:"rgba(204,68,255,.3)"}}>{(prof.customDragFactor??1).toFixed(4)}</div>
                </div>
              </div>
              {meanDelta!=null&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:4}}>
                  {[
                    ["Δ MEDIO",meanDelta>=0?"+"+meanDelta.toFixed(3):meanDelta.toFixed(3),Math.abs(meanDelta)<0.1?T.grn:Math.abs(meanDelta)<0.3?AMB:RED],
                    ["DRAG F. CALC.",suggestedDf.toFixed(4),PRP],
                    ["PUNTI",pts.length,T.grn],
                  ].map(([l,v,c])=>(
                    <div key={l} style={{background:"rgba(204,68,255,.04)",border:"1px solid rgba(204,68,255,.1)",padding:"6px 4px",textAlign:"center",borderRadius:4}}>
                      <div style={{fontSize:5,color:"rgba(204,68,255,.45)",letterSpacing:".1em"}}>{l}</div>
                      <div className="orb" style={{fontSize:13,color:c,marginTop:2}}>{v}</div>
                      <div style={{fontSize:5,color:"rgba(204,68,255,.3)"}}>{l==="Δ MEDIO"?unitL:""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabella punti */}
            <div className="card">
              <div className="lbl" style={{marginBottom:6}}>PUNTI MISURATI vs PREVISTO</div>
              {rows.length===0?(
                <div style={{textAlign:"center",padding:"20px 0",color:"rgba(204,68,255,.3)",fontSize:9}}>
                  Nessun punto truing nel profilo.<br/>
                  <span style={{fontSize:7}}>Aggiungi punti dalla scheda PROFILO → sezione TRUING</span>
                </div>
              ):(
                <>
                  {/* Header */}
                  <div style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr 1fr 36px",gap:3,marginBottom:4}}>
                    {["DIST","PREV.","MIS.","Δ",""].map(h=>(
                      <div key={h} style={{fontSize:5,color:"rgba(204,68,255,.4)",textAlign:"center",letterSpacing:".08em"}}>{h}</div>
                    ))}
                  </div>
                  {rows.map(r=>(
                    <div key={r.id} style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr 1fr 36px",gap:3,
                      padding:"6px 4px",marginBottom:2,borderRadius:3,
                      background:r.delta!=null&&Math.abs(r.delta)>0.3?"rgba(255,170,0,.04)":"rgba(204,68,255,.02)",
                      border:`1px solid ${r.delta!=null&&Math.abs(r.delta)>0.5?"rgba(255,51,68,.3)":r.delta!=null&&Math.abs(r.delta)>0.2?"rgba(255,170,0,.25)":"rgba(204,68,255,.1)"}`}}>
                      <div className="orb" style={{fontSize:11,color:PRP,textAlign:"center"}}>{r.dist}m</div>
                      <div className="orb" style={{fontSize:11,color:"rgba(204,68,255,.6)",textAlign:"center"}}>{r.pred!=null?r.pred.toFixed(3):"—"}</div>
                      <div className="orb" style={{fontSize:11,color:T.grn,textAlign:"center"}}>{r.meas.toFixed(3)}</div>
                      <div className="orb" style={{fontSize:11,textAlign:"center",
                        color:r.delta==null?"rgba(204,68,255,.3)":Math.abs(r.delta)<0.1?T.grn:Math.abs(r.delta)<0.3?AMB:RED}}>
                        {r.delta!=null?(r.delta>=0?"+":"")+r.delta.toFixed(3):"—"}
                      </div>
                      <div style={{fontSize:7,color:"rgba(204,68,255,.4)",textAlign:"center",alignSelf:"center"}}>{unitL}</div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Azioni */}
            {rows.length>0&&suggestedDf!==1&&(
              <div className="card" style={{background:"rgba(204,68,255,.04)",border:"1px solid rgba(204,68,255,.2)"}}>
                <div className="lbl" style={{marginBottom:6}}>CALCOLO TRUING</div>
                <div style={{fontSize:9,color:"rgba(204,68,255,.55)",lineHeight:1.6,marginBottom:10}}>
                  Basato su {rows.filter(r=>r.pred).length} punti misurati.<br/>
                  Drag factor calcolato: <span className="orb" style={{color:PRP}}>{suggestedDf.toFixed(4)}</span><br/>
                  Attuale: <span className="orb" style={{color:"rgba(204,68,255,.5)"}}>{(prof.customDragFactor??1).toFixed(4)}</span>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button style={{flex:1,padding:"12px 8px",background:"rgba(204,68,255,.15)",
                    border:"1px solid rgba(204,68,255,.5)",color:PRP,fontFamily:"Orbitron,monospace",
                    fontSize:9,letterSpacing:".1em",cursor:"pointer",borderRadius:4}}
                    onClick={()=>{
                      setProfiles(prev=>prev.map(p=>{
                        if(p.id!==prof.id)return p
                        return{...p,customDragFactor:suggestedDf,useTruing:true}
                      }))
                      speak(`Drag factor applicato: ${suggestedDf.toFixed(3)}`,true)
                    }}>APPLICA DRAG FACTOR</button>
                  {prof.useTruing&&(
                    <button style={{padding:"12px 10px",background:"transparent",
                      border:"1px solid rgba(255,51,68,.3)",color:RED,fontFamily:"Orbitron,monospace",
                      fontSize:9,cursor:"pointer",borderRadius:4}}
                      onClick={()=>{
                        setProfiles(prev=>prev.map(p=>p.id===prof.id?{...p,customDragFactor:1.0,useTruing:false}:p))
                      }}>RESET</button>
                  )}
                </div>
              </div>
            )}
          </>
        )
      })()}

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
              <div style={{fontSize:30,color:dk?"rgba(0,255,65,.1)":T.textDim,marginBottom:10}}>⊙</div>
              <div style={{fontSize:10,color:dk?"rgba(0,255,65,.3)":T.textDim}}>Nessun profilo.<br/>Crea il tuo setup fucile.</div>
            </div>
          )}
          {profiles.map(p=>(
            <div key={p.id} style={{
              padding:"12px",border:`1px solid ${activeProfileId===p.id?(dk?"rgba(0,255,65,.5)":T.accent):(dk?"rgba(0,255,65,.12)":T.cardBorder)}`,
              background:activeProfileId===p.id?(dk?"rgba(0,255,65,.06)":"rgba(0,122,255,.05)"):(dk?"rgba(0,255,65,.02)":T.card),
              marginBottom:8,borderRadius:dk?2:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:activeProfileId===p.id?T.grn:AMB,fontFamily:"Orbitron,monospace",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name||"—"}</div>
                  <div style={{fontSize:8,color:dk?"rgba(0,255,65,.45)":T.textDim,marginTop:3}}>
                    {p.caliber} · {p.ammoKey} · ◎{p.zeroM}m
                  </div>
                  <div style={{fontSize:8,color:dk?"rgba(0,212,255,.45)":CYN,marginTop:2}}>
                    {p.scopeName||"—"} · {p.scopePlane} · h={p.scopeHeightCm}cm · {p.reticleType} {p.clickValue}cl
                  </div>
                  <div style={{fontSize:7,color:dk?"rgba(0,255,65,.3)":T.textDim,marginTop:2}}>
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

      {/* ═══ EDITOR PROFILO (AB-style) ═══ */}
      {mainTab==="profiles"&&activePanel==="profile_edit"&&editingProfile&&(()=>{
        // helpers locali
        const ep=editingProfile
        const set=k=>e=>setEditingProfile(p=>({...p,[k]:e.target.value}))
        const setN=k=>e=>setEditingProfile(p=>({...p,[k]:+e.target.value}))
        const setNOpt=k=>e=>setEditingProfile(p=>({...p,[k]:e.target.value?+e.target.value:null}))
        // stile card AB chiaro
        const LC="#0a0f0a"
        const LBL={fontSize:11,color:CYN,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:".06em",marginBottom:4}
        const CARD={background:"rgba(0,212,255,.03)",border:"1px solid rgba(0,212,255,.12)",borderRadius:6,padding:"14px",marginBottom:10}
        const HDR={display:"flex",justifyContent:"space-between",alignItems:"center",
          fontFamily:"Orbitron,monospace",fontSize:11,color:"#e8f0e8",letterSpacing:".1em",
          paddingBottom:8,marginBottom:10,borderBottom:"1px solid rgba(255,255,255,.07)"}
        const IN={background:"rgba(0,0,0,.35)",border:"1px solid rgba(0,212,255,.18)",borderRadius:4,
          color:"#e8f0e8",fontFamily:"'IBM Plex Mono',monospace",fontSize:13,padding:"10px 12px",
          width:"100%",boxSizing:"border-box",minHeight:44}
        const UNIT={fontSize:9,color:"rgba(0,212,255,.6)",fontFamily:"'IBM Plex Mono',monospace",
          marginLeft:4,letterSpacing:".1em"}
        const INROW={display:"flex",alignItems:"center",background:"rgba(0,0,0,.35)",
          border:"1px solid rgba(0,212,255,.18)",borderRadius:4,overflow:"hidden"}
        const INFIELD={...IN,border:"none",background:"transparent",flex:1}
        const INUNIT={...UNIT,padding:"0 10px",background:"rgba(0,212,255,.06)",
          alignSelf:"stretch",display:"flex",alignItems:"center",borderLeft:"1px solid rgba(0,212,255,.12)"}

        // Toggle switch
        const Toggle=({val,onChange})=>(
          <div onClick={onChange} style={{width:44,height:26,borderRadius:13,cursor:"pointer",position:"relative",
            background:val?grna(.5):"rgba(255,255,255,.1)",
            border:`1px solid ${val?grna(.4):"rgba(255,255,255,.15)"}`,
            transition:"background .2s",flexShrink:0}}>
            <div style={{position:"absolute",top:3,left:val?20:3,width:18,height:18,borderRadius:"50%",
              background:val?GRN:"rgba(255,255,255,.5)",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.4)"}}/>
          </div>
        )

        // calcola Sg approssimativo (Miller formula)
        const dCm=(ep.bulletDiaMm||0)/10
        const mGr=ep.bulletWeightGr||0
        const lCm=(ep.bulletLengthMm||0)/10
        const twistCm=ep.twistCm||40.64
        const mvMs=ep.mvMs||326
        const Sg=dCm>0&&mGr>0&&lCm>0
          ? +(30*(mGr/15.43)/(Math.pow(dCm*10,3)*(lCm*10/((dCm*10)*Math.PI))*(Math.pow(twistCm/10/(dCm*10),2)))).toFixed(2)
          : null

        return(
        <>
          {/* ── Nome profilo ── */}
          <div style={{marginBottom:10}}>
            <div style={LBL}>NOME PROFILO</div>
            <input style={IN} type="text" placeholder="es. Bergara B14 .22LR" value={ep.name} onChange={set("name")}/>
          </div>

          {/* ── Bullet Data ── */}
          <div style={CARD}>
            <div style={HDR}><span>BULLET DATA</span></div>
            {/* Modello BC */}
            <div style={LBL}>MODELLO</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {["G1","G7"].map(v=>(
                <button key={v} onClick={()=>setEditingProfile(p=>({...p,bcModel:v}))}
                  style={{flex:1,padding:"10px",borderRadius:20,border:`2px solid ${ep.bcModel===v?GRN:"rgba(255,255,255,.15)"}`,
                    background:ep.bcModel===v?grna(.12):"transparent",
                    color:ep.bcModel===v?GRN:"rgba(255,255,255,.5)",
                    fontFamily:"Orbitron,monospace",fontSize:12,cursor:"pointer",display:"flex",
                    alignItems:"center",gap:6,justifyContent:"center"}}>
                  <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${ep.bcModel===v?GRN:"rgba(255,255,255,.3)"}`,
                    background:ep.bcModel===v?grna(.6):"transparent",display:"inline-block",verticalAlign:"middle"}}/>
                  {v}
                </button>
              ))}
            </div>
            {/* Grid dati proiettile */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <div style={LBL}>DIAMETRO</div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.001} placeholder="0.000"
                    value={ep.bulletDiaMm||""} onChange={setN("bulletDiaMm")}/>
                  <span style={INUNIT}>CM</span>
                </div>
              </div>
              <div>
                <div style={LBL}>PESO</div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.5} placeholder="0.0"
                    value={ep.bulletWeightGr||""} onChange={setN("bulletWeightGr")}/>
                  <span style={INUNIT}>GR</span>
                </div>
              </div>
              <div>
                <div style={LBL}>BC {ep.bcModel||"G1"}</div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.001} placeholder="0.000"
                    value={ep.bcValue||""} onChange={setN("bcValue")}/>
                  <span style={INUNIT}>{ep.bcModel||"G1"}</span>
                </div>
              </div>
              <div>
                <div style={LBL}>DRAG FACTOR</div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.001} placeholder="1.000"
                    value={ep.customDragFactor??1.0} onChange={setN("customDragFactor")}/>
                </div>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <div style={LBL}>LUNGHEZZA</div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.001} placeholder="0.000"
                    value={ep.bulletLengthMm||""} onChange={setN("bulletLengthMm")}/>
                  <span style={INUNIT}>CM</span>
                </div>
              </div>
            </div>
            {/* Munizione catalogo solver */}
            <div style={{...LBL,marginTop:4}}>MUNIZIONE SOLVER (catalogo)</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
              {Object.keys(AMMO_CATALOG).map(g=>(
                <button key={g} className={`pill${ep.ammoGroup===g?" on":""}`}
                  onClick={()=>setEditingProfile(p=>({...p,ammoGroup:g,ammoKey:Object.keys(AMMO_CATALOG[g])[0]}))}>
                  {g}
                </button>
              ))}
            </div>
            <select className="vg-sel" value={ep.ammoKey}
              onChange={e=>setEditingProfile(p=>({...p,ammoKey:e.target.value}))}>
              {Object.keys(AMMO_CATALOG[ep.ammoGroup]).map(k=>(
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* ── Gun Data ── */}
          <div style={CARD}>
            <div style={HDR}><span>GUN DATA</span></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <div style={LBL}>VELOCITÀ BOCCA</div>
                <div style={INROW}>
                  <input style={{...INFIELD,color:ep.useMvTempTable?"rgba(255,255,255,.3)":undefined}}
                    type="number" step={.1} placeholder="326.1"
                    value={ep.mvMs??""} onChange={setNOpt("mvMs")}/>
                  <span style={INUNIT}>M/S</span>
                </div>
              </div>
              <div>
                <div style={LBL}>ZERO</div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={5} placeholder="50"
                    value={ep.zeroM||""} onChange={setN("zeroM")}/>
                  <span style={INUNIT}>M</span>
                </div>
              </div>
              <div>
                <div style={LBL}>ALTEZZA LINEA VISIVA</div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.1} placeholder="6.50"
                    value={ep.scopeHeightCm||""} onChange={setN("scopeHeightCm")}/>
                  <span style={INUNIT}>CM</span>
                </div>
              </div>
              <div>
                <div style={LBL}>TWIST RATE</div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.01} placeholder="40.64"
                    value={ep.twistCm||""} onChange={setN("twistCm")}/>
                  <span style={INUNIT}>CM</span>
                </div>
              </div>
            </div>
            {/* Direzione twist L/R */}
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {["L","R"].map(v=>(
                <button key={v} onClick={()=>setEditingProfile(p=>({...p,twistDir:v}))}
                  style={{flex:1,padding:"10px",borderRadius:20,
                    border:`2px solid ${ep.twistDir===v?GRN:"rgba(255,255,255,.15)"}`,
                    background:ep.twistDir===v?grna(.12):"transparent",
                    color:ep.twistDir===v?GRN:"rgba(255,255,255,.5)",
                    fontFamily:"Orbitron,monospace",fontSize:12,cursor:"pointer"}}>
                  {v}
                </button>
              ))}
            </div>
            {/* Stability factor display */}
            <div style={LBL}>FATTORE DI STABILITÀ (livello del mare)</div>
            <div style={{background:"rgba(0,0,0,.3)",border:"1px solid rgba(255,170,0,.2)",borderRadius:4,
              padding:"12px",textAlign:"center"}}>
              <span style={{fontFamily:"Orbitron,monospace",fontSize:16,color:AMB}}>
                Sg = {Sg!==null?Sg:"—"}
              </span>
              {Sg!==null&&Sg<1.5&&<div style={{fontSize:9,color:RED,marginTop:4}}>INSTABILE — aumenta twist o riduci lunghezza</div>}
              {Sg!==null&&Sg>=1.5&&Sg<2.0&&<div style={{fontSize:9,color:AMB,marginTop:4}}>MARGINALE</div>}
              {Sg!==null&&Sg>=2.0&&<div style={{fontSize:9,color:T.grn,marginTop:4}}>STABILE</div>}
            </div>
          </div>

          {/* ── Scope ── */}
          <div style={CARD}>
            <div style={HDR}><span>SCOPE</span></div>
            <div style={LBL}>UNITÀ OTTICA</div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {["MRAD","MOA"].map(v=>(
                <button key={v} onClick={()=>setEditingProfile(p=>({...p,scopeUnit:v,reticleType:v==="MRAD"?"mrad":"MOA"}))}
                  style={{flex:1,padding:"10px",borderRadius:20,
                    border:`2px solid ${ep.scopeUnit===v?CYN:"rgba(255,255,255,.15)"}`,
                    background:ep.scopeUnit===v?"rgba(0,212,255,.1)":"transparent",
                    color:ep.scopeUnit===v?CYN:"rgba(255,255,255,.5)",
                    fontFamily:"Orbitron,monospace",fontSize:12,cursor:"pointer"}}>
                  {v}
                </button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <div style={LBL}>PIANO FOCALE</div>
                <div style={{display:"flex",gap:4}}>
                  {["FFP","SFP"].map(v=>(
                    <button key={v} className={`pill${ep.scopePlane===v?" on":""}`}
                      style={{flex:1}} onClick={()=>setEditingProfile(p=>({...p,scopePlane:v}))}>{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={LBL}>CLICK VALUE</div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.01} value={ep.clickValue??0.1} onChange={setN("clickValue")}/>
                </div>
              </div>
              <div>
                <div style={LBL}>MODELLO OTTICA</div>
                <input style={{...IN,gridColumn:"1/-1"}} type="text" placeholder="es. Discovery XED 6-36x56"
                  value={ep.scopeName??""} onChange={set("scopeName")}/>
              </div>
            </div>
          </div>

          {/* ── Advanced Settings ── */}
          <div style={CARD}>
            <div style={HDR}><span>IMPOSTAZIONI AVANZATE</span></div>
            {/* Zero offset */}
            <div style={{...LBL,marginBottom:8}}>OFFSET ZERO</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <div style={LBL}>ZERO HEIGHT</div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.01} placeholder="0.00"
                    value={ep.zeroHeightCm??0} onChange={setN("zeroHeightCm")}/>
                  <span style={INUNIT}>CM</span>
                </div>
              </div>
              <div>
                <div style={LBL}>ZERO OFFSET</div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.01} placeholder="0.00"
                    value={ep.zeroOffsetCm??0} onChange={setN("zeroOffsetCm")}/>
                  <span style={INUNIT}>CM</span>
                </div>
              </div>
            </div>
            {/* Impact preview */}
            <div style={{background:"rgba(0,0,0,.3)",border:"1px solid rgba(255,255,255,.08)",borderRadius:6,
              padding:12,marginBottom:12,display:"flex",gap:16,alignItems:"center"}}>
              <div style={{width:90,height:90,position:"relative",flexShrink:0}}>
                <svg width="90" height="90" viewBox="0 0 90 90">
                  <circle cx="45" cy="45" r="42" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
                  <circle cx="45" cy="45" r="28" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="1" strokeDasharray="4,4"/>
                  <line x1="45" y1="3" x2="45" y2="87" stroke="rgba(255,255,255,.2)" strokeWidth="1"/>
                  <line x1="3" y1="45" x2="87" y2="45" stroke="rgba(255,255,255,.2)" strokeWidth="1"/>
                  {/* punto impatto */}
                  <circle cx={45+(ep.zeroOffsetCm??0)*6} cy={45-(ep.zeroHeightCm??0)*6}
                    r="5" fill={RED} stroke="none"/>
                </svg>
              </div>
              <div style={{fontSize:9,color:"rgba(255,255,255,.45)",lineHeight:1.7,fontFamily:"'IBM Plex Mono',monospace"}}>
                <div>{(ep.zeroHeightCm??0)===0?"Height centered":`H: ${ep.zeroHeightCm>0?"Up":"Down"} ${Math.abs(ep.zeroHeightCm??0).toFixed(2)} CM`}</div>
                <div>{(ep.zeroOffsetCm??0)===0?"Offset centered":`W: ${ep.zeroOffsetCm>0?"Right":"Left"} ${Math.abs(ep.zeroOffsetCm??0).toFixed(2)} CM`}</div>
                <div style={{marginTop:4,color:"rgba(255,255,255,.25)"}}>Preview ±5.00 CM</div>
              </div>
            </div>
            {/* SSF */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <div style={LBL}>SSF ELEVATION</div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.001} placeholder="1.000"
                    value={ep.ssfElevation??1.0} onChange={setN("ssfElevation")}/>
                </div>
              </div>
              <div>
                <div style={LBL}>SSF WINDAGE</div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.001} placeholder="1.000"
                    value={ep.ssfWindage??1.0} onChange={setN("ssfWindage")}/>
                </div>
              </div>
            </div>
          </div>

          {/* ── MV-Temp Table ── */}
          <div style={CARD}>
            <div style={{...HDR,marginBottom:12}}>
              <span>MV-TEMP TABLE</span>
              <Toggle val={ep.useMvTempTable}
                onChange={()=>setEditingProfile(p=>({...p,useMvTempTable:!p.useMvTempTable}))}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:8,
              marginBottom:8,fontSize:9,color:"rgba(0,212,255,.5)",fontFamily:"'IBM Plex Mono',monospace",
              letterSpacing:".08em",padding:"0 2px"}}>
              <div>TEMPERATURA</div><div>VELOCITÀ</div><div/>
            </div>
            {(ep.mvTempTable||[]).map(row=>(
              <div key={row.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:8,marginBottom:8}}>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={1} value={row.temp}
                    onChange={e=>setEditingProfile(p=>({...p,mvTempTable:p.mvTempTable.map(r=>r.id===row.id?{...r,temp:+e.target.value}:r)}))}/>
                  <span style={INUNIT}>°C</span>
                </div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.1} value={row.mv}
                    onChange={e=>setEditingProfile(p=>({...p,mvTempTable:p.mvTempTable.map(r=>r.id===row.id?{...r,mv:+e.target.value}:r)}))}/>
                  <span style={INUNIT}>M/S</span>
                </div>
                <button onClick={()=>setEditingProfile(p=>({...p,mvTempTable:p.mvTempTable.filter(r=>r.id!==row.id)}))}
                  style={{background:"rgba(255,51,68,.1)",border:"1px solid rgba(255,51,68,.25)",borderRadius:4,
                    color:RED,cursor:"pointer",width:36,minHeight:44,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
                  ×
                </button>
              </div>
            ))}
            <button onClick={()=>setEditingProfile(p=>({...p,mvTempTable:[...(p.mvTempTable||[]),{id:Date.now(),temp:15,mv:p.mvMs||320}]}))}
              style={{width:"100%",padding:"11px",background:"transparent",
                border:"1px dashed rgba(0,212,255,.25)",borderRadius:6,color:CYN,
                fontFamily:"'IBM Plex Mono',monospace",fontSize:11,cursor:"pointer",
                letterSpacing:".08em",minHeight:44}}>
              + AGGIUNGI TEMPERATURA / VELOCITÀ
            </button>
          </div>

          {/* ── Drop Scale Factor Table ── */}
          <div style={CARD}>
            <div style={HDR}><span>DROP SCALE FACTOR TABLE</span></div>
            {(ep.dropScaleTable||[]).map(row=>(
              <div key={row.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:8,marginBottom:8}}>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={25} value={row.dist}
                    onChange={e=>setEditingProfile(p=>({...p,dropScaleTable:p.dropScaleTable.map(r=>r.id===row.id?{...r,dist:+e.target.value}:r)}))}/>
                  <span style={INUNIT}>M</span>
                </div>
                <div style={INROW}>
                  <input style={INFIELD} type="number" step={.001} value={row.factor}
                    onChange={e=>setEditingProfile(p=>({...p,dropScaleTable:p.dropScaleTable.map(r=>r.id===row.id?{...r,factor:+e.target.value}:r)}))}/>
                </div>
                <button onClick={()=>setEditingProfile(p=>({...p,dropScaleTable:p.dropScaleTable.filter(r=>r.id!==row.id)}))}
                  style={{background:"rgba(255,51,68,.1)",border:"1px solid rgba(255,51,68,.25)",borderRadius:4,
                    color:RED,cursor:"pointer",width:36,minHeight:44,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
                  ×
                </button>
              </div>
            ))}
            {(ep.dropScaleTable||[]).length===0&&(
              <div style={{textAlign:"center",padding:"16px 0",fontSize:9,color:"rgba(255,255,255,.2)",
                fontFamily:"'IBM Plex Mono',monospace"}}>Nessun fattore correttivo impostato</div>
            )}
            <button onClick={()=>setEditingProfile(p=>({...p,dropScaleTable:[...(p.dropScaleTable||[]),{id:Date.now(),dist:100,factor:1.000}]}))}
              style={{width:"100%",padding:"11px",background:"transparent",
                border:"1px dashed rgba(0,212,255,.25)",borderRadius:6,color:CYN,
                fontFamily:"'IBM Plex Mono',monospace",fontSize:11,cursor:"pointer",
                letterSpacing:".08em",minHeight:44}}>
              + AGGIUNGI FATTORE
            </button>
          </div>

          {/* ── Truing Points ── */}
          <div style={CARD}>
            <div style={HDR}>
              <span>TRUING</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:8,color:"rgba(204,68,255,.5)"}}>Usa drag factor</span>
                <div className="toggle-wrap" onClick={()=>setEditingProfile(p=>({...p,useTruing:!p.useTruing}))}>
                  <div className={`toggle-bg${ep.useTruing?" on":""}`}><div className="toggle-knob"/></div>
                </div>
              </div>
            </div>
            {ep.useTruing&&(
              <div style={{marginBottom:10,padding:"8px 10px",background:"rgba(204,68,255,.06)",
                border:"1px solid rgba(204,68,255,.2)",borderRadius:6}}>
                <div style={{fontSize:8,color:"rgba(204,68,255,.5)",marginBottom:4}}>DRAG FACTOR</div>
                <input type="number" step="0.001" min="0.5" max="2.0" style={{...IN,fontSize:14}}
                  value={ep.customDragFactor??1.0}
                  onChange={e=>setEditingProfile(p=>({...p,customDragFactor:+e.target.value}))}/>
                <div style={{fontSize:7,color:"rgba(204,68,255,.4)",marginTop:4}}>
                  1.000 = nessuna correzione · &gt;1 = più caduta · &lt;1 = meno caduta<br/>
                  Usa il pannello TRUING (home) per calcolarlo automaticamente.
                </div>
              </div>
            )}
            <div style={{fontSize:8,color:"rgba(204,68,255,.45)",marginBottom:8}}>
              Inserisci le correzioni REALI misurate sul campo per ogni distanza ({unit==="MOA"?"MOA":"mrad"})
            </div>
            {/* Header tabella */}
            {(ep.truingPoints||[]).length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"52px 1fr 1fr 28px",gap:4,marginBottom:4}}>
                {["DIST","ALZO MIS.","DATA",""].map(h=>(
                  <div key={h} style={{fontSize:6,color:"rgba(204,68,255,.4)",letterSpacing:".08em"}}>{h}</div>
                ))}
              </div>
            )}
            {(ep.truingPoints||[]).map(row=>(
              <div key={row.id} style={{display:"grid",gridTemplateColumns:"52px 1fr 1fr 28px",gap:4,marginBottom:6}}>
                <input type="number" style={{...IN,textAlign:"center"}} placeholder="m"
                  value={row.dist||""}
                  onChange={e=>setEditingProfile(p=>({...p,truingPoints:p.truingPoints.map(r=>r.id===row.id?{...r,dist:+e.target.value}:r)}))}/>
                <input type="number" step="0.001" style={{...IN,textAlign:"center"}} placeholder={unit==="MOA"?"MOA":"mrad"}
                  value={row.measuredMrad??""}
                  onChange={e=>setEditingProfile(p=>({...p,truingPoints:p.truingPoints.map(r=>r.id===row.id?{...r,measuredMrad:+e.target.value}:r)}))}/>
                <input type="date" style={{...IN,fontSize:10}}
                  value={row.date||""}
                  onChange={e=>setEditingProfile(p=>({...p,truingPoints:p.truingPoints.map(r=>r.id===row.id?{...r,date:e.target.value}:r)}))}/>
                <button style={{background:"transparent",border:"1px solid rgba(255,51,68,.3)",color:RED,
                  borderRadius:4,cursor:"pointer",fontSize:14,lineHeight:1}}
                  onClick={()=>setEditingProfile(p=>({...p,truingPoints:p.truingPoints.filter(r=>r.id!==row.id)}))}>×</button>
              </div>
            ))}
            {(ep.truingPoints||[]).length===0&&(
              <div style={{textAlign:"center",padding:"12px 0",color:"rgba(204,68,255,.25)",fontSize:8}}>
                Nessun punto inserito
              </div>
            )}
            <button style={{width:"100%",padding:"10px",background:"rgba(204,68,255,.08)",
              border:"1px solid rgba(204,68,255,.3)",color:PRP,fontFamily:"Orbitron,monospace",
              fontSize:9,letterSpacing:".1em",cursor:"pointer",borderRadius:4,marginTop:4}}
              onClick={()=>setEditingProfile(p=>({...p,truingPoints:[...(p.truingPoints||[]),
                {id:Date.now(),dist:100,measuredMrad:null,date:new Date().toISOString().slice(0,10),notes:""}]}))}>
              + AGGIUNGI PUNTO
            </button>
          </div>

          {/* ── Note ── */}
          <div style={CARD}>
            <div style={HDR}><span>NOTE</span></div>
            <textarea style={{...IN,resize:"vertical",minHeight:80}}
              rows={3} placeholder="cariche, condizioni, note gara..."
              value={ep.notes??""} onChange={set("notes")}/>
          </div>

          {/* ── Pulsanti ── */}
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
        )
      })()}

      {/* ═══ TAB SETUP ═══ */}
      {mainTab==="setup"&&(()=>{
        // Colori Setup — adattivi al tema corrente
        const SB = dk ? "rgba(0,212,255,.9)" : "#007AFF"
        const ST = T.text
        const SG = T.textDim
        const SF = dk ? "rgba(0,255,65,.04)" : "#F2F2F7"
        const SL={fontSize:12,color:SB,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:".05em",marginBottom:4,fontWeight:600}
        const SC={background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:dk?4:12,padding:"16px",marginBottom:12,
          boxShadow:dk?"none":"0 1px 3px rgba(0,0,0,.06)"}
        const SH={fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:ST,fontWeight:700,
          letterSpacing:".08em",marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${T.cardBorder}`}
        const SI={background:T.inputBg,border:`1px solid ${T.inputBorder}`,borderRadius:dk?4:10,
          color:T.inputText,fontFamily:"'IBM Plex Mono',monospace",fontSize:14,padding:"11px 14px",
          width:"100%",boxSizing:"border-box",minHeight:44,outline:"none"}
        const SR={display:"flex",alignItems:"center",background:T.inputBg,
          border:`1px solid ${T.inputBorder}`,borderRadius:dk?4:10,overflow:"hidden"}
        const SRF={...SI,border:"none",background:"transparent",flex:1}
        const SRU={fontSize:10,color:SG,fontFamily:"'IBM Plex Mono',monospace",
          padding:"0 12px",alignSelf:"stretch",display:"flex",alignItems:"center",
          borderLeft:`1px solid ${T.inputBorder}`,background:SF}
        const SToggle=({val,onChange,label})=>(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"12px 0",borderBottom:`1px solid ${T.cardBorder}`}}>
            <span style={{color:ST,fontSize:14,fontFamily:"'IBM Plex Mono',monospace"}}>{label}</span>
            <div onClick={onChange} style={{width:51,height:31,borderRadius:16,cursor:"pointer",
              position:"relative",background:val?(dk?"rgba(0,255,65,.35)":"#34C759"):(dk?"rgba(0,255,65,.08)":"rgba(120,120,128,.2)"),
              border:`1px solid ${val?(dk?"rgba(0,255,65,.5)":"transparent"):(dk?"rgba(0,255,65,.15)":"transparent")}`,
              transition:"background .2s",flexShrink:0}}>
              <div style={{position:"absolute",top:2,left:val?22:2,width:27,height:27,borderRadius:"50%",
                background:val?(dk?GRN:"#FFF"):(dk?"rgba(0,255,65,.6)":"#FFF"),transition:"left .2s",
                boxShadow:dk?"none":"0 2px 6px rgba(0,0,0,.25)"}}/>
            </div>
          </div>
        )
        const SBtn=({active,onClick,children,style={}})=>(
          <button onClick={onClick} style={{padding:"9px 18px",borderRadius:dk?4:20,cursor:"pointer",
            border:`2px solid ${active?T.accent:T.pillBorder}`,
            background:active?T.accent:"transparent",
            color:active?(dk?"#020c04":"#FFF"):SG,
            fontSize:13,fontFamily:"'IBM Plex Mono',monospace",fontWeight:active?700:400,...style}}>
            {children}
          </button>
        )
        return(
        <div style={{background:T.bg,margin:"-8px -12px",padding:"16px 12px",minHeight:"100%"}}>

          {/* ── Tema ── */}
          <div style={SC}>
            <div style={SH}>ASPETTO</div>
            <div style={{display:"flex",gap:10}}>
              {[["dark","DARK","#020c04"],["light","LIGHT","#F0F2F5"]].map(([val,label,bg])=>(
                <button key={val} onClick={()=>setTheme(val)}
                  style={{flex:1,padding:"16px 8px",borderRadius:dk?4:12,cursor:"pointer",
                    border:`2px solid ${theme===val?T.accent:T.cardBorder}`,
                    background:bg,display:"flex",flexDirection:"column",alignItems:"center",gap:8,
                    outline:"none",transition:"border-color .2s"}}>
                  {/* Mini preview */}
                  <div style={{width:52,height:36,borderRadius:6,background:bg,
                    border:"1px solid rgba(128,128,128,.2)",overflow:"hidden",position:"relative"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:10,
                      background:val==="dark"?"#030f05":"#FFFFFF",
                      borderBottom:`1px solid ${val==="dark"?grna(.15):"rgba(0,0,0,.08)"}`}}/>
                    <div style={{position:"absolute",top:12,left:4,right:4,height:6,borderRadius:2,
                      background:val==="dark"?grna(.15):"rgba(0,0,0,.06)"}}/>
                    <div style={{position:"absolute",top:20,left:4,right:4,height:6,borderRadius:2,
                      background:val==="dark"?grna(.08):"rgba(0,0,0,.04)"}}/>
                    <div style={{position:"absolute",bottom:0,left:0,right:0,height:9,
                      background:val==="dark"?"#020c04":"#FFFFFF",
                      borderTop:`1px solid ${val==="dark"?grna(.1):"rgba(0,0,0,.08)"}`}}/>
                    {theme===val&&(
                      <div style={{position:"absolute",top:2,right:3,width:6,height:6,borderRadius:"50%",
                        background:val==="dark"?GRN:"#007AFF"}}/>
                    )}
                  </div>
                  <span style={{fontSize:11,fontFamily:"Orbitron,monospace",
                    color:theme===val?(val==="dark"?GRN:"#007AFF"):(val==="dark"?"rgba(255,255,255,.5)":"rgba(0,0,0,.35)"),
                    fontWeight:theme===val?700:400,letterSpacing:".1em"}}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Munizione */}
          <div style={SC}>
            <div style={SH}>MUNIZIONE RAPIDA</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {Object.keys(AMMO_CATALOG).map(g=>(
                <SBtn key={g} active={ammoGroup===g}
                  onClick={()=>{setAmmoGroup(g);setAmmoKey(Object.keys(AMMO_CATALOG[g])[0])}}>
                  {g}
                </SBtn>
              ))}
            </div>
            <select style={{...SI,marginBottom:10}} value={ammoKey} onChange={e=>setAmmoKey(e.target.value)}>
              {Object.keys(AMMO_CATALOG[ammoGroup]).map(k=>(
                <option key={k} value={k}>{k} · BC G7:{AMMO_CATALOG[ammoGroup][k].bc_g7} · {AMMO_CATALOG[ammoGroup][k].mv}m/s</option>
              ))}
            </select>
            {ammoData&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {[["BC G7",ammoData.bc_g7],["MV",ammoData.mv+"m/s"],["PESO",ammoData.wGr+"gr"],["CAL.",ammoData.dMm+"mm"]].map(([l,v])=>(
                  <div key={l} style={{textAlign:"center",padding:"10px 4px",background:SF,borderRadius:8}}>
                    <div style={{fontSize:9,color:SB,fontFamily:"'IBM Plex Mono',monospace",marginBottom:4}}>{l}</div>
                    <div style={{fontSize:13,color:ST,fontFamily:"Orbitron,monospace",fontWeight:700}}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ottica */}
          <div style={SC}>
            <div style={SH}>OTTICA / MONTATURA</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div>
                <div style={SL}>ALTEZZA LINEA VISIVA</div>
                <div style={SR}>
                  <input style={SRF} type="number" step={.1} value={scopeH}
                    onChange={e=>setScopeH(+e.target.value)}/>
                  <span style={SRU}>CM</span>
                </div>
              </div>
              <div>
                <div style={SL}>ZERO</div>
                <div style={SR}>
                  <input style={SRF} type="number" step={5} value={zeroM}
                    onChange={e=>setZeroM(+e.target.value)}/>
                  <span style={SRU}>M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sistema unità */}
          <div style={SC}>
            <div style={SH}>SISTEMA</div>
            <div style={{marginBottom:12}}>
              <div style={{...SH,fontSize:11,marginBottom:8}}>UNITÀ DI MISURA</div>
              <div style={{display:"flex",gap:8}}>
                <SBtn active={units==="metric"} onClick={()=>setUnits("metric")} style={{flex:1}}>
                  METRICO (m · m/s · °C)
                </SBtn>
                <SBtn active={units==="imp"} onClick={()=>setUnits("imp")} style={{flex:1}}>
                  IMPERIALE (yd · fps · °F)
                </SBtn>
              </div>
            </div>
            <div>
              <div style={{...SH,fontSize:11,marginBottom:8}}>UNITÀ ANGOLARI</div>
              <div style={{display:"flex",gap:8}}>
                <SBtn active={unit==="MOA"} onClick={()=>setUnit("MOA")} style={{flex:1}}>MOA</SBtn>
                <SBtn active={unit==="MRAD"} onClick={()=>setUnit("MRAD")} style={{flex:1}}>MRAD</SBtn>
              </div>
            </div>
          </div>

          {/* Audio */}
          <div style={SC}>
            <div style={SH}>AUDIO</div>
            <SToggle val={audio.enabled} label="Audio attivo"
              onChange={()=>setAudio(a=>({...a,enabled:!a.enabled}))}/>
            {audio.enabled&&(
              <div style={{paddingTop:12,display:"flex",flexDirection:"column",gap:14}}>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{...SL,marginBottom:0}}>VOLUME</span>
                    <span style={{color:SB,fontSize:12,fontFamily:"Orbitron,monospace"}}>{Math.round(audio.volume*100)}%</span>
                  </div>
                  <input type="range" style={{width:"100%",accentColor:SB}} min={0} max={1} step={.05}
                    value={audio.volume} onChange={e=>setAudio(a=>({...a,volume:+e.target.value}))}/>
                </div>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{...SL,marginBottom:0}}>FREQUENZA BIP</span>
                    <span style={{color:SB,fontSize:12,fontFamily:"Orbitron,monospace"}}>{audio.beepFreq}Hz</span>
                  </div>
                  <input type="range" style={{width:"100%",accentColor:SB}} min={220} max={1760} step={110}
                    value={audio.beepFreq} onChange={e=>setAudio(a=>({...a,beepFreq:+e.target.value}))}/>
                </div>
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{...SL,marginBottom:0}}>DURATA BIP</span>
                    <span style={{color:SB,fontSize:12,fontFamily:"Orbitron,monospace"}}>{Math.round(audio.beepDur*1000)}ms</span>
                  </div>
                  <input type="range" style={{width:"100%",accentColor:SB}} min={.05} max={.5} step={.05}
                    value={audio.beepDur} onChange={e=>setAudio(a=>({...a,beepDur:+e.target.value}))}/>
                </div>
                <button onClick={()=>playBeep(audio.beepFreq,audio.beepDur,1)}
                  style={{padding:"11px",borderRadius:10,border:`1px solid ${SB}`,background:"transparent",
                    color:SB,fontFamily:"'IBM Plex Mono',monospace",fontSize:13,cursor:"pointer",minHeight:44}}>
                  ▶ TEST BIP
                </button>
              </div>
            )}
          </div>

          {/* Preset rapidi */}
          <div style={SC}>
            <div style={SH}>PRESET RAPIDI</div>
            {[
              {name:"Bergara B14 · XED · .22LR",ammo:".22LR Lapua SLR",grp:"RIMFIRE",h:6.5,z:50},
              {name:"Discovery XED · SK LR",      ammo:".22LR SK LR Match",grp:"RIMFIRE",h:6.5,z:50},
              {name:"6.5 CM PRS Open",             ammo:"6.5 CM 140gr Berger",grp:"CF PRS",h:4.5,z:100},
              {name:".308 Win Match",               ammo:".308 Win 175gr SMK",grp:"CF PRS",h:4.0,z:100},
              {name:".338 LM ELR",                  ammo:".338 LM 300gr Lapua",grp:"MAGNUM",h:5.5,z:100},
            ].map(p=>(
              <button key={p.name} onClick={()=>{setAmmoGroup(p.grp);setAmmoKey(p.ammo);setScopeH(p.h);setZeroM(p.z)}}
                style={{width:"100%",textAlign:"left",padding:"12px 14px",marginBottom:6,
                  background:SF,border:"none",borderRadius:10,cursor:"pointer",minHeight:44}}>
                <div style={{fontSize:13,color:ST,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600}}>{p.name}</div>
                <div style={{fontSize:10,color:SG,marginTop:3,fontFamily:"'IBM Plex Mono',monospace"}}>
                  {p.ammo} · h={p.h}cm · zero {p.z}m
                </div>
              </button>
            ))}
          </div>

          {/* Comandi vocali */}
          <div style={SC}>
            <div style={SH}>COMANDI VOCALI</div>
            <div style={{fontSize:11,color:SG,fontFamily:"'IBM Plex Mono',monospace",marginBottom:10}}>
              Dì "Vega" + comando, oppure parole rapide durante stage attivo
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {[["stage [N]","carica stage N dalla gara"],["go / inizia","avvia timer stage"],
                ["next / avanti","avanza bersaglio/colpo"],["colpo / fuoco","registra colpo"],
                ["alzo","legge alzo corrente"],["distanza [N]","imposta distanza"],
                ["millirad / MOA","cambia unità angolari"],["timer [N]","avvia timer"],
                ["stop","ferma timer"]].map(([c,d])=>(
                <div key={c} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",
                  borderBottom:`1px solid ${SF}`}}>
                  <span style={{color:SB,fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:700}}>{c}</span>
                  <span style={{color:SG,fontSize:11,fontFamily:"'IBM Plex Mono',monospace",textAlign:"right"}}>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info app */}
          <div style={{textAlign:"center",padding:"16px 0",color:SG,fontSize:10,
            fontFamily:"'IBM Plex Mono',monospace"}}>
            V·E·G·A v4 · Shooting Labs · Ballistics Engine G7/G1
          </div>
        </div>
        )
      })()}
    </div>

    {/* ═══ STATUS BAR ═══ */}
    <div style={{padding:"2px 12px",background:T.statusBg,
      borderTop:`1px solid ${T.navBorder}`,display:"flex",
      justifyContent:"space-between",alignItems:"center",flexShrink:0,fontSize:7}}>
      <span style={{color:T.textDim}}>V·E·G·A v4</span>
      <span className="orb" style={{color:dk?GRN:"#007AFF"}}>
        {ammoKey.split(" ").slice(0,2).join(" ")} · {dist}m → {sol?`${signU(sol.dropMoa)} ${unitLbl}`:"—"}
      </span>
      <span style={{color:T.textDim,display:"flex",gap:5}}>
        {bleConnected&&<span style={{color:CYN}}>◉BLE</span>}
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
