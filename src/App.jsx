import { useState, useEffect, useRef, useCallback } from "react";

// ─── AUTH ─────────────────────────────────────────────────────────────────────

const AUTH_KEY = 'task-tracker-auth';

function b64urlDecode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(b64 + '='.repeat((4 - b64.length % 4) % 4));
}

function getStoredToken() {
  try {
    const token = localStorage.getItem(AUTH_KEY);
    if (!token) return null;
    if (token === 'dev') return token; // dev session — no expiry check needed locally
    const [payload] = token.split('.');
    if (!payload) return null;
    const { exp } = JSON.parse(b64urlDecode(payload));
    if (!exp || exp < Date.now()) { localStorage.removeItem(AUTH_KEY); return null; }
    return token;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

function authFetch(url, opts = {}) {
  const token = localStorage.getItem(AUTH_KEY) || '';
  return fetch(url, {
    ...opts,
    headers: { ...(opts.headers || {}), 'Authorization': `Bearer ${token}` },
  }).then(r => {
    if (r.status === 401) { localStorage.removeItem(AUTH_KEY); window.location.reload(); }
    return r;
  });
}

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      if (!import.meta.env.PROD) {
        // Dev mode: validate against VITE_AUTH_USER / VITE_AUTH_PASS in .env.local
        if (username === import.meta.env.VITE_AUTH_USER && password === import.meta.env.VITE_AUTH_PASS) {
          localStorage.setItem(AUTH_KEY, 'dev');
          onLogin('dev');
        } else {
          setError('Invalid username or password');
        }
        setLoading(false);
        return;
      }
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const { token } = await res.json();
        localStorage.setItem(AUTH_KEY, token);
        onLogin(token);
      } else {
        setError('Invalid username or password');
      }
    } catch {
      setError('Connection error — please try again');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F2FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', border: '1.5px solid #DDE3F0', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px #1a1f3614' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1f36' }}>Task Tracker</div>
          <div style={{ fontSize: 13, color: '#8892b0', marginTop: 4 }}>Sign in to continue</div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#8892b0', marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Username</label>
            <input
              autoFocus autoComplete="username" value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ background: '#F8F9FC', border: '1.5px solid #DDE3F0', borderRadius: 10, color: '#1a1f36', padding: '11px 14px', fontSize: 15, width: '100%', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#8892b0', marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'} autoComplete="current-password" value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ background: '#F8F9FC', border: '1.5px solid #DDE3F0', borderRadius: 10, color: '#1a1f36', padding: '11px 44px 11px 14px', fontSize: 15, width: '100%', outline: 'none', fontFamily: 'inherit' }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#8892b0', padding: 2 }}>
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && <div style={{ fontSize: 13, color: '#E53935', background: '#FFF0F0', border: '1px solid #FFC5C5', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ background: loading ? '#a5b4fc' : '#4361EE', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 4, boxShadow: '0 4px 14px #4361EE30' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const parseDate = (str) => { const d = new Date(str); d.setHours(0,0,0,0); return d; };
const daysUntil = (dateStr) => Math.ceil((parseDate(dateStr) - TODAY) / 86400000);
const formatDate = (str) => parseDate(str).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });

const CATEGORIES = ["All","Vehicle","Insurance","Mobile","OTT","Internet","Document","Recurring","Electricity","Water","Property Tax","Rent"];
const CATEGORY_ICONS = { Vehicle:"🚗", Insurance:"🛡️", Mobile:"📱", OTT:"🎬", Internet:"🌐", Document:"🪪", Recurring:"🔄", Electricity:"⚡", Water:"💧", "Property Tax":"🏠", Rent:"🔑" };
const getItemIcon = (item) => {
  if (item.label.toLowerCase().includes("fiber")) return "📡";
  return CATEGORY_ICONS[item.category] || "📋";
};

const nextRecurringDate = (dayOfMonth, snoozeUntil) => {
  const now = new Date(); now.setHours(0,0,0,0);
  let d = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
  if (d < now) d = new Date(now.getFullYear(), now.getMonth()+1, dayOfMonth);
  if (snoozeUntil) {
    const s = new Date(snoozeUntil); s.setHours(0,0,0,0);
    if (d < s) d = new Date(s.getFullYear(), s.getMonth(), dayOfMonth);
  }
  return d;
};

const urgencyColor = (days) => {
  if (days < 0)  return { bg:"#FFF0F0", border:"#FFC5C5", badge:"#E53935", badgeBg:"#FFEAEA" };
  if (days <= 30) return { bg:"#FFF5EC", border:"#FFD5A8", badge:"#E65100", badgeBg:"#FFE8D0" };
  if (days <= 90) return { bg:"#FFFBEC", border:"#FFE48A", badge:"#B45309", badgeBg:"#FFF6CC" };
  return { bg:"#F4F6FF", border:"#DDE3F5", badge:"#4361EE", badgeBg:"#E8ECFF" };
};

const inp = { background:"#F8F9FC", border:"1.5px solid #DDE3F0", borderRadius:10, color:"#1a1f36", padding:"11px 14px", fontSize:16, width:"100%", outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

const SWIPE_THRESHOLD = 80;

const LS_KEY = 'task-tracker-tasks';
const IS_DEV = !import.meta.env.PROD;

const local = {
  getAll: () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } },
  save: (tasks) => localStorage.setItem(LS_KEY, JSON.stringify(tasks)),
};

const api = IS_DEV
  ? {
      getAll: () => Promise.resolve(local.getAll()),
      create: (item) => { const tasks = local.getAll(); tasks.push(item); local.save(tasks); return Promise.resolve(item); },
      update: (item) => { local.save(local.getAll().map(t => t.id === item.id ? item : t)); return Promise.resolve(item); },
      remove: (id) => { local.save(local.getAll().filter(t => t.id !== id)); return Promise.resolve(); },
    }
  : {
      getAll: () => authFetch("/api/tasks").then((r) => r.json()),
      create: (item) => authFetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }).then((r) => r.json()),
      update: (item) => authFetch(`/api/tasks/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) }).then((r) => r.json()),
      remove: (id) => authFetch(`/api/tasks/${id}`, { method: "DELETE" }),
    };

function SwipeCard({ item, getDays, getDisplayDate, onEdit, onDelete, onDone, swipeable = false }) {
  const days = getDays(item);
  const u = urgencyColor(days);
  const isUrgent = days <= 90;
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(null);

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; setSwiping(true); };
  const onTouchMove = (e) => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx > 0) setOffsetX(Math.min(dx, 140));
  };
  const onTouchEnd = () => {
    setSwiping(false);
    if (offsetX >= SWIPE_THRESHOLD) onDone(item);
    setOffsetX(0);
    startX.current = null;
  };

  const rev = Math.min(offsetX / SWIPE_THRESHOLD, 1);

  return (
    <div style={{ position:"relative", borderRadius:14, overflow:"hidden" }}>
      {swipeable && (
        <div style={{ position:"absolute", inset:0, background:`rgba(46,125,50,${0.08 + rev*0.15})`, borderRadius:14, display:"flex", alignItems:"center", paddingLeft:20 }}>
          <span style={{ fontSize:22, opacity:rev }}>✅</span>
          <span style={{ marginLeft:8, fontWeight:700, fontSize:14, color:"#2E7D32", opacity:rev }}>Done</span>
        </div>
      )}
      <div
        onTouchStart={swipeable ? onTouchStart : undefined}
        onTouchMove={swipeable ? onTouchMove : undefined}
        onTouchEnd={swipeable ? onTouchEnd : undefined}
        style={{ background:"#fff", border:`1.5px solid ${isUrgent ? u.border : "#DDE3F0"}`, borderRadius:14, padding:"14px",
          display:"flex", flexDirection:"column", gap:10,
          transform:`translateX(${offsetX}px)`, transition:swiping?"none":"transform 0.25s cubic-bezier(.22,.68,0,1.2)", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"#F0F2FA", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
            {getItemIcon(item)}
          </div>
          <div style={{ fontWeight:700, fontSize:15, color:"#1a1f36", flex:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.label}</div>
          <button onClick={() => onEdit(item)} style={{ background:"#F0F2FA", border:"none", borderRadius:8, padding:"6px 8px", color:"#5a6480", cursor:"pointer", fontSize:14 }}>✏️</button>
          <button onClick={() => onDelete(item.id)} style={{ background:"#F0F2FA", border:"none", borderRadius:8, padding:"6px 8px", color:"#5a6480", cursor:"pointer", fontSize:14 }}>🗑️</button>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingLeft:46 }}>
          <div style={{ fontSize:12, color:"#8892b0" }}>
            {item.sub && <span style={{ marginRight:8 }}>{item.sub}</span>}
            <span style={{ fontFamily:"'JetBrains Mono',monospace" }}>{getDisplayDate(item)}</span>
          </div>
          <div style={{ background:u.badgeBg, color:u.badge, borderRadius:8, padding:"4px 10px", fontSize:12, fontWeight:700, fontFamily:"'JetBrains Mono',monospace", border:`1px solid ${u.border}`, flexShrink:0 }}>
            {days < 0 ? "EXPIRED" : days === 0 ? "TODAY" : item.recurring ? `in ${days}d` : `${days}d`}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddEditModal({ editId, form, setForm, errors, onSubmit, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#1a1f3688", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", border:"1.5px solid #DDE3F0", borderRadius:18, padding:28, width:"100%", maxWidth:460, boxShadow:"0 20px 60px #1a1f3620" }}>
        <div style={{ fontWeight:800, fontSize:20, marginBottom:20 }}>{editId ? "Edit Item" : "Add Item"}</div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ fontSize:12, color:"#8892b0", marginBottom:5, display:"block", textTransform:"uppercase", letterSpacing:0.8, fontWeight:600 }}>Label</label>
            <input style={{ ...inp, borderColor:errors.label?"#E53935":"#DDE3F0" }} placeholder="e.g. Car Insurance"
              value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            {errors.label && <div style={{ fontSize:12, color:"#E53935", marginTop:3 }}>{errors.label}</div>}
          </div>
          <div>
            <label style={{ fontSize:12, color:"#8892b0", marginBottom:5, display:"block", textTransform:"uppercase", letterSpacing:0.8, fontWeight:600 }}>Note (optional)</label>
            <input style={{ ...inp }} placeholder="e.g. WagonR"
              value={form.sub} onChange={e => setForm(f => ({ ...f, sub: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize:12, color:"#8892b0", marginBottom:5, display:"block", textTransform:"uppercase", letterSpacing:0.8, fontWeight:600 }}>Category</label>
            <select style={{ ...inp }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <input type="checkbox" id="rec" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} style={{ accentColor:"#4361EE", width:18, height:18 }} />
            <label htmlFor="rec" style={{ fontSize:15, color:"#5a6480", cursor:"pointer", fontWeight:500 }}>Recurring monthly</label>
          </div>
          {form.recurring ? (
            <div>
              <label style={{ fontSize:12, color:"#8892b0", marginBottom:5, display:"block", textTransform:"uppercase", letterSpacing:0.8, fontWeight:600 }}>Day of Month</label>
              <input style={{ ...inp, borderColor:errors.dayOfMonth?"#E53935":"#DDE3F0" }} type="number" min="1" max="31" placeholder="e.g. 16"
                value={form.dayOfMonth} onChange={e => setForm(f => ({ ...f, dayOfMonth: e.target.value }))} />
              {errors.dayOfMonth && <div style={{ fontSize:12, color:"#E53935", marginTop:3 }}>{errors.dayOfMonth}</div>}
            </div>
          ) : (
            <div>
              <label style={{ fontSize:12, color:"#8892b0", marginBottom:5, display:"block", textTransform:"uppercase", letterSpacing:0.8, fontWeight:600 }}>Expiry Date</label>
              <input type="date" style={{ ...inp, borderColor:errors.date?"#E53935":"#DDE3F0" }}
                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              {errors.date && <div style={{ fontSize:12, color:"#E53935", marginTop:3 }}>{errors.date}</div>}
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:10, marginTop:22 }}>
          <button onClick={onClose} style={{ flex:1, background:"#F0F2FA", border:"1.5px solid #DDE3F0", borderRadius:10, padding:"11px", color:"#5a6480", cursor:"pointer", fontFamily:"inherit", fontSize:15, fontWeight:600 }}>Cancel</button>
          <button onClick={onSubmit} style={{ flex:2, background:"#4361EE", border:"none", borderRadius:10, padding:"11px", color:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>{editId ? "Save Changes" : "Add Item"}</button>
        </div>
      </div>
    </div>
  );
}

function DoneModal({ doneModal, setDoneModal, onConfirm }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#1a1f3688", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", border:"1.5px solid #DDE3F0", borderRadius:18, padding:28, width:"100%", maxWidth:380, boxShadow:"0 20px 60px #1a1f3620" }}>
        <div style={{ fontWeight:800, fontSize:20, marginBottom:6 }}>✅ Mark as Done</div>
        <div style={{ fontSize:13, color:"#8892b0", marginBottom:18 }}>Set the next due date for this item.</div>
        <label style={{ fontSize:12, color:"#8892b0", marginBottom:5, display:"block", textTransform:"uppercase", letterSpacing:0.8, fontWeight:600 }}>Next Due Date</label>
        <input type="date" value={doneModal.nextDate} onChange={e => setDoneModal(d => ({ ...d, nextDate: e.target.value }))} style={{ ...inp, marginBottom:20 }} />
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => setDoneModal(null)} style={{ flex:1, background:"#F0F2FA", border:"1.5px solid #DDE3F0", borderRadius:10, padding:"11px", color:"#5a6480", cursor:"pointer", fontFamily:"inherit", fontSize:15, fontWeight:600 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, background:"#4361EE", border:"none", borderRadius:10, padding:"11px", color:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:15 }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function ExportModal({ items, onClose }) {
  const json = JSON.stringify(items, null, 2);

  const saveFile = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "task-tracker-export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyClipboard = () => {
    navigator.clipboard.writeText(json)
      .then(() => alert("Copied!"))
      .catch(() => { const ta = document.querySelector("#export-ta"); if (ta) { ta.select(); document.execCommand("copy"); alert("Copied!"); } });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#1a1f3688", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", border:"1.5px solid #DDE3F0", borderRadius:18, padding:28, width:"100%", maxWidth:500, boxShadow:"0 20px 60px #1a1f3620" }}>
        <div style={{ fontWeight:800, fontSize:20, marginBottom:6 }}>📤 Export Tasks</div>
        <div style={{ fontSize:13, color:"#8892b0", marginBottom:14 }}>Save as a file or copy the JSON below.</div>
        <textarea id="export-ta" readOnly value={json} onFocus={e => e.target.select()}
          style={{ width:"100%", height:220, fontFamily:"'JetBrains Mono',monospace", fontSize:12, background:"#F8F9FC", border:"1.5px solid #DDE3F0", borderRadius:10, padding:12, color:"#1a1f36", resize:"none", outline:"none" }} />
        <div style={{ display:"flex", gap:8, marginTop:14 }}>
          <button onClick={onClose} style={{ flex:1, background:"#F0F2FA", border:"1.5px solid #DDE3F0", borderRadius:10, padding:"11px", color:"#5a6480", cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:600 }}>Close</button>
          <button onClick={copyClipboard} style={{ flex:1, background:"#F0F2FA", border:"1.5px solid #4361EE", borderRadius:10, padding:"11px", color:"#4361EE", cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:700 }}>Copy</button>
          <button onClick={saveFile} style={{ flex:1, background:"#4361EE", border:"none", borderRadius:10, padding:"11px", color:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:14 }}>💾 Save File</button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ onClose, onImport }) {
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  const handleFile = () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = (ev) => { try { const p = JSON.parse(ev.target.result); if (Array.isArray(p)) onImport(p); else setImportError("Invalid format."); } catch { setImportError("Could not parse JSON."); } };
      r.readAsText(file);
    };
    input.click();
  };

  const handlePaste = () => {
    try { const p = JSON.parse(importText); if (Array.isArray(p)) onImport(p); else setImportError("Invalid format."); }
    catch { setImportError("Invalid JSON — check and try again."); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#1a1f3688", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", border:"1.5px solid #DDE3F0", borderRadius:18, padding:28, width:"100%", maxWidth:500, boxShadow:"0 20px 60px #1a1f3620" }}>
        <div style={{ fontWeight:800, fontSize:20, marginBottom:6 }}>📥 Import Tasks</div>
        <div style={{ fontSize:13, color:"#8892b0", marginBottom:16 }}>Paste JSON below or upload a file. Replaces all current tasks.</div>
        <textarea value={importText} onChange={e => { setImportText(e.target.value); setImportError(""); }} placeholder="Paste your exported JSON here..."
          style={{ width:"100%", height:200, fontFamily:"'JetBrains Mono',monospace", fontSize:12, background:"#F8F9FC", border:`1.5px solid ${importError ? "#E53935" : "#DDE3F0"}`, borderRadius:10, padding:12, color:"#1a1f36", resize:"none", outline:"none" }} />
        {importError && <div style={{ fontSize:12, color:"#E53935", marginTop:6 }}>⚠️ {importError}</div>}
        <div style={{ display:"flex", gap:8, marginTop:14 }}>
          <button onClick={onClose} style={{ flex:1, background:"#F0F2FA", border:"1.5px solid #DDE3F0", borderRadius:10, padding:"11px", color:"#5a6480", cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:600 }}>Cancel</button>
          <button onClick={handleFile} style={{ flex:1, background:"#F0F2FA", border:"1.5px solid #4361EE", borderRadius:10, padding:"11px", color:"#4361EE", cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:700 }}>Upload File</button>
          <button onClick={handlePaste} disabled={!importText.trim()}
            style={{ flex:1, background:importText.trim() ? "#4361EE" : "#c5cce8", border:"none", borderRadius:10, padding:"11px", color:"#fff", fontWeight:700, cursor:importText.trim() ? "pointer" : "default", fontFamily:"inherit", fontSize:14 }}>Import JSON</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [authToken, setAuthToken] = useState(() => getStoredToken());

  if (!authToken) {
    return <LoginPage onLogin={setAuthToken} />;
  }

  return <AuthenticatedApp onLogout={() => { localStorage.removeItem(AUTH_KEY); setAuthToken(null); }} />;
}

function AuthenticatedApp({ onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [doneModal, setDoneModal] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [form, setForm] = useState({ label:"", category:"Vehicle", sub:"", date:"", recurring:false, dayOfMonth:"" });
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("attention");

  useEffect(() => { api.getAll().then(setItems).finally(() => setLoading(false)); }, []);

  const getDays = useCallback((item) => {
    if (item.recurring) return Math.ceil((nextRecurringDate(item.dayOfMonth, item.snoozeUntil) - TODAY) / 86400000);
    return daysUntil(item.date);
  }, []);

  const getDisplayDate = useCallback((item) => {
    if (item.recurring) return nextRecurringDate(item.dayOfMonth, item.snoozeUntil).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
    return formatDate(item.date);
  }, []);

  const default365 = () => { const d = new Date(); d.setDate(d.getDate() + 365); return d.toISOString().split("T")[0]; };

  const handleDone = (item) => {
    if (item.recurring) {
      const next = nextRecurringDate(item.dayOfMonth, item.snoozeUntil);
      const advanced = new Date(next.getFullYear(), next.getMonth() + 1, item.dayOfMonth);
      const updated = { ...item, snoozeUntil: advanced.toISOString() };
      api.update(updated).then(() => setItems(prev => prev.map(i => i.id === item.id ? updated : i)));
    } else {
      setDoneModal({ id: item.id, nextDate: default365() });
    }
  };

  const confirmDone = () => {
    const updated = items.find(i => i.id === doneModal.id);
    if (!updated) return;
    const next = { ...updated, date: doneModal.nextDate };
    api.update(next).then(() => setItems(prev => prev.map(i => i.id === doneModal.id ? next : i)));
    setDoneModal(null);
  };

  const validate = () => {
    const e = {};
    if (!form.label.trim()) e.label = "Required";
    if (form.recurring) { if (!form.dayOfMonth || isNaN(form.dayOfMonth) || form.dayOfMonth < 1 || form.dayOfMonth > 31) e.dayOfMonth = "Enter day 1–31"; }
    else { if (!form.date) e.date = "Required"; }
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const entry = { id: editId || Date.now().toString(), label: form.label.trim(), category: form.category, sub: form.sub.trim(), date: form.recurring ? null : form.date, recurring: form.recurring, dayOfMonth: form.recurring ? Number(form.dayOfMonth) : undefined, createdAt: editId ? (items.find(i => i.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString() };
    if (editId) {
      api.update(entry).then(() => setItems(prev => prev.map(i => i.id === editId ? entry : i)));
    } else {
      api.create(entry).then(() => setItems(prev => [...prev, entry]));
    }
    closeForm();
  };

  const closeForm = () => { setShowAdd(false); setEditId(null); setForm({ label:"", category:"Vehicle", sub:"", date:"", recurring:false, dayOfMonth:"" }); setErrors({}); };

  const handleEdit = (item) => {
    setForm({ label:item.label, category:item.category, sub:item.sub||"", date:item.date||"", recurring:!!item.recurring, dayOfMonth:item.dayOfMonth||"" });
    setEditId(item.id); setShowAdd(true); setErrors({});
  };

  const sorted = [...items]
    .filter(i => activeCategory === "All" || i.category === activeCategory)
    .filter(i => i.label.toLowerCase().includes(search.toLowerCase()) || (i.sub||"").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => getDays(a) - getDays(b));

  const urgent = items.filter(i => !i.recurring && getDays(i) <= 30).sort((a, b) => getDays(a) - getDays(b));
  const counts = CATEGORIES.reduce((acc, cat) => { acc[cat] = cat === "All" ? items.length : items.filter(i => i.category === cat).length; return acc; }, {});

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#F0F2FA", display:"flex", alignItems:"center", justifyContent:"center", color:"#8892b0", fontSize:15, fontWeight:600 }}>
      Loading…
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#F0F2FA", color:"#1a1f36" }}>
      <div style={{ position:"sticky", top:0, zIndex:50, background:"#F0F2FA" }}>
        {/* ── Header ── */}
        <div style={{ background:"#fff", borderBottom:"1.5px solid #DDE3F0", padding:"16px 20px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:"#1a1f36" }}><span style={{ color:"#4361EE" }}>✅</span> Task Tracker</div>
            <div style={{ fontSize:12, color:"#8892b0" }}>Expiry & renewal tracker</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={onLogout} style={{ background:"none", border:"none", fontSize:12, color:"#8892b0", cursor:"pointer", fontFamily:"inherit", padding:"4px 2px", fontWeight:500 }}>Sign out</button>
            <div style={{ position:"relative" }}>
              <button onClick={() => setShowMenu(m => !m)} style={{ background:"#F0F2FA", border:"1.5px solid #DDE3F0", borderRadius:10, padding:"9px 13px", fontSize:17, cursor:"pointer" }}>⋮</button>
              {showMenu && <>
                <div style={{ position:"fixed", inset:0, zIndex:90 }} onClick={() => setShowMenu(false)} />
                <div style={{ position:"absolute", right:0, top:42, background:"#fff", border:"1.5px solid #DDE3F0", borderRadius:12, boxShadow:"0 8px 30px #1a1f3618", zIndex:100, minWidth:190, overflow:"hidden" }}>
                  {[
                    { icon:"📤", label:"Export tasks", action:() => { setShowExport(true); setShowMenu(false); } },
                    { icon:"📥", label:"Import tasks", action:() => { setShowImport(true); setShowMenu(false); } },
                    { icon:"🗑️", label:"Delete all tasks", action:() => { setShowClearConfirm(true); setShowMenu(false); }, danger:true },
                  ].map(({ icon, label, action, danger }) => (
                    <button key={label} onClick={action} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"13px 16px", background:"none", border:"none", cursor:"pointer", fontSize:14, fontWeight:600, color:danger?"#E53935":"#1a1f36", borderTop:danger?"1px solid #EEF0FA":"none" }}>
                      <span>{icon}</span>{label}
                    </button>
                  ))}
                </div>
              </>}
            </div>
          </div>
        </div>

        {/* ── Segmented tab control ── */}
        <div style={{ padding:"12px 16px" }}>
          <div style={{ display:"flex", gap:4, background:"#E2E6F5", borderRadius:12, padding:4 }}>
            {[
              { id:"attention", label:"Needs Attention", icon:"⚡", badge: urgent.length },
              { id:"all",       label:"All Reminders",   icon:"📋", badge: 0 },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="tab"
                style={{
                  flex:1, padding:"9px 8px", borderRadius:9, border:"none", cursor:"pointer", fontFamily:"inherit",
                  background: activeTab===tab.id ? "#fff" : "transparent",
                  color: activeTab===tab.id ? "#1a1f36" : "#8892b0",
                  fontWeight: activeTab===tab.id ? 700 : 500, fontSize:14,
                  boxShadow: activeTab===tab.id ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  transition:"all 0.15s",
                }}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span style={{ background:"#E53935", color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:11, fontWeight:700, lineHeight:"18px" }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:700, margin:"0 auto", padding:"20px 16px 100px" }}>
        {IS_DEV && (
          <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"8px 14px", marginBottom:14, fontSize:13, color:"#92400e", display:"flex", alignItems:"center", gap:6 }}>
            <span>🧪</span>
            <span>Dev mode — data saved to browser localStorage (not Postgres)</span>
          </div>
        )}

        {activeTab === "attention" && (
          <>
            {urgent.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"#8892b0" }}>
                <div style={{ fontSize:40, marginBottom:10 }}>🎉</div>
                <div style={{ fontWeight:700, fontSize:16, color:"#1a1f36", marginBottom:6 }}>All clear!</div>
                <div style={{ fontSize:13 }}>No items need attention right now.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize:12, color:"#8892b0", textAlign:"center", marginBottom:14 }}>👉 Swipe right to mark as done</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {urgent.map(item => (
                    <SwipeCard key={item.id} item={item} getDays={getDays} getDisplayDate={getDisplayDate} onEdit={handleEdit} onDelete={setDeleteId} onDone={handleDone} swipeable={true} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "all" && (
          <>
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              <div style={{ position:"relative", flex:1 }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#8892b0" }}>🔍</span>
                <input style={{ ...inp, paddingLeft:40, background:"#fff" }} placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select value={activeCategory} onChange={e => setActiveCategory(e.target.value)}
                style={{ ...inp, background:"#fff", width:"auto", flexShrink:0, fontWeight:600, color:"#5a6480" }}>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat !== "All" ? CATEGORY_ICONS[cat]+" " : ""}{cat} ({counts[cat]})</option>
                ))}
              </select>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {sorted.length === 0 && (
                <div style={{ textAlign:"center", padding:"60px 20px", color:"#8892b0" }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
                  <div style={{ fontWeight:600 }}>No items yet — tap + Add to get started</div>
                </div>
              )}
              {sorted.map((item, i) => (
                <div key={item.id} className="row" style={{ animationDelay:`${i*0.03}s` }}>
                  <SwipeCard item={item} getDays={getDays} getDisplayDate={getDisplayDate} onEdit={handleEdit} onDelete={setDeleteId} onDone={handleDone} swipeable={false} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => { setShowAdd(true); setEditId(null); setForm({ label:"", category:"Vehicle", sub:"", date:"", recurring:false, dayOfMonth:"" }); setErrors({}); }}
        style={{
          position:"fixed", bottom:24, right:20, zIndex:40,
          background:"#4361EE", color:"#fff", border:"none", borderRadius:16,
          padding:"15px 22px", fontWeight:700, fontSize:15, cursor:"pointer",
          boxShadow:"0 4px 20px #4361EE50",
          display:"flex", alignItems:"center", gap:6,
        }}
      >
        <span style={{ fontSize:20, lineHeight:1, marginTop:-1 }}>+</span>
        <span>Add</span>
      </button>

      {showAdd && <AddEditModal editId={editId} form={form} setForm={setForm} errors={errors} onSubmit={handleSubmit} onClose={closeForm} />}
      {doneModal && <DoneModal doneModal={doneModal} setDoneModal={setDoneModal} onConfirm={confirmDone} />}
      {showExport && <ExportModal items={items} onClose={() => setShowExport(false)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={(p) => {
        Promise.all([
          ...items.map(i => api.remove(i.id)),
          ...p.map(i => api.create({ ...i, createdAt: i.createdAt || new Date().toISOString() }))
        ]).then(() => setItems(p));
        setShowImport(false);
      }} />}

      {showClearConfirm && (
        <div style={{ position:"fixed", inset:0, background:"#1a1f3688", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"#fff", border:"1.5px solid #DDE3F0", borderRadius:18, padding:28, width:"100%", maxWidth:360, textAlign:"center", boxShadow:"0 20px 60px #1a1f3620" }}>
            <div style={{ fontSize:36, marginBottom:10 }}>⚠️</div>
            <div style={{ fontWeight:800, fontSize:20, marginBottom:8 }}>Delete All Tasks?</div>
            <div style={{ color:"#8892b0", fontSize:14, marginBottom:22 }}>Permanently removes all {items.length} items. Export first if you want a backup.</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowClearConfirm(false)} style={{ flex:1, background:"#F0F2FA", border:"1.5px solid #DDE3F0", borderRadius:10, padding:"11px", color:"#5a6480", cursor:"pointer", fontSize:15, fontWeight:600 }}>Cancel</button>
              <button onClick={() => { Promise.all(items.map(i => api.remove(i.id))).then(() => setItems([])); setShowClearConfirm(false); }} style={{ flex:1, background:"#E53935", border:"none", borderRadius:10, padding:"11px", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:15 }}>Delete All</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div style={{ position:"fixed", inset:0, background:"#1a1f3688", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:"#fff", border:"1.5px solid #DDE3F0", borderRadius:18, padding:28, width:"100%", maxWidth:360, textAlign:"center", boxShadow:"0 20px 60px #1a1f3620" }}>
            <div style={{ fontSize:36, marginBottom:10 }}>🗑️</div>
            <div style={{ fontWeight:800, fontSize:20, marginBottom:8 }}>Remove Item?</div>
            <div style={{ color:"#8892b0", fontSize:14, marginBottom:22 }}>This will permanently delete this reminder.</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex:1, background:"#F0F2FA", border:"1.5px solid #DDE3F0", borderRadius:10, padding:"11px", color:"#5a6480", cursor:"pointer", fontSize:15, fontWeight:600 }}>Cancel</button>
              <button onClick={() => { api.remove(deleteId).then(() => setItems(prev => prev.filter(i => i.id !== deleteId))); setDeleteId(null); }} style={{ flex:1, background:"#E53935", border:"none", borderRadius:10, padding:"11px", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:15 }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
