const fs = require('fs');
const spec = JSON.parse(fs.readFileSync('openapi_backend.json', 'utf8'));

function resolve(ref) {
  if (!ref) return null;
  const parts = ref.replace('#/', '').split('/');
  let curr = spec;
  for (const p of parts) curr = curr[p];
  return curr;
}

const paths = [
  '/projects/{project_id}/storyboard',
  '/projects/{project_id}/storyboard/generate',
  '/projects/{project_id}/storyboard/generate-frames',
  '/projects/{project_id}/scenes',
  '/projects/{project_id}/scenes/{scene_id}/shots'
];

for (const p of paths) {
  console.log('=== PATH:', p);
  const item = spec.paths[p];
  if (!item) { console.log('NOT FOUND'); continue; }
  for (const [m, op] of Object.entries(item)) {
    console.log('  Method:', m.toUpperCase(), 'summary:', op.summary);
    if (op.requestBody) {
      const content = op.requestBody.content?.['application/json'];
      const schema = content?.schema?.$ref ? resolve(content.schema.$ref) : content?.schema;
      console.log('    RequestBody:', JSON.stringify(schema, null, 2));
    }
    const resp = op.responses?.['200'] || op.responses?.['201'];
    if (resp) {
      const content = resp.content?.['application/json'];
      const schema = content?.schema?.$ref ? resolve(content.schema.$ref) : content?.schema;
      console.log('    Response schema name:', content?.schema?.$ref);
      console.log('    Response detail:', JSON.stringify(schema, null, 2));
    }
  }
}

// Also check reorder or screenplay storyboard
for (const p of Object.keys(spec.paths)) {
  if (p.includes('reorder') || p.includes('screenplay/storyboard')) {
    console.log('SPECIAL PATH:', p);
  }
}
