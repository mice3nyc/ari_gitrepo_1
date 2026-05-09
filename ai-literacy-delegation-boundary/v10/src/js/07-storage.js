// =====================================================
// 7. Storage (v0.2 보존, key만 v03)
// =====================================================
function saveGame(){localStorage.setItem(CONFIG.storageKey,JSON.stringify({state:gameState,at:new Date().toISOString()}));}
function loadGame(){try{var d=JSON.parse(localStorage.getItem(CONFIG.storageKey));return d?d.state:null;}catch(e){return null;}}
function clearGame(){localStorage.removeItem(CONFIG.storageKey);}
function hasSave(){return!!localStorage.getItem(CONFIG.storageKey);}
function getSid(){var s=sessionStorage.getItem(CONFIG.sessionIdKey);if(!s){s='s_'+Date.now()+'_'+Math.random().toString(36).slice(2);sessionStorage.setItem(CONFIG.sessionIdKey,s);}return s;}
function resetSid(){sessionStorage.removeItem(CONFIG.sessionIdKey);}

