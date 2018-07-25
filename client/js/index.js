const table = document.getElementById('kurzusok');
const sort = new Tablesort(table);
let enters = 0;
let offTimeout;

document.addEventListener('dragover', e => e.preventDefault(), false);
document.addEventListener('dragenter', handleDragEnter, false);
document.addEventListener('dragleave', handleDragLeave, false);
document.addEventListener('drop', handleDrop, false);


function handleDragEnter(e){
    if(enters <= 0){
        clearTimeout(offTimeout);
        e.dataTransfer.dropEffect = 'copy';
        document.body.classList.add('blur');
    }
    enters++;
}

function handleDragLeave(){
    enters--;
    if(enters <= 0){
        clearTimeout(offTimeout);
        offTimeout = setTimeout(() =>{
            document.body.classList.remove('blur');
        }, 100);
    }
}

function handleDrop(e){
    e.preventDefault();
    enters = 1;
    handleDragLeave();
    handleFile(e.dataTransfer.files[0], json => handleUpdate(jsonToCourseList(json)));
}


function handleFile(f, cb){
    try{
        const reader = new FileReader();
        reader.onload = e => cb(bufferToJson(e.target.result));
        reader.readAsArrayBuffer(f);
    }catch(e){}
}


function handleUpdate(courses){
    updateTable(courses);
    updateStats(courses);
    sort.refresh();
}

function updateTable(courses){
    const tbody = document.createElement('tbody');
    table.replaceChild(tbody, table.getElementsByTagName('tbody')[0]);

    for(const course of courses){
        const tr = document.createElement('tr');

        const title = document.createElement('td');
        title.innerHTML = course['title'];

        const type = document.createElement('td');
        type.innerHTML = course['type'];

        const kredit = document.createElement('td');
        kredit.innerHTML = course['kredit'];

        const grade = document.createElement('td');
        const sel = createSelect(course['grade'], () =>{
            course.grade = parseInt(sel.value);
            updateStats(courses);
            grade.setAttribute('data-sort', sel.value);
            sort.refresh();
        });
        grade.appendChild(sel);
        grade.setAttribute('data-sort', sel.value);

        const done = document.createElement('td');
        done.innerHTML = course['done'] ? '✔' : '';

        tr.appendChild(title);
        tr.appendChild(type);
        tr.appendChild(kredit);
        tr.appendChild(grade);
        tr.appendChild(done);
        tbody.appendChild(tr);
    }
}

function createSelect(g, cb){
    const sel = document.createElement('select');
    for(let i = 1; i <= 5; i++){
        const opt = document.createElement('option');
        opt.value = opt.innerHTML = i.toString();
        opt.selected = i === g;
        sel.appendChild(opt);
    }

    if(g > 0) sel.classList.add('disabled');
    sel.addEventListener('change', cb, false);
    return sel;
}

function updateStats(courses){
    let krOssz = 0;
    let krTelj = 0;
    let krInd = 0;

    for(const course of courses){
        const kr = course['kredit'];
        const j = course['grade'];

        krOssz += kr;
        if(j > 1){
            krTelj += kr;
            krInd += j * kr;
        }
    }

    const korrKrInd = (krInd / 30) * (krTelj / krOssz);
    document.getElementById('krid').innerHTML = korrKrInd.toFixed(2);
}


function bufferToJson(buf){
    const w = 10240;
    let data = '', l = 0;

    for(; l < buf.byteLength / w; ++l) data += String.fromCharCode(...new Uint8Array(buf.slice(l * w, (l + 1) * w)));
    data += String.fromCharCode(...new Uint8Array(buf.slice(l * w)));

    const wb = XLSX.read(btoa(data), {type: 'base64'});
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}

function jsonToCourseList(json){
    return json.map(item =>{
        const done = item['Teljesített'] === 'Igen';
        return {
            title: /(.+?),\s\s.+/.exec(item['Tárgy címe, előadó neve'])[1],
            type: getType(item['Óra heti (E/GY/L)']),
            kredit: parseInt(item['Kr.']),
            grade: done ? getGrade(item['Jegyek']) : 0,
            done: done
        };
    });
}

function getType(h){
    const res = [];
    if(!h.startsWith('0/')) res.push('E');
    if(!h.endsWith('/0/0')) res.push('Gy');
    return res.join('+');
}

function getGrade(g){
    const match = /.*\s\((\d)\).*/.exec(g);
    return match ? parseInt(match[1]) : 5;
}
