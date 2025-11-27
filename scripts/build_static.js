const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VIEWS = path.join(ROOT, 'views');
const PUBLIC = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'dist');

async function rimraf(dir){
  try{ await fsp.rm(dir, { recursive: true, force: true }); }catch(e){}
}

async function copyDir(src, dest){
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const ent of entries){
    const srcPath = path.join(src, ent.name);
    const destPath = path.join(dest, ent.name);
    if (ent.isDirectory()){
      await copyDir(srcPath, destPath);
    } else if (ent.isFile()){
      await fsp.copyFile(srcPath, destPath);
    }
  }
}

async function build(){
  console.log('Building static site into', OUT);
  await rimraf(OUT);
  await fsp.mkdir(OUT, { recursive: true });

  // Copy views (html files) to root of dist
  const viewFiles = await fsp.readdir(VIEWS, { withFileTypes: true });
  for (const vf of viewFiles){
    if (vf.isFile()){
      const src = path.join(VIEWS, vf.name);
      const dest = path.join(OUT, vf.name);
      await fsp.copyFile(src, dest);
    } else if (vf.isDirectory()){
      // copy subfolders if any
      await copyDir(path.join(VIEWS, vf.name), path.join(OUT, vf.name));
    }
  }

  // Copy public assets (css, js, images) into dist root
  if (fs.existsSync(PUBLIC)){
    await copyDir(PUBLIC, OUT);
  }

  console.log('Done. Static site ready in', OUT);
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
