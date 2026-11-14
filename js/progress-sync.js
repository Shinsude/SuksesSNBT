(() => {
  const KEY="snbt-progress-history", OWNER_KEY="snbt-progress-owner";
  const db=()=>window.snbtSupabase||null;
  const makeId=()=>window.crypto&&window.crypto.randomUUID?window.crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==="x"?r:(r&3|8)).toString(16);});
  function readLocal(){try{const value=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(value)?value.filter(item=>item&&Number.isFinite(Number(item.score))):[];}catch(_){return[];}}
  function writeLocal(items){try{localStorage.setItem(KEY,JSON.stringify(items.slice(0,50)));}catch(_){}}
  function ensureIds(items){let changed=false;items.forEach(item=>{if(!item.clientId){item.clientId=makeId();changed=true;}});if(changed)writeLocal(items);return items;}
  function toRow(item,userId){return{user_id:userId,client_id:item.clientId,activity_type:item.type==="tryout"?"tryout":"latihan",label:String(item.label||"Aktivitas SNBT").slice(0,160),score:Math.max(0,Math.min(100,Math.round(Number(item.score)||0))),correct_count:Math.max(0,Number(item.correct)||0),wrong_count:Math.max(0,Number(item.wrong)||0),blank_count:Math.max(0,Number(item.blank)||0),total_count:Math.max(0,Number(item.total)||0),completed_at:item.completedAt||new Date().toISOString(),details:{}};}
  function fromRow(row){return{clientId:row.client_id,type:row.activity_type,label:row.label,score:row.score,correct:row.correct_count,wrong:row.wrong_count,blank:row.blank_count,total:row.total_count,completedAt:row.completed_at};}
  async function sync(){
    const client=db();if(!client)return{synced:false,reason:"client-unavailable"};
    const sessionResult=await client.auth.getSession(),user=sessionResult.data&&sessionResult.data.session&&sessionResult.data.session.user;
    if(sessionResult.error||!user)return{synced:false,reason:"signed-out"};
    const previousOwner=localStorage.getItem(OWNER_KEY);
    // Do not upload another account's local history when a different person signs in on this browser.
    const local=previousOwner&&previousOwner!==user.id?[]:ensureIds(readLocal());
    if(local.length){const saved=await client.from("progress_entries").upsert(local.map(item=>toRow(item,user.id)),{onConflict:"user_id,client_id"});if(saved.error){window.dispatchEvent(new CustomEvent("snbt-sync-status",{detail:{state:"error",message:saved.error.message}}));return{synced:false,reason:saved.error.message};}}
    const result=await client.from("progress_entries").select("client_id,activity_type,label,score,correct_count,wrong_count,blank_count,total_count,completed_at").order("completed_at",{ascending:false}).limit(50);
    if(result.error){window.dispatchEvent(new CustomEvent("snbt-sync-status",{detail:{state:"error",message:result.error.message}}));return{synced:false,reason:result.error.message};}
    const merged=new Map();[...(result.data||[]).map(fromRow),...local].forEach(item=>{const key=item.clientId||[item.completedAt,item.type,item.label,item.score].join("|");if(!merged.has(key))merged.set(key,item);});
    const entries=[...merged.values()].sort((x,y)=>new Date(y.completedAt)-new Date(x.completedAt)).slice(0,50);
    writeLocal(entries);localStorage.setItem(OWNER_KEY,user.id);
    window.dispatchEvent(new CustomEvent("snbt-progress-updated"));window.dispatchEvent(new CustomEvent("snbt-sync-status",{detail:{state:"synced"}}));
    return{synced:true,count:entries.length};
  }
  async function save(entry){const items=ensureIds(readLocal()),existing=items.find(item=>item.completedAt===entry.completedAt&&item.type===entry.type&&item.label===entry.label&&Number(item.score)===Number(entry.score));if(existing)Object.assign(existing,entry);else items.unshift({...entry,clientId:makeId()});writeLocal(items);window.dispatchEvent(new CustomEvent("snbt-progress-updated"));return sync();}
  window.SNBTProgressSync={sync,save,readLocal};
  if(db())db().auth.onAuthStateChange((event,session)=>{if(session&&session.user)queueMicrotask(()=>sync());if(event==="SIGNED_OUT"){if(localStorage.getItem(OWNER_KEY))localStorage.removeItem(KEY);localStorage.removeItem(OWNER_KEY);window.dispatchEvent(new CustomEvent("snbt-progress-updated"));}});
})();
