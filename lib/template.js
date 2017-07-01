
// name
// woff2Encode
// woffEncode
// ttfBuffer
const cssTemplate = (data, path) => `@font-face {
    font-family: '${data.name}';
    src: url('data:application/font-woff2;charset=utf-8;base64, ${data.woff2.data}') format('woff2'),
      url('${path}/${data.name}.woff?${data.woff.hash}') format('woff'),
      url('${path}/${data.name}.ttf?${data.ttf.hash}') format('truetype');
    font-weight: normal;
    font-style: normal;
}`

module.exports = { cssTemplate }