const table = document.getElementById('kurzusok');
const sort = new Tablesort(table);
let enters = 0;
let offTimeout;

document.addEventListener('dragover', e => e.preventDefault(), false);
document.addEventListener('dragenter', handleDragEnter, false);
document.addEventListener('dragleave', handleDragLeave, false);
document.addEventListener('drop', handleDrop, false);


function handleDragEnter(e){
    if(enters===0){
        clearTimeout(offTimeout);
        e.dataTransfer.dropEffect = 'copy';
        document.body.classList.add('blur');
    }
    enters++;
}
function handleDragLeave(){
    enters--;
    if(enters===0){
        clearTimeout(offTimeout);
        offTimeout = setTimeout(()=>{
            document.body.classList.remove('blur');
        }, 100);
    }
}
function handleDrop(e){
    e.preventDefault();
    enters = 1;
    handleDragLeave();
    handleFile(e.dataTransfer.files[0], processResult);
}


function handleFile(f, cb){
    try{
        const reader = new FileReader();
        reader.onload = e => cb(bufferToJson(e.target.result));
        reader.readAsArrayBuffer(f);
    }catch(e){}
}


function processResult(k){
    const tbody = document.createElement('tbody');
    table.replaceChild(tbody, table.getElementsByTagName('tbody')[0]);

    for(const kurzus of k){
        const tr = document.createElement('tr');

        const title = document.createElement('td');
        title.innerHTML = /(.+?),\s\s.+/.exec(kurzus['Tárgy címe, előadó neve'])[1];

        const type = document.createElement('td');
        type.innerHTML = getType(kurzus);

        const kredit = document.createElement('td');
        kredit.innerHTML = kurzus['Kr.'];

        const grade = document.createElement('td');
        const sel = createSelect(getGrade(kurzus), isDone(kurzus));
        grade.appendChild(sel);
        grade.setAttribute('data-sort', sel.value);

        const done = document.createElement('td');
        done.innerHTML = isDone(kurzus) ? '✔' : '';

        tr.appendChild(title);
        tr.appendChild(type);
        tr.appendChild(kredit);
        tr.appendChild(grade);
        tr.appendChild(done);
        tbody.appendChild(tr);
    }

    recalcKorrKrInd();
    sort.refresh();
}

function getType(k){
    const res = [];
    const h = k['Óra heti (E/GY/L)'];

    if(!h.startsWith('0/')) res.push('E');
    if(!h.endsWith('/0/0')) res.push('Gy');
    return res.join('+');
}

function getGrade(k){
    if(!isDone(k)) return 1;
    const match = /.*\s\((\d)\).*/.exec(k['Jegyek']);
    return match ? parseInt(match[1]) : 5;
}

function isDone(k){
    return k['Teljesített'] === 'Igen';
}

function createSelect(g, d){
    const sel = document.createElement('select');
    for(let i = 1; i <= 5; i++){
        const opt = document.createElement('option');
        opt.value = opt.innerHTML = i;
        opt.selected = i === g;
        sel.appendChild(opt);
    }
    if(d) sel.classList.add('disabled');
    sel.addEventListener('change', () =>{
        sel.parentNode.setAttribute('data-sort', sel.value);
        recalcKorrKrInd();
    }, false);
    return sel;
}


function recalcKorrKrInd(){
    const kurzusok = table.querySelectorAll('tbody > tr');
    let krOssz = 0;
    let krTelj = 0;
    let krInd = 0;

    for(const kurzus of kurzusok){
        const kredit = parseInt(kurzus.children[2].innerHTML);
        const jegy = parseInt(kurzus.children[3].children[0].value);

        krOssz += kredit;
        if(jegy > 1) krTelj += kredit;
        krInd += jegy * kredit;
    }

    document.getElementById('krid').innerHTML = (krInd / 30 * krTelj / krOssz).toFixed(2);
}

function bufferToJson(buf){
    let data = '', l = 0, w = 10240;
    for(; l < buf.byteLength / w; ++l) data += String.fromCharCode.apply(null, new Uint8Array(buf.slice(l * w, l * w + w)));
    data += String.fromCharCode.apply(null, new Uint8Array(buf.slice(l * w)));

    const wb = XLSX.read(btoa(data), {type: 'base64'});
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}
