// ── Override dbSave untuk auto-backup ───────────────────────
// auto-backup terintegrasi di dbSave utama

// ─── CLOUD SYNC ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
//  FIREBASE REALTIME DATABASE — MULTI-DEVICE SYNC
//  Menggantikan Apps Script lama
// ═══════════════════════════════════════════════════════════════

// ── Konfigurasi Firebase ─────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCKWvOV4r7yHm6jq773cI72sY_3-hxXIoc",
  authDomain: "spbu-manager-efcd2.firebaseapp.com",
  databaseURL: "https://spbu-manager-efcd2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "spbu-manager-efcd2",
  storageBucket: "spbu-manager-efcd2.firebasestorage.app",
  messagingSenderId: "258028362337",
  appId: "1:258028362337:web:a142ff5b757d48508e2820"
};

// ── State Firebase ───────────────────────────────────────────
let _fbApp    = null;
let _fbDb     = null;
let _fbInited = false;
let _fbOnline = false;
let _fbListeners = {};  // tanggal → listener unsubscribe

// ── Inisialisasi Firebase ────────────────────────────────────
async function fbInit(){
  if(_fbInited && _fbDb) return true;
  try{
    if(!window.firebase){
      await Promise.all([
        loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js'),
      ]).then(()=>loadScript('https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'));
    }
    if(!window.firebase) throw new Error('SDK gagal dimuat');
    try{ _fbApp=firebase.app(); }
    catch(e){ _fbApp=firebase.initializeApp(FIREBASE_CONFIG); }
    _fbDb=firebase.database();
    // Test tulis kecil untuk verifikasi rules
    await _fbDb.ref(FB_ROOT+'/ping').set({t:Date.now(),v:'ok'});
    _fbInited=true; _fbOnline=true;
    setCloudStatus('active','● Terhubung');
    return true;
  }catch(err){
    console.error('Firebase init error:',err);
    // Jika error rules/permission — tampilkan pesan jelas
    if(err.message&&(err.message.includes('PERMISSION_DENIED')||err.message.includes('permission'))){
      setCloudStatus('error','✕ Rules Firebase perlu diperbarui');
      _showFirebaseRulesAlert();
    }else{
      setCloudStatus('error','✕ Offline — data tersimpan lokal');
    }
    return false;
  }
}

function _showFirebaseRulesAlert(){
  // Tampilkan banner sekali saja
  if(document.getElementById('fb-rules-alert')) return;
  const banner=document.createElement('div');
  banner.id='fb-rules-alert';
  banner.style.cssText='position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:9999;background:#fff;border:2px solid var(--red);border-radius:12px;padding:16px 20px;max-width:480px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.2);font-size:13px';
  banner.innerHTML=''
    +'<div style="font-weight:700;color:var(--red);margin-bottom:8px">⚠ Firebase Rules Perlu Diperbarui</div>'
    +'<div style="color:var(--text2);margin-bottom:12px;line-height:1.6">'
    +'Rules "test mode" sudah expired. Buka Firebase Console dan perbarui rules.<br>'
    +'<a href="https://console.firebase.google.com/project/spbu-manager-efcd2/database/spbu-manager-efcd2-default-rtdb/rules" '
    +'target="_blank" style="color:var(--blue);font-weight:600">→ Buka Firebase Rules</a>'
    +'</div>'
    +'<div style="background:var(--surface2);border-radius:8px;padding:10px;font-family:monospace;font-size:11px;margin-bottom:10px">'
    +'{"rules":{"spbu_v1":{".read":true,".write":true}}}'
    +'</div>'
    +'<button onclick="this.parentElement.remove()" style="background:var(--red);color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px">Tutup</button>';
  document.body.appendChild(banner);
}

function loadScript(src){
  return new Promise((resolve,reject)=>{
    if(document.querySelector('script[src="'+src+'"]')){resolve();return;}
    const s=document.createElement('script');
    s.src=src; s.onload=resolve; s.onerror=reject;
    document.head.appendChild(s);
  });
}

// ── Path helper ──────────────────────────────────────────────
function fbPath(path){ return _fbDb.ref(path); }
const FB_ROOT = 'spbu_v1';  // root node di Firebase
