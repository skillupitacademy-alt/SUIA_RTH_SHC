const fs=require('fs'),crypto=require('crypto'),path=require('path');
const root=path.resolve(__dirname,'../..');const old=require('../r4-acceptance-20261112/source-manifest.json');
const files=old.files.map(row=>{const p=path.join(root,row.path);const sha256=fs.existsSync(p)?crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'):null;return {...row,currentSha256:sha256,unchanged:sha256===row.sha256};});
fs.writeFileSync(path.join(__dirname,'r4-reuse-source-check.json'),JSON.stringify({historicalHead:old.head,currentHead:require('child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files},null,2));console.log(JSON.stringify({unchanged:files.filter(r=>r.unchanged).length,changed:files.filter(r=>!r.unchanged).map(r=>r.path)}));
