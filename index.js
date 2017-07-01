#!/usr/bin/env node

const fs = require('fs'),
  path = require('path'),
  glob = require('glob'),
  ttf2woff2 = require('ttf2woff2'),
  ttf2woff = require('ttf2woff/index.js'),
  crypto = require('crypto'),
  argv = require('minimist')(process.argv.slice(2)),
  chalk = require('chalk'),
  template = require('./lib/template').cssTemplate
  log = console.log;

if (!argv["_"]) {
  log(chalk.red('Source option was not specified. Use a glob to specify the src files'))
}

if (!argv["o"]) {
  log(chalk.red('Output directory path was not specified. Please use -o to indicate the output path'))
}

const sourcePath = argv["_"],
  outputPath = argv["o"];

function getFiles(source) {
  if (typeof source === "array") {
    return source;
  } else if (typeof source === "string") {
    return glob.sync(path.resolve(source))
  }
  return source
}

const fonts = getFiles(sourcePath)

if (!fonts) {
  log(chalk.keyword('Source directory does not contain any .ttf fonts'))
}

const replaceFontNameRegexp = /^@.*\{[^{]+?\}/gm;

const last = (arr) => {
  return arr && arr.length ? arr[arr.length - 1] : null;
}

function generateFont(source) {

  return new Promise((resolve, reject) => {

    const name = last(source.split('/')).replace('.ttf', '')
    const woffName = source.replace('.ttf', '.woff')
    log(chalk.green(`Reading ${name}`))

    // Read ttf font
    const ttfBuffer = fs.readFileSync(source)

    // Convert to woff and woff2
    const woff = ttf2woff(ttfBuffer)
    const woff2 = ttf2woff2(ttfBuffer)

    const woffHash = crypto.createHash('md5').update(woff.toString()).digest('hex')
    const ttfHash = crypto.createHash('md5').update(ttfBuffer).digest('hex')

    log(chalk.green(`Encoding ${name}`))
    const woff2Encode = new Buffer(woff2).toString('base64')
    const woffEncode = new Buffer(woff).toString('base64')

    resolve({
      name,
      woff2: { 
        data: woff2Encode,
      },
      woff: {
        hash: woffHash,
        data: woffEncode,
      },
      ttf: {
        hash: ttfHash,
        data: ttfBuffer
      }
    })
  })
}

function getPath(source, absoluteOutputPath) {
  if(source && source.length){
    return path.relative(absoluteOutputPath, path.dirname(source[0]))

  } else if(typeof source === "string") {
    return path.relative(absoluteOutputPath, path.dirname(source))
  }
}

const allFonts = fonts.map(font => generateFont(font)) 
      absoluteOutputPath = path.resolve(outputPath);

const relativeDist = getPath(sourcePath, absoluteOutputPath)

Promise.all(allFonts).then((data) => {
  log(chalk.green(`Writing fonts to disk`))
  data.forEach(data => {
    log(chalk.green(`writing font ${data.name}`))
    const content = template(data, relativeDist)
    fs.writeFileSync(`${absoluteOutputPath}/${data.name}.css`, content,'utf-8')
  })
}).then(() => {
  log(chalk.green(`Successfully encoded all fonts`))
})
