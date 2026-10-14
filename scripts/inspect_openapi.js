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
  '/projects/{project_id}/scenes/{scene_id}',
  '/projects/{project_id}/scenes/{scene_id}/shots',
  '/projects/{project_id}/shots/{shot_id}',
  '/projects/{project_id}/shots/{shot_id}/generate-frame',
  '/projects/{project_id}/shots/{shot_id}/production-config',
  '/projects/{project_id}/shots/{shot_id}/generate-video',
  '/projects/{project_id}/shots/{shot_id}/video-status',
  '/projects/{project_id}/production/generate-videos',
  '/projects/{project_id}/production/status'
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
      console.log('    RequestBody schema properties:', Object.keys(schema?.properties || {}));
      console.log('    RequestBody full:', JSON.stringify(schema, null, 2));
    }
    const resp = op.responses?.['200'] || op.responses?.['201'];
    if (resp) {
      const content = resp.content?.['application/json'];
      const schema = content?.schema?.$ref ? resolve(content.schema.$ref) : content?.schema;
      console.log('    Response schema name:', content?.schema?.$ref);
      console.log('    Response schema properties:', Object.keys(schema?.properties || {}));
      console.log('    Response schema detail:', JSON.stringify(schema, null, 2));
    }
  }
}
