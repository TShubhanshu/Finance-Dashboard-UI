import { useState, useEffect, useRef, useMemo } from "react";

// ── CHART.JS via CDN (loaded once) ─────────────────────────────────────────
let chartJsLoaded = false;
function loadChartJs() {
  return new Promise((res) => {
    if (window.Chart) { res(); return; }
    if (chartJsLoaded) { const t = setInterval(() => { if (window.Chart) { clearInterval(t); res(); } }, 50); return; }
    chartJsLoaded = true;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload = res;
    document.head.appendChild(s);
  });
}

// ── GOOGLE FONTS ────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap";
fontLink.rel = "stylesheet";
if (!document.querySelector('link[href*="Syne"]')) document.head.appendChild(fontLink);

// ── GLOBAL STYLES ───────────────────────────────────────────────────────────
const style = document.createElement("style");
style.textContent = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#0b0c0e;font-family:'DM Sans',sans-serif;color:#eeeef0}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:#0b0c0e}
::-webkit-scrollbar-thumb{background:#2a2e36;border-radius:4px}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes toastIn{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes toastOut{from{transform:translateY(0);opacity:1}to{transform:translateY(60px);opacity:0}}
@keyframes ringFill{from{stroke-dashoffset:175.93}to{stroke-dashoffset:var(--target-offset)}}
`;
if (!document.querySelector("style[data-finio]")) {
  style.setAttribute("data-finio", "1");
  document.head.appendChild(style);
}

// ── DATA & CONSTANTS ────────────────────────────────────────────────────────
const STORAGE_KEY = "finio_v3";
const CAT_COLORS = {
  Food: "#f97066", Transport: "#4a90d9", Housing: "#9b8afb",
  Entertainment: "#f5a623", Health: "#34d399", Shopping: "#c8f135",
  Salary: "#5ccbff", Freelance: "#5cc0ff", Investment: "#34d399", Other: "#7c8290",
};
const CATEGORIES = ["Food","Transport","Housing","Entertainment","Health","Shopping","Salary","Freelance","Investment","Other"];
const DEFAULT_TXN = [
  {id:1,type:"income",desc:"Monthly Salary",cat:"Salary",amount:4200,date:"2025-06-01"},
  {id:2,type:"expense",desc:"Rent Payment",cat:"Housing",amount:1200,date:"2025-06-02"},
  {id:3,type:"expense",desc:"Grocery Store",cat:"Food",amount:148,date:"2025-06-03"},
  {id:4,type:"expense",desc:"Netflix",cat:"Entertainment",amount:18,date:"2025-06-04"},
  {id:5,type:"expense",desc:"Gym Membership",cat:"Health",amount:45,date:"2025-06-05"},
  {id:6,type:"income",desc:"Freelance Project",cat:"Freelance",amount:850,date:"2025-06-07"},
  {id:7,type:"expense",desc:"Uber Rides",cat:"Transport",amount:67,date:"2025-06-08"},
  {id:8,type:"expense",desc:"Restaurant",cat:"Food",amount:92,date:"2025-06-09"},
  {id:9,type:"expense",desc:"Amazon",cat:"Shopping",amount:134,date:"2025-06-10"},
  {id:10,type:"expense",desc:"Electric Bill",cat:"Housing",amount:88,date:"2025-06-12"},
  {id:11,type:"income",desc:"Dividend",cat:"Investment",amount:320,date:"2025-06-15"},
  {id:12,type:"expense",desc:"Coffee Shop",cat:"Food",amount:34,date:"2025-06-16"},
  {id:13,type:"expense",desc:"Movie Tickets",cat:"Entertainment",amount:28,date:"2025-06-18"},
  {id:14,type:"expense",desc:"Pharmacy",cat:"Health",amount:55,date:"2025-06-20"},
  {id:15,type:"expense",desc:"Fuel",cat:"Transport",amount:80,date:"2025-06-22"},
  {id:16,type:"income",desc:"Monthly Salary",cat:"Salary",amount:4200,date:"2025-05-01"},
  {id:17,type:"expense",desc:"Rent Payment",cat:"Housing",amount:1200,date:"2025-05-02"},
  {id:18,type:"expense",desc:"Grocery Store",cat:"Food",amount:162,date:"2025-05-05"},
  {id:19,type:"expense",desc:"Internet Bill",cat:"Housing",amount:60,date:"2025-05-08"},
  {id:20,type:"expense",desc:"Clothing",cat:"Shopping",amount:210,date:"2025-05-10"},
  {id:21,type:"income",desc:"Freelance Project",cat:"Freelance",amount:600,date:"2025-05-12"},
  {id:22,type:"expense",desc:"Doctor Visit",cat:"Health",amount:120,date:"2025-05-15"},
  {id:23,type:"expense",desc:"Spotify",cat:"Entertainment",amount:10,date:"2025-05-16"},
  {id:24,type:"expense",desc:"Bus Pass",cat:"Transport",amount:45,date:"2025-05-20"},
  {id:25,type:"income",desc:"Monthly Salary",cat:"Salary",amount:4200,date:"2025-04-01"},
  {id:26,type:"expense",desc:"Rent Payment",cat:"Housing",amount:1200,date:"2025-04-02"},
  {id:27,type:"expense",desc:"Grocery Store",cat:"Food",amount:175,date:"2025-04-06"},
  {id:28,type:"expense",desc:"Car Insurance",cat:"Transport",amount:145,date:"2025-04-10"},
  {id:29,type:"expense",desc:"Dining Out",cat:"Food",amount:98,date:"2025-04-14"},
  {id:30,type:"income",desc:"Bonus",cat:"Salary",amount:500,date:"2025-04-30"},
];

const fmt = (v) => "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nextId = (arr) => Math.max(0, ...arr.map((t) => t.id)) + 1;
const hexAlpha = (hex, a) => hex + a;

// ── STYLES OBJECT ────────────────────────────────────────────────────────────
const S = {
  shell: { display:"flex", minHeight:"100vh", background:"#0b0c0e" },
  sidebar: {
    width:220, minHeight:"100vh", background:"#111316", borderRight:"1px solid #1e2228",
    display:"flex", flexDirection:"column", padding:"24px 0", flexShrink:0,
    position:"sticky", top:0, height:"100vh", overflowY:"auto",
  },
  logo: { fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:"#c8f135", padding:"0 20px 28px", letterSpacing:"-0.5px" },
  logoSpan: { color:"#4a4f5a", fontWeight:400 },
  navLabel: { fontSize:10, fontWeight:500, color:"#3a3f4a", padding:"8px 20px 4px", letterSpacing:"0.08em", textTransform:"uppercase" },
  navItem: (active) => ({
    display:"flex", alignItems:"center", gap:10, padding:"9px 20px",
    cursor:"pointer", color: active ? "#c8f135" : "#7c8290",
    background: active ? "#1a2506" : "transparent",
    fontSize:13.5, fontWeight:400, fontFamily:"'DM Sans',sans-serif",
    border:"none", width:"100%", textAlign:"left",
    borderLeft: active ? "2px solid #c8f135" : "2px solid transparent",
    transition:"all 0.15s",
  }),
  navBadge: { marginLeft:"auto", background:"#c8f135", color:"#1a2c06", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:20, fontFamily:"'DM Mono',monospace" },
  sidebarFooter: { marginTop:"auto", padding:"16px 20px", borderTop:"1px solid #1e2228" },
  main: { flex:1, minWidth:0 },
  topbar: {
    display:"flex", alignItems:"center", gap:16, padding:"14px 28px",
    borderBottom:"1px solid #1e2228", background:"#0b0c0e",
    position:"sticky", top:0, zIndex:10,
  },
  pageTitle: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, flex:1, letterSpacing:"-0.3px" },
  searchWrap: { position:"relative" },
  searchInput: {
    background:"#131518", border:"1px solid #1e2228", color:"#eeeef0",
    fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:"7px 12px 7px 32px",
    borderRadius:8, width:200, outline:"none",
  },
  btnAccent: {
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"7px 16px", borderRadius:8, fontFamily:"'DM Sans',sans-serif",
    fontSize:13, fontWeight:600, cursor:"pointer", border:"none",
    background:"#c8f135", color:"#1a2c06", transition:"all 0.15s",
  },
  btnGhost: {
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"7px 14px", borderRadius:8, fontFamily:"'DM Sans',sans-serif",
    fontSize:13, fontWeight:400, cursor:"pointer",
    background:"#131518", color:"#7c8290", border:"1px solid #1e2228",
    transition:"all 0.15s",
  },
  btnDanger: {
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"5px 10px", borderRadius:6, fontFamily:"'DM Sans',sans-serif",
    fontSize:12, cursor:"pointer",
    background:"rgba(249,112,102,0.1)", color:"#f97066", border:"1px solid rgba(249,112,102,0.2)",
    transition:"all 0.15s",
  },
  roleBadge: (admin) => ({
    background: admin ? "#2a1d06" : "#0f1e35",
    color: admin ? "#f5a623" : "#4a90d9",
    fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20,
    border: admin ? "1px solid rgba(245,166,35,0.25)" : "1px solid rgba(74,144,217,0.25)",
    fontFamily:"'DM Mono',monospace",
  }),
  content: { padding:"24px 28px", maxWidth:1400 },
  card: { background:"#111316", border:"1px solid #1e2228", borderRadius:12, padding:20, marginBottom:0 },
  cardTitle: { fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:15, letterSpacing:"-0.2px", marginBottom:16 },
  summaryGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16, marginBottom:24 },
  summaryCard: (accent) => ({
    background:"#131518", border:"1px solid #1e2228", borderRadius:12, padding:20,
    position:"relative", overflow:"hidden", transition:"border-color 0.2s, transform 0.2s",
    borderTop:`2px solid ${accent}`,
  }),
  scLabel: { fontSize:11, color:"#7c8290", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8, fontWeight:500 },
  scValue: (color) => ({ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:26, letterSpacing:"-1px", lineHeight:1, marginBottom:8, color }),
  scChange: (up) => ({ fontSize:12, display:"flex", alignItems:"center", gap:4, color: up ? "#34d399" : "#f97066" }),
  twoCol: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 },
  threeCol: { display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginBottom:24 },
  filterRow: { display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" },
  filterBtn: (active) => ({
    background: active ? "#1a2506" : "#131518",
    border: active ? "1px solid rgba(200,241,53,0.35)" : "1px solid #1e2228",
    color: active ? "#c8f135" : "#7c8290",
    padding:"5px 14px", borderRadius:20, fontSize:12,
    cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.15s",
  }),
  table: { width:"100%", borderCollapse:"collapse" },
  th: { fontSize:11, color:"#3a3f4a", fontWeight:500, textAlign:"left", padding:"8px 12px", textTransform:"uppercase", letterSpacing:"0.07em", borderBottom:"1px solid #1e2228" },
  td: { padding:"11px 12px", borderBottom:"1px solid #1e2228", fontSize:13.5, verticalAlign:"middle" },
  catBadge: (cat) => ({
    display:"inline-block", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:500,
    background: hexAlpha(CAT_COLORS[cat] || "#7c8290","22"),
    color: CAT_COLORS[cat] || "#7c8290",
  }),
  txAmount: (type) => ({ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:500, color: type==="income" ? "#34d399" : "#f97066", textAlign:"right" }),
  insightCard: (color) => ({
    background:"#131518", border:"1px solid #1e2228", borderRadius:12, padding:20,
    borderTop:`3px solid ${color}`, position:"relative", overflow:"hidden",
  }),
  insightLabel: { fontSize:11, color:"#7c8290", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 },
  insightValue: (color) => ({ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:22, letterSpacing:"-0.5px", marginBottom:6, color }),
  // Add form styles
  addPanel: {
    background:"#0f1114", border:"1px solid #c8f13530", borderRadius:12,
    padding:24, marginBottom:20, animation:"fadeUp 0.25s ease",
  },
  addTitle: { fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:"#c8f135", marginBottom:20, letterSpacing:"-0.3px" },
  formGrid: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12, marginBottom:12, alignItems:"end" },
  formGroup: { display:"flex", flexDirection:"column", gap:5 },
  formLabel: { fontSize:11, color:"#7c8290", textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:500 },
  formInput: {
    background:"#1a1d22", border:"1px solid #2a2e36", color:"#eeeef0",
    fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:"8px 11px",
    borderRadius:8, outline:"none", width:"100%",
  },
  formSelect: {
    background:"#1a1d22", border:"1px solid #2a2e36", color:"#eeeef0",
    fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:"8px 11px",
    borderRadius:8, outline:"none", width:"100%", cursor:"pointer",
    appearance:"none", WebkitAppearance:"none",
  },
  roleSelect: {
    background:"#131518", border:"1px solid #1e2228", color:"#eeeef0",
    fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:"7px 10px",
    borderRadius:8, cursor:"pointer", outline:"none", width:"100%",
    appearance:"none", WebkitAppearance:"none",
  },
};

// ── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg, visible }) {
  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:300,
      background:"#111316", border:"1px solid #2a2e36", borderLeft:"3px solid #c8f135",
      color:"#eeeef0", padding:"11px 18px", borderRadius:8, fontSize:13,
      animation: visible ? "toastIn 0.3s ease forwards" : "toastOut 0.3s ease forwards",
      pointerEvents:"none",
    }}>
      {msg}
    </div>
  );
}

// ── CHART COMPONENT ──────────────────────────────────────────────────────────
function ChartCanvas({ id, buildConfig, height = 220 }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    loadChartJs().then(() => {
      if (cancelled || !ref.current) return;
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new window.Chart(ref.current, buildConfig());
    });
    return () => { cancelled = true; if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [buildConfig]);
  return <div style={{ position:"relative", width:"100%", height }}><canvas ref={ref} id={id} /></div>;
}

// ── SAVINGS RING ─────────────────────────────────────────────────────────────
function SavingsRing({ pct }) {
  const circ = 175.93;
  const offset = circ - (circ * Math.min(pct, 100) / 100);
  return (
    <svg width="72" height="72" viewBox="0 0 70 70" style={{ flexShrink:0 }}>
      <circle cx="35" cy="35" r="28" fill="none" stroke="#1a1d22" strokeWidth="7" />
      <circle cx="35" cy="35" r="28" fill="none" stroke="#c8f135" strokeWidth="7"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 35 35)"
        style={{ transition:"stroke-dashoffset 0.8s ease" }} />
      <text x="35" y="39" textAnchor="middle" fontFamily="'Syne',sans-serif" fontWeight="700" fontSize="13" fill="#c8f135">{pct}%</text>
    </svg>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
function Empty({ icon = "🔍", text = "Nothing here yet" }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 20px", color:"#4a4f5a" }}>
      <div style={{ fontSize:32, marginBottom:10 }}>{icon}</div>
      <div style={{ fontSize:14 }}>{text}</div>
    </div>
  );
}

// ── ADD TRANSACTION FORM (inline panel) ──────────────────────────────────────
function AddTransactionPanel({ onAdd, onCancel, editTx }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState(editTx ? { ...editTx, amount: String(editTx.amount) } : { type:"expense", amount:"", desc:"", cat:"Food", date:today });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = () => {
    const amount = parseFloat(form.amount);
    if (!amount || !form.desc.trim() || !form.date) return;
    onAdd({ ...form, amount, desc: form.desc.trim() });
  };
  return (
    <div style={S.addPanel}>
      <div style={S.addTitle}>{editTx ? "✎ Edit Transaction" : "+ New Transaction"}</div>
      <div style={{ ...S.formGrid, gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr" }}>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Type</label>
          <select style={S.formSelect} value={form.type} onChange={e => set("type", e.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Amount ($)</label>
          <input style={S.formInput} type="number" placeholder="0.00" min="0" step="0.01"
            value={form.amount} onChange={e => set("amount", e.target.value)} />
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Description</label>
          <input style={S.formInput} type="text" placeholder="e.g. Grocery run"
            value={form.desc} onChange={e => set("desc", e.target.value)} />
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Category</label>
          <select style={S.formSelect} value={form.cat} onChange={e => set("cat", e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={S.formGroup}>
          <label style={S.formLabel}>Date</label>
          <input style={S.formInput} type="date" value={form.date} onChange={e => set("date", e.target.value)} />
        </div>
      </div>
      <div style={{ display:"flex", gap:10, marginTop:4 }}>
        <button style={S.btnAccent} onClick={handleSubmit}>{editTx ? "Update" : "Add Transaction"}</button>
        <button style={S.btnGhost} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── DASHBOARD PAGE ────────────────────────────────────────────────────────────
function DashboardPage({ transactions }) {
  const [trendPeriod, setTrendPeriod] = useState("6m");
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0;
  const goalTarget = 5000;
  const goalPct = Math.min(100, Math.round(Math.max(0, balance) / goalTarget * 100));

  // DONUT DATA
  const expBycat = {};
  transactions.filter(t => t.type === "expense").forEach(t => { expBycat[t.cat] = (expBycat[t.cat] || 0) + t.amount; });
  const donutEntries = Object.entries(expBycat).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // TREND DATA
  const buildTrend = useMemo(() => () => {
    const months = trendPeriod === "1m" ? 1 : trendPeriod === "3m" ? 3 : 6;
    const labels = [], data = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(2025, 5 - i, 1);
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      labels.push(d.toLocaleString("default", { month: "short" }));
      const mTx = transactions.filter(t => t.date.startsWith(key));
      const mInc = mTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const mExp = mTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      data.push(mInc - mExp);
    }
    return { labels, data };
  }, [transactions, trendPeriod]);

  const trendConfig = useMemo(() => () => {
    const { labels, data } = buildTrend();
    return {
      type: "line",
      data: { labels, datasets: [{ label:"Balance", data, borderColor:"#c8f135", borderWidth:2, backgroundColor:"rgba(200,241,53,0.08)", fill:true, tension:0.4, pointRadius:4, pointBackgroundColor:"#c8f135", pointBorderColor:"#0b0c0e", pointBorderWidth:2 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{ backgroundColor:"#111316", titleColor:"#7c8290", bodyColor:"#eeeef0", borderColor:"#1e2228", borderWidth:1, callbacks:{label:c=>" "+fmt(c.raw)} } }, scales:{ x:{grid:{color:"rgba(255,255,255,0.04)"}, ticks:{color:"#7c8290",font:{size:11}}}, y:{grid:{color:"rgba(255,255,255,0.04)"}, ticks:{color:"#7c8290",font:{size:11},callback:v=>"$"+v.toLocaleString()}} } }
    };
  }, [buildTrend]);

  const donutConfig = useMemo(() => () => ({
    type: "doughnut",
    data: { labels: donutEntries.map(e => e[0]), datasets: [{ data: donutEntries.map(e => e[1]), backgroundColor: donutEntries.map(e => CAT_COLORS[e[0]] || "#7c8290"), borderColor:"#0b0c0e", borderWidth:3, hoverOffset:6 }] },
    options: { responsive:true, maintainAspectRatio:false, cutout:"68%", plugins:{ legend:{display:false}, tooltip:{ backgroundColor:"#111316", titleColor:"#7c8290", bodyColor:"#eeeef0", borderColor:"#1e2228", borderWidth:1, callbacks:{label:c=>` ${c.label}: ${fmt(c.raw)}`} } } }
  }), [donutEntries]);

  // CATEGORY BARS
  const catEntries = Object.entries(expBycat).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const catMax = catEntries[0]?.[1] || 1;

  // RECENT
  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  const cards = [
    { label:"Total Balance", value:fmt(balance), color:"#c8f135", change:"+5.2%", up:true },
    { label:"Total Income", value:fmt(income), color:"#34d399", change:"+3.8%", up:true },
    { label:"Total Expenses", value:fmt(expenses), color:"#f97066", change:"+2.1%", up:false },
    { label:"Savings Rate", value:savingsRate+"%", color:"#9b8afb", change:"+1.5%", up:true },
  ];

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      {/* SUMMARY CARDS */}
      <div style={S.summaryGrid}>
        {cards.map(c => (
          <div key={c.label} style={S.summaryCard(c.color)}>
            <div style={S.scLabel}>{c.label}</div>
            <div style={S.scValue(c.color)}>{c.value}</div>
            <div style={S.scChange(c.up)}>{c.up?"↑":"↓"} {c.change} <span style={{color:"#4a4f5a"}}>vs last month</span></div>
          </div>
        ))}
      </div>

      {/* CHARTS ROW */}
      <div style={S.twoCol}>
        <div style={S.card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={S.cardTitle}>Balance Trend</div>
            <div style={{ display:"flex", gap:6 }}>
              {["6m","3m","1m"].map(p => (
                <button key={p} style={S.filterBtn(trendPeriod===p)} onClick={() => setTrendPeriod(p)}>{p.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <ChartCanvas id="trend" buildConfig={trendConfig} height={220} />
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Spending Breakdown</div>
          <div style={{ position:"relative", height:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ChartCanvas id="donut" buildConfig={donutConfig} height={200} />
            <div style={{ position:"absolute", textAlign:"center", pointerEvents:"none" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:20, color:"#eeeef0", letterSpacing:"-1px" }}>{fmt(expenses)}</div>
              <div style={{ fontSize:11, color:"#7c8290" }}>expenses</div>
            </div>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:10 }}>
            {donutEntries.map(([cat]) => (
              <span key={cat} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#7c8290" }}>
                <span style={{ width:8, height:8, borderRadius:2, background:CAT_COLORS[cat]||"#7c8290", display:"inline-block" }} />
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div style={S.threeCol}>
        <div style={S.card}>
          <div style={S.cardTitle}>Recent Transactions</div>
          {recent.length === 0 ? <Empty text="No transactions yet" /> : recent.map(t => (
            <div key={t.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #1e2228" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:8, background: t.type==="income"?"#06251820":"#2a100e", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color: t.type==="income"?"#34d399":"#f97066" }}>
                  {t.type==="income"?"↑":"↓"}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{t.desc}</div>
                  <div style={{ fontSize:11, color:"#7c8290" }}>{t.cat} · {t.date}</div>
                </div>
              </div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color: t.type==="income"?"#34d399":"#f97066" }}>
                {t.type==="income"?"+":"-"}{fmt(t.amount)}
              </div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Top Categories</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {catEntries.map(([cat, amt]) => (
              <div key={cat}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:13 }}>{cat}</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#7c8290" }}>{fmt(amt)}</span>
                </div>
                <div style={{ height:5, background:"#1a1d22", borderRadius:20, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:20, background:CAT_COLORS[cat]||"#7c8290", width:`${(amt/catMax*100).toFixed(1)}%`, transition:"width 0.6s ease" }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:24 }}>
            <div style={S.cardTitle}>Savings Goal</div>
            <div style={{ display:"flex", alignItems:"center", gap:18, marginTop:12 }}>
              <SavingsRing pct={goalPct} />
              <div>
                <div style={{ fontSize:13, color:"#7c8290", marginBottom:4 }}>Target: $5,000</div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:18, color:"#c8f135" }}>{fmt(Math.min(Math.max(0,balance),goalTarget))} saved</div>
                <div style={{ fontSize:12, color:"#4a4f5a", marginTop:2 }}>{fmt(Math.max(0, goalTarget - Math.max(0, balance)))} remaining</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TRANSACTIONS PAGE ─────────────────────────────────────────────────────────
function TransactionsPage({ transactions, role, onAdd, onEdit, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date-desc");

  const filters = ["all","income","expense","Food","Transport","Housing","Entertainment","Health","Shopping"];

  const visible = useMemo(() => {
    let arr = [...transactions];
    if (filter === "income") arr = arr.filter(t => t.type === "income");
    else if (filter === "expense") arr = arr.filter(t => t.type === "expense");
    else if (filter !== "all") arr = arr.filter(t => t.cat === filter);
    if (search) arr = arr.filter(t => t.desc.toLowerCase().includes(search.toLowerCase()) || t.cat.toLowerCase().includes(search.toLowerCase()));
    if (sort === "date-desc") arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sort === "date-asc") arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (sort === "amount-desc") arr.sort((a, b) => b.amount - a.amount);
    else if (sort === "amount-asc") arr.sort((a, b) => a.amount - b.amount);
    return arr;
  }, [transactions, filter, search, sort]);

  const handleAdd = (data) => {
    if (editTx) { onEdit({ ...editTx, ...data }); setEditTx(null); }
    else onAdd(data);
    setShowForm(false);
  };
  const startEdit = (tx) => { setEditTx(tx); setShowForm(true); window.scrollTo({ top: 0, behavior:"smooth" }); };

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>

      {/* ADD / EDIT FORM PANEL */}
      {showForm && role === "admin" && (
        <AddTransactionPanel
          editTx={editTx}
          onAdd={handleAdd}
          onCancel={() => { setShowForm(false); setEditTx(null); }}
        />
      )}

      <div style={S.card}>
        {/* HEADER */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={S.cardTitle}>All Transactions <span style={{ fontSize:12, color:"#7c8290", fontWeight:400 }}>({transactions.length})</span></div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <select style={{ ...S.roleSelect, width:"auto" }} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="date-desc">Date ↓</option>
              <option value="date-asc">Date ↑</option>
              <option value="amount-desc">Amount ↓</option>
              <option value="amount-asc">Amount ↑</option>
            </select>
            {role === "admin" && (
              <button style={S.btnAccent} onClick={() => { setEditTx(null); setShowForm(s => !s); }}>
                {showForm ? "✕ Close" : "+ Add Transaction"}
              </button>
            )}
          </div>
        </div>

        {/* SEARCH + FILTERS */}
        <div style={S.filterRow}>
          <div style={{ position:"relative", marginRight:4 }}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#4a4f5a" }}>⌕</span>
            <input style={{ ...S.formInput, paddingLeft:28, width:180 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {filters.map(f => (
            <button key={f} style={S.filterBtn(filter===f)} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* TABLE */}
        {visible.length === 0 ? <Empty text="No transactions match your filter" /> : (
          <div style={{ overflowX:"auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Description</th>
                  <th style={S.th}>Category</th>
                  <th style={S.th}>Date</th>
                  <th style={{ ...S.th, textAlign:"right" }}>Amount</th>
                  {role === "admin" && <th style={{ ...S.th, textAlign:"right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {visible.map(t => (
                  <tr key={t.id} style={{ transition:"background 0.1s" }}
                    onMouseEnter={e => Array.from(e.currentTarget.querySelectorAll("td")).forEach(td => td.style.background="#131518")}
                    onMouseLeave={e => Array.from(e.currentTarget.querySelectorAll("td")).forEach(td => td.style.background="")}>
                    <td style={S.td}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background: t.type==="income"?"#34d399":"#f97066", display:"inline-block", flexShrink:0 }} />
                        {t.desc}
                      </div>
                    </td>
                    <td style={S.td}><span style={S.catBadge(t.cat)}>{t.cat}</span></td>
                    <td style={{ ...S.td, fontFamily:"'DM Mono',monospace", fontSize:12, color:"#7c8290" }}>{t.date}</td>
                    <td style={S.txAmount(t.type)}>{t.type==="income"?"+":"-"}{fmt(t.amount)}</td>
                    {role === "admin" && (
                      <td style={{ ...S.td, textAlign:"right" }}>
                        <button style={{ ...S.btnGhost, padding:"4px 10px", fontSize:12, marginRight:6 }} onClick={() => startEdit(t)}>Edit</button>
                        <button style={S.btnDanger} onClick={() => onDelete(t.id)}>Del</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── INSIGHTS PAGE ─────────────────────────────────────────────────────────────
function InsightsPage({ transactions }) {
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const expBycat = {};
  transactions.filter(t => t.type === "expense").forEach(t => { expBycat[t.cat] = (expBycat[t.cat] || 0) + t.amount; });
  const incBycat = {};
  transactions.filter(t => t.type === "income").forEach(t => { incBycat[t.cat] = (incBycat[t.cat] || 0) + t.amount; });
  const topExp = Object.entries(expBycat).sort((a,b)=>b[1]-a[1])[0];
  const topInc = Object.entries(incBycat).sort((a,b)=>b[1]-a[1])[0];
  const avg = transactions.length ? transactions.reduce((s,t)=>s+t.amount,0)/transactions.length : 0;

  const months = ["2025-04","2025-05","2025-06"];
  const mLabels = ["Apr","May","Jun"];
  const mInc = months.map(m => transactions.filter(t=>t.date.startsWith(m)&&t.type==="income").reduce((s,t)=>s+t.amount,0));
  const mExp = months.map(m => transactions.filter(t=>t.date.startsWith(m)&&t.type==="expense").reduce((s,t)=>s+t.amount,0));
  const mExpMax = Math.max(...mExp, 1);

  const incExpConfig = useMemo(() => () => ({
    type:"bar",
    data:{labels:mLabels, datasets:[
      {label:"Income", data:mInc, backgroundColor:"#34d399", borderRadius:4},
      {label:"Expenses", data:mExp, backgroundColor:"#f97066", borderRadius:4},
    ]},
    options:{responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}, tooltip:{backgroundColor:"#111316",titleColor:"#7c8290",bodyColor:"#eeeef0",borderColor:"#1e2228",borderWidth:1,callbacks:{label:c=>` ${c.dataset.label}: ${fmt(c.raw)}`}}},
      scales:{x:{grid:{color:"rgba(255,255,255,0.04)"},ticks:{color:"#7c8290",font:{size:11}}},y:{grid:{color:"rgba(255,255,255,0.04)"},ticks:{color:"#7c8290",font:{size:11},callback:v=>"$"+v.toLocaleString()}}}
    }
  }), [transactions]);

  // Heatmap
  const dayTotals = new Array(7).fill(0);
  transactions.filter(t=>t.type==="expense").forEach(t => { dayTotals[(new Date(t.date).getDay()+6)%7] += t.amount; });
  const dayMax = Math.max(...dayTotals, 1);
  const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const insights = [
    { label:"Highest Spending", value: topExp?.[0]||"—", sub: topExp?fmt(topExp[1])+" spent":"No expenses", color:"#f97066" },
    { label:"Top Income Source", value: topInc?.[0]||"—", sub: topInc?fmt(topInc[1])+" earned":"No income", color:"#34d399" },
    { label:"Net Cash Flow", value: fmt(income-expenses), sub: income>expenses?"Positive flow":"Negative flow", color:"#9b8afb" },
    { label:"Avg. Transaction", value: fmt(avg), sub: transactions.length+" transactions total", color:"#f5a623" },
  ];

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginBottom:24 }}>
        {insights.map(ins => (
          <div key={ins.label} style={S.insightCard(ins.color)}>
            <div style={S.insightLabel}>{ins.label}</div>
            <div style={S.insightValue(ins.color)}>{ins.value}</div>
            <div style={{ fontSize:13, color:"#7c8290" }}>{ins.sub}</div>
          </div>
        ))}
      </div>

      <div style={S.twoCol}>
        <div style={S.card}>
          <div style={S.cardTitle}>Monthly Expenses Comparison</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {months.map((m, i) => (
              <div key={m} style={{ display:"grid", gridTemplateColumns:"60px 1fr 90px", alignItems:"center", gap:12 }}>
                <div style={{ fontSize:12, color:"#7c8290", textAlign:"right" }}>{mLabels[i]}</div>
                <div style={{ height:8, background:"#1a1d22", borderRadius:20, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:20, background:"#f97066", width:`${(mExp[i]/mExpMax*100).toFixed(1)}%`, transition:"width 0.6s ease" }} />
                </div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:"#7c8290", textAlign:"right" }}>{fmt(mExp[i])}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Income vs Expenses</div>
          <ChartCanvas id="incexp" buildConfig={incExpConfig} height={200} />
          <div style={{ display:"flex", gap:16, marginTop:12 }}>
            <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#7c8290" }}><span style={{ width:10, height:10, borderRadius:2, background:"#34d399", display:"inline-block" }}/>Income</span>
            <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#7c8290" }}><span style={{ width:10, height:10, borderRadius:2, background:"#f97066", display:"inline-block" }}/>Expenses</span>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Spending Heatmap — Day of Week</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:10, marginTop:12 }}>
          {dayTotals.map((v, i) => {
            const intensity = v / dayMax;
            return (
              <div key={i} title={`${dayNames[i]}: ${fmt(v)}`} style={{
                aspectRatio:"1", borderRadius:8,
                background:`rgba(200,241,53,${(intensity*0.7+0.07).toFixed(2)})`,
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                gap:3,
              }}>
                <div style={{ fontSize:10, color: intensity>0.35?"#1a2c06":"#7c8290", fontWeight:500 }}>{dayNames[i]}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color: intensity>0.35?"#1a2c06":"#4a4f5a" }}>{fmt(v).replace("$","$")}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || DEFAULT_TXN);
  const [page, setPage] = useState("dashboard");
  const [role, setRole] = useState("admin");
  const [toast, setToast] = useState({ msg:"", visible:false });
  const [search, setSearch] = useState("");
  const toastTimer = useRef(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); }, [transactions]);

  const showToast = (msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, visible:true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible:false })), 2800);
  };

  const addTx = (data) => {
    setTransactions(prev => [...prev, { ...data, id: nextId(prev) }]);
    showToast("✓ Transaction added");
  };
  const editTx = (updated) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    showToast("✓ Transaction updated");
  };
  const deleteTx = (id) => {
    if (!confirm("Delete this transaction?")) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    showToast("✗ Transaction deleted");
  };
  const exportCsv = () => {
    const rows = ["ID,Type,Description,Category,Amount,Date", ...transactions.map(t=>`${t.id},${t.type},"${t.desc}",${t.cat},${t.amount},${t.date}`)].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows],{type:"text/csv"})); a.download="finio.csv"; a.click();
    showToast("✓ Exported CSV");
  };
  const exportJson = () => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(transactions,null,2)],{type:"application/json"})); a.download="finio.json"; a.click();
    showToast("✓ Exported JSON");
  };

  const navItems = [
    { id:"dashboard", label:"Dashboard", icon:"⊞" },
    { id:"transactions", label:"Transactions", icon:"≡" },
    { id:"insights", label:"Insights", icon:"↗" },
  ];

  const handleGlobalSearch = (v) => { setSearch(v); setPage("transactions"); };

  return (
    <div style={S.shell}>
      {/* SIDEBAR */}
      <aside style={S.sidebar}>
        <div style={S.logo}>finio<span style={S.logoSpan}>.</span></div>
        <div style={{ fontSize:10, color:"#3a3f4a", padding:"0 20px 12px", letterSpacing:"0.08em", textTransform:"uppercase" }}>Menu</div>
        {navItems.map(n => (
          <button key={n.id} style={S.navItem(page===n.id)} onClick={() => setPage(n.id)}>
            <span style={{ fontSize:14 }}>{n.icon}</span>
            {n.label}
            {n.id==="transactions" && <span style={S.navBadge}>{transactions.length}</span>}
          </button>
        ))}
        <div style={S.sidebarFooter}>
          <div style={{ fontSize:10, color:"#3a3f4a", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Role</div>
          <select style={S.roleSelect} value={role} onChange={e => { setRole(e.target.value); showToast(e.target.value==="admin"?"⚡ Admin mode":"👁 Viewer mode"); }}>
            <option value="viewer">👁 Viewer</option>
            <option value="admin">⚡ Admin</option>
          </select>
        </div>
      </aside>

      {/* MAIN */}
      <div style={S.main}>
        {/* TOPBAR */}
        <header style={S.topbar}>
          <div style={S.pageTitle}>{navItems.find(n=>n.id===page)?.label}</div>
          <div style={S.searchWrap}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#4a4f5a" }}>⌕</span>
            <input style={S.searchInput} placeholder="Search…" value={search} onChange={e => handleGlobalSearch(e.target.value)} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={S.roleBadge(role==="admin")}>{role.toUpperCase()}</span>
            {role === "admin" && <>
              <button style={S.btnGhost} onClick={exportCsv}>↓ CSV</button>
              <button style={S.btnGhost} onClick={exportJson}>↓ JSON</button>
            </>}
          </div>
        </header>

        {/* CONTENT */}
        <div style={S.content}>
          {page === "dashboard" && <DashboardPage transactions={transactions} />}
          {page === "transactions" && (
            <TransactionsPage
              transactions={transactions}
              role={role}
              onAdd={addTx}
              onEdit={editTx}
              onDelete={deleteTx}
            />
          )}
          {page === "insights" && <InsightsPage transactions={transactions} />}
        </div>
      </div>

      {/* TOAST */}
      {toast.visible && <Toast msg={toast.msg} visible={toast.visible} />}
    </div>
  );
}
