/* Autenticação FC Gaia · Departamento Financeiro (Supabase) */
(function(){
var URL_='https://sarhofethszuqxjxbxvi.supabase.co',KEY='sb_publishable_WSbPV7z_nYM-rK1ju1aeYg_K5aEt3c8';
var sb=null,me=null,cb=null;
function $(s,r){return (r||document).querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function overlay(html){var o=$('#fcauth');if(!o){o=document.createElement('div');o.id='fcauth';document.body.appendChild(o)}o.innerHTML='<div class="fa-card"><div class="fa-logo">FG</div><h1>Departamento Financeiro</h1><p class="fa-sub">Gestão Financeira e de Fluxo de Caixa · FC Gaia</p>'+html+'</div>';o.hidden=false;return o}
function hide(){var o=$('#fcauth');if(o)o.hidden=true}
function msg(t,ok){var m=$('#fcauth .fa-msg');if(m){m.textContent=t||'';m.className='fa-msg'+(ok?' ok':'')}}
function showLogin(txt){
  overlay('<form id="fa-login" autocomplete="on"><label>Email<input type="email" name="email" autocomplete="username" required></label><label>Palavra-passe<input type="password" name="pw" autocomplete="current-password" required></label><button class="fa-btn" type="submit">Entrar</button><p class="fa-msg" role="alert">'+esc(txt||'')+'</p><p class="fa-hint">O acesso é só por convite. Se ainda não tens conta, pede à direção.</p></form>');
  $('#fa-login').onsubmit=async function(e){e.preventDefault();var f=e.target;msg('A entrar…',true);
    var r=await sb.auth.signInWithPassword({email:f.email.value.trim(),password:f.pw.value});
    if(r.error){msg(r.error.message==='Invalid login credentials'?'Email ou palavra-passe incorretos.':'Não foi possível entrar: '+r.error.message);return}
    await start()};
}
function showChange(){
  overlay('<form id="fa-ch"><p class="fa-hint" style="margin-top:0">Primeiro acesso: escolhe a tua palavra-passe pessoal.</p><label>Nova palavra-passe (mín. 10 caracteres)<input type="password" name="a" autocomplete="new-password" minlength="10" required></label><label>Repetir<input type="password" name="b" autocomplete="new-password" minlength="10" required></label><button class="fa-btn" type="submit">Guardar e entrar</button><p class="fa-msg" role="alert"></p></form>');
  $('#fa-ch').onsubmit=async function(e){e.preventDefault();var f=e.target;
    if(f.a.value!==f.b.value){msg('As palavras-passe não coincidem.');return}
    msg('A guardar…',true);
    var r=await sb.auth.updateUser({password:f.a.value});
    if(r.error){msg(r.error.message);return}
    var u=await sb.from('profiles').update({must_change_password:false}).eq('id',me.id);
    if(u.error){msg(u.error.message);return}
    me.must_change_password=false;ready()};
}
async function start(){
  var s=(await sb.auth.getSession()).data.session;
  if(!s){showLogin();return}
  var p=await sb.from('profiles').select('id,email,nome,role,ativo,must_change_password').eq('id',s.user.id).maybeSingle();
  if(p.error||!p.data||!p.data.ativo){await sb.auth.signOut();showLogin('Esta conta não tem acesso à aplicação.');return}
  me=p.data;
  if(me.must_change_password){showChange();return}
  ready();
}
function ready(){hide();if(cb)cb(me,sb)}
async function call(body){
  var s=(await sb.auth.getSession()).data.session;
  var r=await fetch(URL_+'/functions/v1/admin-users',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+s.access_token,apikey:KEY},body:JSON.stringify(body)});
  var j=await r.json().catch(function(){return {error:'Resposta inválida'}});
  if(!r.ok)throw new Error(j.error||('Erro '+r.status));return j;
}
/* ecrã de utilizadores (só admin) */
async function renderUsers(host){
  host.innerHTML='<p class="fa-hint">A carregar…</p>';
  var data;try{data=await call({action:'list'})}catch(e){host.innerHTML='<p class="fa-msg">'+esc(e.message)+'</p>';return}
  var rows=data.users.map(function(u){var self=u.id===me.id;
    return '<tr data-id="'+u.id+'"><td><b>'+esc(u.nome||'—')+'</b><br><span class="fa-hint">'+esc(u.email)+'</span></td><td><select data-f="role"'+(self?' disabled':'')+'><option value="membro"'+(u.role==='membro'?' selected':'')+'>Membro</option><option value="admin"'+(u.role==='admin'?' selected':'')+'>Admin</option></select></td><td>'+(u.ativo?'Ativo':'Desativado')+(u.must_change_password?' · por entrar':'')+'</td><td><div class="fa-act">'+(self?'<span class="fa-hint">(tu)</span>':'<button data-a="reset">Nova palavra-passe</button><button data-a="toggle">'+(u.ativo?'Desativar':'Reativar')+'</button><button data-a="remove" class="danger">Apagar</button>')+'</div></td></tr>'}).join('');
  host.innerHTML='<div class="fa-users"><div class="fa-head"><h2>Utilizadores</h2></div><form id="fa-new" class="fa-new"><input name="nome" placeholder="Nome" required><input name="email" type="email" placeholder="Email" required><select name="role"><option value="membro">Membro</option><option value="admin">Admin</option></select><button class="fa-btn" type="submit">Convidar</button></form><div id="fa-out"></div><div class="fa-tw"><table><thead><tr><th>Utilizador</th><th>Perfil</th><th>Estado</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  var out=$('#fa-out',host);
  function pw(t,email,p){out.innerHTML='<div class="fa-pw"><b>'+esc(t)+'</b> '+esc(email||'')+'<br>Palavra-passe temporária (mostrada só agora): <code>'+esc(p)+'</code><br><span class="fa-hint">A pessoa muda-a no primeiro acesso.</span></div>'}
  $('#fa-new',host).onsubmit=async function(e){e.preventDefault();var f=e.target;
    try{var r=await call({action:'create',email:f.email.value,nome:f.nome.value,role:f.role.value});
      pw('Utilizador criado:',r.email,r.password);f.reset();setTimeout(function(){var keep=out.innerHTML;renderUsers(host).then(function(){$('#fa-out',host).innerHTML=keep})},300)}
    catch(x){out.innerHTML='<p class="fa-msg">'+esc(x.message)+'</p>'}};
  host.onchange=async function(e){var t=e.target;if(t.dataset.f!=='role')return;var id=t.closest('tr').dataset.id;
    try{await call({action:'update',id:id,role:t.value})}catch(x){out.innerHTML='<p class="fa-msg">'+esc(x.message)+'</p>';renderUsers(host)}};
  host.onclick=async function(e){var b=e.target.closest('button[data-a]');if(!b)return;var tr=b.closest('tr'),id=tr.dataset.id,a=b.dataset.a;
    try{
      if(a==='reset'){var r=await call({action:'reset',id:id});pw('Nova palavra-passe para',tr.querySelector('.fa-hint').textContent,r.password)}
      else if(a==='toggle'){await call({action:'update',id:id,ativo:/Desativar/.test(b.textContent)?false:true});renderUsers(host)}
      else if(a==='remove'){if(!confirm('Apagar este utilizador de vez?'))return;await call({action:'remove',id:id});renderUsers(host)}
    }catch(x){out.innerHTML='<p class="fa-msg">'+esc(x.message)+'</p>'}};
}
window.FCAuth={
  init:function(onReady){cb=onReady;sb=window.__sb||window.supabase.createClient(URL_,KEY,{auth:{persistSession:true,autoRefreshToken:true}});
    sb.auth.onAuthStateChange(function(ev){if(ev==='SIGNED_OUT'){me=null;showLogin()}});start()},
  signOut:function(){return sb.auth.signOut()},
  me:function(){return me},client:function(){return sb},renderUsers:renderUsers
};
})();
