const fs = require('fs');
const os = require('os');
const path = require('path');

const extract = require('extract-zip');
const Gauge = require('gauge');
const request = require('request');
const progress = require('request-progress');
const mkdirp = require('mkdirp-then');


function downloadZip(url, outPath) {
  const gauge = new Gauge();
  const r = request(url);
  return new Promise((resolve, reject) => {
    progress(r)
      .on('progress', (state) => {
        gauge.show(`Downloading ${url}`, state.percent);
        gauge.pulse();
      })
      .pipe(fs.createWriteStream(outPath))
      .on('error', (err) => {
        r.abort();
        reject(err);
      })
      .on('finish', resolve);
  });
}


module.exports = function zipInstall(url, location) {
  const dir = path.join(os.tmpdir(), 'node-zip-install');
  const zipLocation = path.join(dir, encodeURIComponent(url));
  return mkdirp(dir)
    .then(() => downloadZip(url, zipLocation))
    .then(() => new Promise((resolve, reject) => {
      extract(zipLocation, { dir: path.resolve(location) }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }));
};
