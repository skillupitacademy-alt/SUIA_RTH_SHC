const fs=require('fs'),path=require('path'),crypto=require('crypto');const {Pool,neonConfig}=require('@neondatabase/serverless');neonConfig.webSocketConstructor=require('ws');
const root=path.resolve(__dirname,'../..');const parse=require('dotenv').parse;const env={...parse(fs.readFileSync(path.join(root,'.env.local'))),...parse(fs.readFileSync(path.join(root,'apps/api-server/.env.local')))};
const id=crypto.randomUUID(),email=`r6-shc-${id}@example.invalid`,results=[];let cleanupVerified=false;
const pool=new Pool({connectionString:env.DATABASE_URL_PEOPLE,max:1,connectionTimeoutMillis:10000,statement_timeout:15000});
function save(){fs.writeFileSync(path.join(__dirname,'shc-backend-http-results.json'),JSON.stringify({baseline:'62f920f4782b8bbb277f88dc27930cd3b86f1b15',boundary:'Actual local backend GET, real signed JWT, run-owned PeopleDB account. No question records are created or mutated.',results,cleanupVerified},null,2));}
(async()=>{const {SignJWT}=await import('jose');const key=env.ADMIN_JWT_SECRET||env.JWT_SECRET;if(!key)throw new Error('Missing configured signing key');
 try{
  await pool.query("INSERT INTO users(id,email,password_hash,role,platform,is_active) VALUES($1,$2,$3,'admin','skillhubcore',true)",[id,email,'synthetic-unusable-password-hash']);
  const token=await new SignJWT({userId:id,originalUserId:id,shadowUserId:id,roles:['admin'],isAdmin:true,brand:'skillhubcore',tokenType:'admin'}).setProtectedHeader({alg:'HS256'}).setIssuer('skillhubcore.in').setAudience('shc-admin').setIssuedAt().setExpirationTime('10m').sign(new TextEncoder().encode(key));
  const url='http://localhost:3000/api/admin/questions/'+crypto.randomUUID();
  async function check(name,expected){const response=await fetch(url,{headers:{authorization:`Bearer ${token}`,'x-portal-identity':'shc-admin'},signal:AbortSignal.timeout(240000)});await response.arrayBuffer();const row={name,expected,actual:response.status,pass:Array.isArray(expected)?expected.includes(response.status):response.status===expected};results.push(row);console.log(JSON.stringify(row));save();}
  await check('active current SHC admin reaches missing-question lookup',404);
  await pool.query('UPDATE users SET is_active=false WHERE id=$1 AND email=$2',[id,email]);
  await check('disabled SHC administrator denied at backend',403);
  await pool.query("UPDATE users SET is_active=true,role='student' WHERE id=$1 AND email=$2",[id,email]);
  await check('demoted SHC administrator denied at backend',403);
  await pool.query('UPDATE users SET deleted_at=now() WHERE id=$1 AND email=$2',[id,email]);
  await check('deleted SHC administrator denied at backend',[401,403]);
 }finally{await pool.query('DELETE FROM users WHERE id=$1 AND email=$2',[id,email]);cleanupVerified=Number((await pool.query('SELECT count(*) AS n FROM users WHERE id=$1',[id])).rows[0].n)===0;save();await pool.end();}
 if(!cleanupVerified||results.some(r=>!r.pass))process.exitCode=1;
})().catch(error=>{console.error(JSON.stringify({name:error.name,code:error.code}));process.exitCode=1;});
