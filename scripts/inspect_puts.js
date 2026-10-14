const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('openapi_backend.json', 'utf8'));

function resolve(ref) {
  if (!ref) return null;
  const parts = ref.replace('#/', '').split('/');
  let curr = spec;
  for (const p of parts) curr = curr[p];
  return curr;
}

console.log('PUT Scene:');
const putScene = spec.paths['/projects/{project_id}/scenes/{scene_id}'].put;
console.log(JSON.stringify(resolve(putScene.requestBody.content['application/json'].schema.$ref), null, 2));

console.log('PUT Shot:');
const putShot = spec.paths['/projects/{project_id}/shots/{shot_id}'].put;
console.log(JSON.stringify(resolve(putShot.requestBody.content['application/json'].schema.$ref), null, 2));
