const $ = (id) => document.getElementById(id);
const homeView = $('homeView'), editorView = $('editorView'), canvas = $('canvas'), nodesLayer = $('nodesLayer');
const edgesGroup = $('edgesGroup'), codeArea = $('mermaidCode');
let state = { nodes: [], edges: [], title: 'Diagrama sin título', selected: null, tool: 'select', zoom: 1, pan: {x: 0, y: 0} };
let directoryHandle = null, currentFileHandle = null, connectSource = null, drag = null, history = [], future = [], codeTimer;

const sampleState = () => ({
  nodes:[
    {id:'idea',label:'Nueva idea',x:260,y:220,type:'node'},
    {id:'research',label:'Investigar contexto',x:565,y:220,type:'node'},
    {id:'decision',label:'¿Está lista?',x:850,y:195,type:'decision'},
    {id:'share',label:'Compartir resultado',x:1120,y:220,type:'node'},
    {id:'iterate',label:'Iterar propuesta',x:850,y:470,type:'node'}
  ],
  edges:[{from:'idea',to:'research',label:''},{from:'research',to:'decision',label:''},{from:'decision',to:'share',label:'Sí'},{from:'decision',to:'iterate',label:'No'},{from:'iterate',to:'research',label:''}]
});

function showToast(message){ const el=$('toast'); el.textContent=message; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2200); }
function safeId(text){ let id=text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'nodo'; let base=id,n=2; while(state.nodes.some(x=>x.id===id)) id=base+n++; return id; }
function snapshot(){ history.push(JSON.stringify({nodes:state.nodes,edges:state.edges,title:state.title})); if(history.length>60)history.shift(); future=[]; }
function restore(raw){ const s=JSON.parse(raw); state.nodes=s.nodes;state.edges=s.edges;state.title=s.title;$('diagramTitle').value=s.title;state.selected=null;renderAll(); }
function markChanged(){ $('saveState').textContent='Cambios sin guardar'; updateCode(); }

function openEditor(data=sampleState(), title='Diagrama sin título'){
  state={...state,...data,title,selected:null,tool:'select',zoom:1,pan:{x:0,y:0}}; history=[];future=[];
  $('diagramTitle').value=title; homeView.classList.add('hidden');editorView.classList.remove('hidden'); setTool('select');renderAll();fitView();
}
function renderAll(){ renderNodes();renderEdges();updateCode();renderMinimap(); }
function renderNodes(){
  nodesLayer.innerHTML='';
  state.nodes.forEach(n=>{ const el=document.createElement('div'); el.className=`diagram-node ${n.type==='decision'?'decision':''} ${state.selected===n.id?'selected':''} ${connectSource===n.id?'connect-source':''}`;el.dataset.id=n.id;el.style.left=n.x+'px';el.style.top=n.y+'px';
    el.innerHTML=`<span class="node-kind">${n.type==='decision'?'DECISIÓN':'PROCESO'}</span><span class="node-label"></span><i class="port left"></i><i class="port right"></i>`; el.querySelector('.node-label').textContent=n.label;
    el.addEventListener('pointerdown',startNodeDrag);el.addEventListener('click',nodeClick);el.addEventListener('dblclick',()=>renameNode(n.id));nodesLayer.appendChild(el); });
  $('selectionToolbar').classList.toggle('hidden',!state.selected);
}
function nodeClick(e){ e.stopPropagation(); const id=e.currentTarget.dataset.id;if(state.tool==='connect'){if(!connectSource){connectSource=id;renderNodes();showToast('Selecciona el nodo de destino');}else if(connectSource!==id){snapshot();if(!state.edges.some(x=>x.from===connectSource&&x.to===id))state.edges.push({from:connectSource,to:id,label:''});connectSource=null;renderAll();markChanged();}}else{state.selected=id;renderNodes();renderEdges();}}
function startNodeDrag(e){if(state.tool==='connect')return;e.stopPropagation();const n=state.nodes.find(x=>x.id===e.currentTarget.dataset.id);state.selected=n.id;snapshot();drag={n,startX:e.clientX,startY:e.clientY,x:n.x,y:n.y,moved:false};e.currentTarget.setPointerCapture(e.pointerId);e.currentTarget.onpointermove=moveNode;e.currentTarget.onpointerup=endNodeDrag;renderNodes();}
function moveNode(e){if(!drag)return;drag.moved=true;drag.n.x=Math.round((drag.x+(e.clientX-drag.startX)/state.zoom)/12)*12;drag.n.y=Math.round((drag.y+(e.clientY-drag.startY)/state.zoom)/12)*12;const el=document.querySelector(`[data-id="${drag.n.id}"]`);el.style.left=drag.n.x+'px';el.style.top=drag.n.y+'px';renderEdges();renderMinimap();}
function endNodeDrag(){if(drag?.moved)markChanged();drag=null;}
function center(n){return{x:n.x+(n.type==='decision'?60:82),y:n.y+(n.type==='decision'?60:34)}}
function edgePath(a,b){const p1=center(a),p2=center(b),dx=Math.max(65,Math.abs(p2.x-p1.x)*.48);return `M ${p1.x} ${p1.y} C ${p1.x+(p2.x>p1.x?dx:-dx)} ${p1.y}, ${p2.x-(p2.x>p1.x?dx:-dx)} ${p2.y}, ${p2.x} ${p2.y}`;}
function renderEdges(){edgesGroup.innerHTML='';state.edges.forEach((edge,i)=>{const a=state.nodes.find(n=>n.id===edge.from),b=state.nodes.find(n=>n.id===edge.to);if(!a||!b)return;const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',edgePath(a,b));path.setAttribute('class','edge');path.dataset.index=i;edgesGroup.appendChild(path);if(edge.label){const p=center(a),q=center(b),t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',(p.x+q.x)/2);t.setAttribute('y',(p.y+q.y)/2-8);t.setAttribute('fill','#9ba7b8');t.setAttribute('font-size','11');t.textContent=edge.label;edgesGroup.appendChild(t);}});}
function renderMinimap(){const svg=$('minimapSvg');svg.innerHTML='';state.edges.forEach(e=>{const a=state.nodes.find(n=>n.id===e.from),b=state.nodes.find(n=>n.id===e.to);if(!a||!b)return;const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',center(a).x/7+10);line.setAttribute('y1',center(a).y/7+8);line.setAttribute('x2',center(b).x/7+10);line.setAttribute('y2',center(b).y/7+8);line.setAttribute('stroke','#4b5668');svg.appendChild(line)});state.nodes.forEach(n=>{const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',n.x/7+10);r.setAttribute('y',n.y/7+8);r.setAttribute('width',n.type==='decision'?17:24);r.setAttribute('height',n.type==='decision'?17:9);r.setAttribute('rx','2');r.setAttribute('fill',n.id===state.selected?'#a78bfa':'#485468');svg.appendChild(r)});}

function generateCode(){let out='flowchart TD\n';state.nodes.forEach(n=>{const label=n.label.replace(/"/g,"'");out+=n.type==='decision'?`  ${n.id}{"${label}"}\n`:`  ${n.id}["${label}"]\n`;});state.edges.forEach(e=>out+=`  ${e.from} -->${e.label?`|${e.label}|`:''} ${e.to}\n`);return out.trim();}
function updateCode(){const code=generateCode();if(document.activeElement!==codeArea)codeArea.value=code;$('codeStats').textContent=`${state.nodes.length} nodos · ${state.edges.length} conexiones`;}
function parseCode(code){
  const nodes=[],edges=[]; const old=new Map(state.nodes.map(n=>[n.id,n]));
  code.split('\n').forEach(line=>{let m=line.match(/^\s*([\w-]+)\s*(\[|\{)["']?(.*?)["']?(\]|\})\s*$/);if(m){const prior=old.get(m[1]);nodes.push({id:m[1],label:m[3].replace(/["']$/,''),type:m[2]==='{'?'decision':'node',x:prior?.x??220+(nodes.length%3)*280,y:prior?.y??180+Math.floor(nodes.length/3)*190});return;}m=line.match(/^\s*([\w-]+)\s*-->\s*(?:\|([^|]+)\|\s*)?([\w-]+)/);if(m)edges.push({from:m[1],to:m[3],label:m[2]||''});});
  if(nodes.length){snapshot();state.nodes=nodes;state.edges=edges;renderAll();markChanged();}
}
codeArea.addEventListener('input',()=>{clearTimeout(codeTimer);codeTimer=setTimeout(()=>parseCode(codeArea.value),500)});

function setTool(tool){state.tool=tool;connectSource=null;document.querySelectorAll('.tool[data-tool]').forEach(x=>x.classList.toggle('active',x.dataset.tool===tool));renderNodes();}
function addNode(type,x=450,y=300){snapshot();const label=type==='decision'?'Nueva decisión':'Nuevo proceso';const id=safeId(label);state.nodes.push({id,label,x,y,type});state.selected=id;renderAll();markChanged();setTimeout(()=>renameNode(id),60);}
function renameNode(id){const n=state.nodes.find(x=>x.id===id);if(!n)return;const value=prompt('Nombre del nodo',n.label);if(value?.trim()&&value.trim()!==n.label){snapshot();n.label=value.trim();renderAll();markChanged();}}
function deleteSelected(){if(!state.selected)return;snapshot();state.nodes=state.nodes.filter(n=>n.id!==state.selected);state.edges=state.edges.filter(e=>e.from!==state.selected&&e.to!==state.selected);state.selected=null;renderAll();markChanged();}
function duplicateSelected(){const n=state.nodes.find(x=>x.id===state.selected);if(!n)return;snapshot();const copy={...n,id:safeId(n.label),x:n.x+36,y:n.y+36,label:n.label+' copia'};state.nodes.push(copy);state.selected=copy.id;renderAll();markChanged();}
function applyTransform(){canvas.style.transform=`translate(${state.pan.x}px,${state.pan.y}px) scale(${state.zoom})`;$('zoomLabel').textContent=Math.round(state.zoom*100)+'%';}
function fitView(){if(!state.nodes.length)return;const minX=Math.min(...state.nodes.map(n=>n.x)),maxX=Math.max(...state.nodes.map(n=>n.x+180)),minY=Math.min(...state.nodes.map(n=>n.y)),maxY=Math.max(...state.nodes.map(n=>n.y+120));const wrap=$('canvasWrap');state.zoom=Math.min(.95,(wrap.clientWidth-200)/(maxX-minX),(wrap.clientHeight-150)/(maxY-minY));state.zoom=Math.max(.45,state.zoom);state.pan={x:(wrap.clientWidth-(maxX-minX)*state.zoom)/2-minX*state.zoom,y:(wrap.clientHeight-(maxY-minY)*state.zoom)/2-minY*state.zoom};applyTransform();}

async function chooseFolder(){if(!window.showDirectoryPicker){showToast('Tu navegador no permite elegir carpetas. Usa Abrir archivo.');return;}try{directoryHandle=await window.showDirectoryPicker({mode:'readwrite'});await loadFolderFiles();}catch(e){if(e.name!=='AbortError')showToast('No fue posible abrir la carpeta');}}
async function loadFolderFiles(){const files=[];for await(const [name,handle] of directoryHandle.entries())if(handle.kind==='file'&&/\.(text|txt)$/i.test(name))files.push({name,handle});const grid=$('fileGrid');grid.innerHTML='';files.forEach(f=>{const b=document.createElement('button');b.className='file-card';b.innerHTML=`<span class="file-card-icon">⌁</span><strong></strong><small>Archivo Mermaid local</small>`;b.querySelector('strong').textContent=f.name;b.onclick=async()=>{currentFileHandle=f.handle;openFromText(await(await f.handle.getFile()).text(),f.name.replace(/\.(text|txt)$/i,''));};grid.appendChild(b)});if(!files.length)grid.innerHTML='<div class="file-card"><strong>Carpeta vacía</strong><small>Crea un nuevo diagrama para empezar.</small></div>';$('recentSection').classList.remove('hidden');$('recentSection').scrollIntoView({behavior:'smooth'});}
function openFromText(text,title){try{const parsed=JSON.parse(text);if(parsed.nodes)openEditor(parsed,parsed.title||title);else throw 0;}catch{state.nodes=[];state.edges=[];parseCode(text);openEditor({nodes:state.nodes,edges:state.edges},title);}}
async function saveDiagram(){state.title=$('diagramTitle').value.trim()||'Diagrama sin título';const content=JSON.stringify({version:1,title:state.title,nodes:state.nodes,edges:state.edges,mermaid:generateCode()},null,2);try{if(currentFileHandle){const w=await currentFileHandle.createWritable();await w.write(content);await w.close();}else if(directoryHandle){currentFileHandle=await directoryHandle.getFileHandle(state.title+'.text',{create:true});const w=await currentFileHandle.createWritable();await w.write(content);await w.close();}else{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type:'text/plain'}));a.download=state.title+'.text';a.click();URL.revokeObjectURL(a.href);} $('saveState').textContent='Cambios guardados localmente';showToast('Diagrama guardado');}catch{showToast('No se pudo guardar el diagrama');}}
async function copyCode(){try{await navigator.clipboard.writeText(generateCode());showToast('Código Mermaid copiado');}catch{showToast('Selecciona y copia el código manualmente');}}
function showExport(){const c=generateCode();$('exportCode').textContent=c;$('exportStats').textContent=`${state.nodes.length} NODOS · ${state.edges.length} CONEXIONES`;$('exportDialog').showModal();}

$('newDiagramBtn').onclick=()=>{currentFileHandle=null;openEditor(sampleState());};$('openFolderBtn').onclick=chooseFolder;$('changeFolderBtn').onclick=chooseFolder;
$('fileInput').onchange=async e=>{const f=e.target.files[0];if(f)openFromText(await f.text(),f.name.replace(/\.(text|txt)$/i,''));};$('backBtn').onclick=()=>{editorView.classList.add('hidden');homeView.classList.remove('hidden');};
document.querySelectorAll('.tool[data-tool]').forEach(b=>b.onclick=()=>{setTool(b.dataset.tool);if(b.dataset.tool==='node'||b.dataset.tool==='decision')addNode(b.dataset.tool==='decision'?'decision':'node');});
canvas.addEventListener('dblclick',e=>{if(e.target===canvas||e.target===nodesLayer){const r=canvas.getBoundingClientRect();addNode('node',(e.clientX-r.left)/state.zoom,(e.clientY-r.top)/state.zoom);}});canvas.addEventListener('click',e=>{if(e.target===canvas||e.target===nodesLayer){state.selected=null;renderNodes();}});
$('editNodeBtn').onclick=()=>renameNode(state.selected);$('deleteNodeBtn').onclick=deleteSelected;$('duplicateNodeBtn').onclick=duplicateSelected;$('saveBtn').onclick=saveDiagram;$('exportBtn').onclick=showExport;$('copyCodeBtn').onclick=copyCode;$('copyExportBtn').onclick=copyCode;$('closeExportBtn').onclick=()=>$('exportDialog').close();$('closeExportBtn2').onclick=()=>$('exportDialog').close();
$('diagramTitle').addEventListener('input',()=>{state.title=$('diagramTitle').value;markChanged()});$('fitBtn').onclick=fitView;$('zoomInBtn').onclick=()=>{state.zoom=Math.min(1.8,state.zoom+.1);applyTransform()};$('zoomOutBtn').onclick=()=>{state.zoom=Math.max(.3,state.zoom-.1);applyTransform()};$('collapseCodeBtn').onclick=()=>{const panel=document.querySelector('.code-panel');panel.classList.toggle('collapsed');$('collapseCodeBtn').textContent=panel.classList.contains('collapsed')?'‹':'›';};
$('undoBtn').onclick=()=>{if(!history.length)return;future.push(JSON.stringify({nodes:state.nodes,edges:state.edges,title:state.title}));restore(history.pop())};$('redoBtn').onclick=()=>{if(!future.length)return;history.push(JSON.stringify({nodes:state.nodes,edges:state.edges,title:state.title}));restore(future.pop())};
document.addEventListener('keydown',e=>{if(e.key==='Delete'&&document.activeElement.tagName!=='TEXTAREA'&&document.activeElement.tagName!=='INPUT')deleteSelected();if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();saveDiagram()}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();e.shiftKey?$('redoBtn').click():$('undoBtn').click()}if(e.key==='Escape'){connectSource=null;state.selected=null;setTool('select')}});
