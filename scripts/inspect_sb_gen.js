const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('openapi_backend.json', 'utf8'));

function resolve(ref) {
  if (!ref) return null;
  const parts = ref.replace('#/', '').split('/');
  let curr = spec;
  for (const p of parts) curr = curr[p];
  return curr;
}

const getSt = spec.paths['/projects/{project_id}/storyboard'].get;
const postSt = spec.paths['/projects/{project_id}/storyboard/generate'].post;
console.log('GET Storyboard Response:');
console.log(JSON.stringify(resolve(getSt.responses['200'].content['application/json'].schema.$ref), null, 2));

console.log('POST Storyboard Request:');
if (postSt.requestBody) {
  const reqSchema = postSt.requestBody.content['application/json'].schema;
  console.log(JSON.stringify(reqSchema.$ref ? resolve(reqSchema.$ref) : reqSchema, null, 2));
} else {
  console.log('No request body required');
}

console.log('POST Storyboard Response:');
const postResp = postSt.responses['200'] || postSt.responses['201'];
const respSchema = postResp.content['application/json'].schema;
console.log(JSON.stringify(respSchema.$ref ? resolve(respSchema.$ref) : respSchema, null, 2));
