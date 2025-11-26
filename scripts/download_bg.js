const https = require('https');
const fs = require('fs');
const path = require('path');

// Candidate remote sources (tries each until one returns HTTP 200)
const CANDIDATES = [
  // Option 1 (preferred liquid/teal) - original candidate (may 404)
  'https://cdn.pixabay.com/video/2017/11/06/188121-881834196_large.mp4',
  // Option 2 - grid/cyan loop (alternate)
  'https://cdn.pixabay.com/video/2021/11/11/95462-645084454_large.mp4',
  // Option 3 - teal gradient (alternate)
  'https://cdn.pixabay.com/video/2025/04/22/273567_large.mp4'
];
let REMOTE = CANDIDATES[0];
const OUT_DIR = path.join(__dirname, '..', 'public');
const OUT_PATH = path.join(OUT_DIR, 'bg.mp4');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Helper that attempts HEAD request to check availability
function checkUrl(url){
  return new Promise((resolve) => {
    try{
      https.request(url, { method: 'HEAD' }, (res) => {
        resolve(res.statusCode === 200);
      }).on('error', ()=> resolve(false)).end();
    }catch(e){ resolve(false); }
  });
}

async function attemptDownload(){
  for (let i=0;i<CANDIDATES.length;i++){
    const cand = CANDIDATES[i];
    process.stdout.write(`Checking ${cand} ... `);
    // prefer HEAD test first
    // Some CDNs may not respond to HEAD; try GET if HEAD fails
    const ok = await checkUrl(cand);
    if (!ok) {
      console.log('not available');
      continue;
    }
    REMOTE = cand;
    console.log('available — downloading', REMOTE);

    const file = fs.createWriteStream(OUT_PATH);
    try{
      const res = await new Promise((resolve, reject)=>{
        https.get(REMOTE, (r)=> resolve(r)).on('error', reject);
      });

      if (res.statusCode !== 200) {
        console.error('Download failed: HTTP', res.statusCode);
        continue;
      }

      const total = parseInt(res.headers['content-length'] || '0', 10);
      let received = 0;
      res.on('data', (chunk) => {
        received += chunk.length;
        if (total) {
          const pct = ((received/total)*100).toFixed(1);
          process.stdout.write(`\rReceived ${pct}% (${(received/1024/1024).toFixed(2)} MB)`);
        }
      });

      res.pipe(file);
      await new Promise((resolve, reject)=>{
        file.on('finish', resolve);
        file.on('error', reject);
      });
      file.close();
      console.log('\nSaved to', OUT_PATH);
      return;
    }catch(err){
      try{ fs.unlinkSync(OUT_PATH); }catch(e){}
      console.error('Download error', err.message || err);
      // try next candidate
    }
  }
  console.error('All candidates failed. Please check network or provide a direct URL.');
  process.exit(1);
}

// Start
attemptDownload();
