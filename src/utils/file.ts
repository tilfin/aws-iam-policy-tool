import fs from 'fs'
import path from 'path'

export function listJsonFiles(parentDir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
      fs.readdir(parentDir, (err, files) => {
          if (err) {
            reject(err);
            return
          }

          const fileList = files.map(file => {
            return path.resolve(parentDir, file);
          }).filter(file => {
            return fs.statSync(file).isFile() && /.*\.json$/.test(file)
          })
          resolve(fileList)
        })
    })
}

export function readFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, text) => {
      if (err) reject(err);
      else resolve(text)
    })
  })
}

export function writeJSONFile(dir: string, fileName: string, content: any): Promise<void> {
  const filePath = path.join(dir, fileName);
  const json = JSON.stringify(content, null, 4);
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, json, function(err) {
      if (err) reject(err)
      else resolve()
    })
  })
}
