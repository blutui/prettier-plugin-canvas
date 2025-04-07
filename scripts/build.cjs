#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')

const grammarPath = path.join(__dirname, '..', 'grammar')

function main() {
  fs.writeFileSync(
    path.join(grammarPath, 'canvas-html.ohm.cjs'),
    'module.exports = ' +
      'String.raw`' +
      fs
        .readFileSync(path.join(grammarPath, 'canvas-html.ohm'), 'utf-8')
        .replace(/`/g, '${"`"}') +
      '`;',
    'utf-8'
  )
}

main()
