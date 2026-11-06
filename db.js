/* Camada de dados: guarda tudo na tabela public.docs do Supabase (coleção/id/json), com atualização em tempo real. */
window.FCDb=function(sb){
  var rid=function(){return Math.random().toString(36).slice(2,12)+Date.now().toString(36).slice(-4)};
  var snap=function(rows){return {docs:rows.map(function(r){return {id:r.id,data:function(){return r.data}}})}};
  var fail=function(e){var x=new Error(e.message||'erro');x.code=e.code||'erro';return x};
  function watch(filter,load,next,err){
    var dead=false,t=null;
    var run=function(){load().then(function(v){if(!dead)next(v)}).catch(function(e){if(!dead&&err)err(fail(e))})};
    run();
    var ch=sb.channel('w'+rid()).on('postgres_changes',{event:'*',schema:'public',table:'docs',filter:filter},function(){clearTimeout(t);t=setTimeout(run,150)}).subscribe();
    return function(){dead=true;sb.removeChannel(ch)};
  }
  function coll(c){return {
    get:function(){return sb.from('docs').select('id,data').eq('coll',c).then(function(r){if(r.error)throw fail(r.error);return snap(r.data)})},
    onSnapshot:function(next,err){return watch('coll=eq.'+c,function(){return sb.from('docs').select('id,data').eq('coll',c).then(function(r){if(r.error)throw r.error;return snap(r.data)})},next,err)},
    add:function(d){var id=rid();return sb.from('docs').insert({coll:c,id:id,data:d}).then(function(r){if(r.error)throw fail(r.error);return {id:id}})}
  }}
  function doc(path){var p=path.split('/'),c=p[0],id=p[1];return {
    get:function(){return sb.from('docs').select('data').eq('coll',c).eq('id',id).maybeSingle().then(function(r){if(r.error)throw fail(r.error);return {exists:!!r.data,data:function(){return r.data&&r.data.data}}})},
    set:function(d){return sb.from('docs').upsert({coll:c,id:id,data:d}).then(function(r){if(r.error)throw fail(r.error)})},
    update:function(d){return sb.rpc('doc_merge',{p_coll:c,p_id:id,p_patch:d}).then(function(r){if(r.error)throw fail(r.error)})},
    delete:function(){return sb.from('docs').delete().eq('coll',c).eq('id',id).then(function(r){if(r.error)throw fail(r.error)})},
    onSnapshot:function(next,err){return watch('coll=eq.'+c,function(){return sb.from('docs').select('data').eq('coll',c).eq('id',id).maybeSingle().then(function(r){if(r.error)throw r.error;return {exists:!!r.data,data:function(){return r.data&&r.data.data}}})},next,err)}
  }}
  return {collection:coll,doc:doc};
};
window.FCAssets=function(sb){
  return {
    upload:function(file){var safe=file.name.replace(/[^A-Za-z0-9._-]+/g,'_'),path=new Date().toISOString().slice(0,10)+'/'+Math.random().toString(36).slice(2,10)+'-'+safe;
      return sb.storage.from('anexos').upload(path,file,{contentType:file.type||undefined}).then(function(r){if(r.error)throw r.error;return {id:path,url:''}})},
    open:function(path){return sb.storage.from('anexos').createSignedUrl(path,120).then(function(r){if(r.error)throw r.error;window.open(r.data.signedUrl,'_blank','noopener')})}
  };
};
