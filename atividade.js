/* Registo de atividade (só admin): quem entrou e o que fez */
window.FCAct=(function(){
var MES=['Set','Out','Nov','Dez','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago'];
var COLL={budget:'Orçamento',staff:'Staff',debts:'Dívidas',movs:'Movimentos',plan:'Previsões',cfg:'Definições'};
var FLD={nome:'Nome',desc:'Descrição',qty:'Qtd',unit:'Valor unit.',nota:'Nota de pagamento',label:null,m:'Meses',kind:'Tipo',cc:'Centro de custo',name:'Nome',role:'Função',team:'Equipa',v:'Valor',from:'De',to:'Até',note:'Nota',off:'Inativo',left:'Em dívida',original:'Valor original',monthly:'Prestação',next:'Próximo pagamento',interest:'Juros',deleted:'Apagado',amount:'Valor',date:'Data',doc:'Documento',desc2:'Descrição'};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function eur(n){return typeof n==='number'?n.toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2})+' €':n}
function val(k,v){if(v==null||v==='')return '—';if(typeof v==='boolean')return v?'sim':'não';if(typeof v==='number'&&/^(unit|v|left|original|monthly|amount)$/.test(k))return eur(v);return String(v)}
function diff(r){
  var a=r.antes||{},d=r.depois||{},out=[];
  Object.keys(Object.assign({},a,d)).forEach(function(k){
    if(k==='label'||k==='id'||(FLD[k]===null))return;
    if(k==='m'&&Array.isArray(d.m)){var o=a.m||[];d.m.forEach(function(x,i){if(+x!==+(o[i]||0))out.push(MES[i]+': '+eur(+(o[i]||0))+' → '+eur(+x))});return}
    var f=FLD[k]||k;
    if(r.acao==='criou')out.push(f+': '+val(k,d[k]));else out.push(f+': '+val(k,a[k])+' → '+val(k,d[k]));
  });
  return out;
}
function when(ts){return new Date(ts).toLocaleString('pt-PT',{timeZone:'Europe/Lisbon',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function line(r){
  if(r.acao==='entrou')return 'Entrou na aplicação';
  if(r.acao==='saiu')return 'Saiu';
  var w={criou:'Criou/guardou',alterou:'Alterou',apagou:'Apagou'}[r.acao]||r.acao;
  var d=r.acao==='apagou'?[]:diff(r);
  return '<b>'+esc(w)+'</b> · '+esc(COLL[r.coll]||r.coll)+' · «'+esc(r.titulo||r.doc_id)+'»'+(d.length?'<div class="act-d">'+d.slice(0,8).map(esc).join('<br>')+(d.length>8?'<br>…':'')+'</div>':'');
}
async function render(host,sb){
  host.innerHTML='<p class="fa-hint">A carregar…</p>';
  var r=await sb.from('atividade').select('id,ts,user_id,email,nome,acao,coll,doc_id,titulo,antes,depois').order('ts',{ascending:false}).limit(500);
  if(r.error){host.innerHTML='<p class="fa-msg">'+esc(r.error.message)+'</p>';return}
  var rows=r.data,users={},last={};
  rows.forEach(function(x){var k=x.email||'—';users[k]=x.nome||k;if(x.acao==='entrou'&&!last[k])last[k]=x.ts});
  var ul=Object.keys(users).sort();
  function draw(fu,fa){
    var list=rows.filter(function(x){return (!fu||x.email===fu)&&(!fa||(fa==='acessos'?(x.acao==='entrou'||x.acao==='saiu'):(x.acao!=='entrou'&&x.acao!=='saiu')))});
    host.innerHTML='<div class="fa-users"><div class="fa-head"><h2>Atividade</h2></div>'
    +'<div class="act-last">'+(ul.map(function(k){return '<div><b>'+esc(users[k])+'</b><br><span class="fa-hint">Último acesso: '+(last[k]?when(last[k]):'—')+'</span></div>'}).join('')||'<span class="fa-hint">Sem registos ainda.</span>')+'</div>'
    +'<div class="fa-new"><select id="act-u"><option value="">Todos os utilizadores</option>'+ul.map(function(k){return '<option value="'+esc(k)+'"'+(k===fu?' selected':'')+'>'+esc(users[k])+'</option>'}).join('')+'</select>'
    +'<select id="act-a"><option value="">Tudo</option><option value="acessos"'+(fa==='acessos'?' selected':'')+'>Só acessos</option><option value="alteracoes"'+(fa==='alteracoes'?' selected':'')+'>Só alterações</option></select></div>'
    +'<div class="fa-tw"><table><thead><tr><th>Quando</th><th>Quem</th><th>O quê</th></tr></thead><tbody>'
    +(list.map(function(x){return '<tr><td style="white-space:nowrap">'+when(x.ts)+'</td><td>'+esc(x.nome||x.email||'—')+'</td><td>'+line(x)+'</td></tr>'}).join('')||'<tr><td colspan="3" class="fa-hint">Nada para mostrar.</td></tr>')
    +'</tbody></table></div><p class="fa-hint">Últimos 500 registos. As alterações são registadas automaticamente pelo servidor.</p></div>';
    host.querySelector('#act-u').onchange=function(e){draw(e.target.value,host.querySelector('#act-a').value)};
    host.querySelector('#act-a').onchange=function(e){draw(host.querySelector('#act-u').value,e.target.value)};
  }
  draw('','');
}
return {render:render};
})();
