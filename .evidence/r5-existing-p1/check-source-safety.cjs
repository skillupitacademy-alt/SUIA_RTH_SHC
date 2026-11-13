const fs=require('fs'),crypto=require('crypto'),cp=require('child_process');
const paths=cp.execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const ledger='docs/architecture/reviews/SHC/10_SHC_ADMIN_ACCEPTANCE_LEDGER.csv';
const register='.evidence/r3-acceptance-20261112/Q01_Q48_REGISTER.md';
const actual={head:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),changedFiles:paths.map(path=>({path,sha256:sha(path)})),canonicalLedgerSha256:sha(ledger),canonicalLedgerMatchesBaseline:sha(ledger)==='7a6d7d43c7f535f24ca56e78781e9f98c747e7e249465121b06f37e2f56bc97e',originalRegisterUnchanged:cp.execFileSync('git',['diff','--',register],{encoding:'utf8'}).length===0,heldPathChanges:paths.filter(p=>/attendance|payment|marketing|Dockerfile|docker-compose|migrations\//i.test(p))};
fs.writeFileSync('.evidence/r5-existing-p1/source-safety-check.json',JSON.stringify(actual,null,2));console.log({ledgerPreserved:actual.canonicalLedgerMatchesBaseline,registerPreserved:actual.originalRegisterUnchanged,heldPathChanges:actual.heldPathChanges});
