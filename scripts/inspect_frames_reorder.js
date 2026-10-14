const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('openapi_backend.json', 'utf8'));

function resolve(ref) {
  if (!ref) return null;
  const parts = ref.replace('#/', '').split('/');
  let curr = spec;
  for (const p of parts) curr = curr[p];
  return curr;
}

const genFrames = spec.paths['/projects/{project_id}/storyboard/generate-frames']?.post;
if (genFrames) {
  console.log('Batch Generate Frames Request:');
  const req = genFrames.requestBody?.content['application/json']?.schema;
  console.log(JSON.stringify(req?.$ref ? resolve(req.$ref) : req, null, 2));
  console.log('Batch Generate Frames Response:');
  const resp = genFrames.responses['200'] || genFrames.responses['201'];
  const res = resp?.content?.['application/json']?.schema;
  console.log(JSON.stringify(res?.$ref ? resolve(res.$ref) : res, null, 2));
}

for (const [p, item] of Object.entries(spec.paths)) {
  if (p.includes('reorder')) {
    console.log('Reorder path:', p);
    console.log(JSON.stringify(item, null, 2));
  }
}
