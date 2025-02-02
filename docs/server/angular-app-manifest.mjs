
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/dental-manager-web/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/dental-manager-web"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 516, hash: 'e5301cc841c29d6c89e008c6df41a80e5c002853baa175dbae36f1995a0991b3', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1029, hash: 'fa909e8b5983f0eb665845272673a12bbe4276eda0066db60dbf7e505c1557ce', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 3082, hash: 'aa34dfc2667a48bdcd5a06a5eb3a7a0ab442c0c104952e81cc0f779ff3d16473', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-5INURTSO.css': {size: 0, hash: 'menYUTfbRu8', text: () => import('./assets-chunks/styles-5INURTSO_css.mjs').then(m => m.default)}
  },
};
