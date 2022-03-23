import mjml2html from 'mjml'
import path from 'path'
import fs from 'fs/promises'
import { Dirent } from 'fs'
import { getInput } from '@actions/core'
const input = getInput('input', { required: true })
const output = getInput('output', { required: true })

async function getHTLMFromMJML(filePath: string) {
  const fileContent = await fs.readFile(filePath, 'utf-8')
  return mjml2html(fileContent.toString()).html
}

async function findEmailTemplateFiles(directory: string) {
  let items: Dirent[] = []
  try {
    items = await fs.readdir(directory, { withFileTypes: true })
    const fileNames = items
      .filter((file) => !file.isDirectory())
      .map((file) => `${directory}/${file.name}`)
    const folders = items.filter((item) => item.isDirectory())
    for (const folder of folders) {
      fileNames.push(...(await findEmailTemplateFiles(`${directory}/${folder.name}`)))
    }

    return fileNames
  } catch (e) {
    console.warn('could not find directory', input)
    return []
  }
}

async function main() {
  const inputDir = path.resolve(`./${input}`)
  const outputDir = `./${output}`

  const filePaths = await findEmailTemplateFiles(inputDir)

  const mjmlTemplatePaths = filePaths.filter(
    (filePath) => path.extname(filePath).includes('mjml') && !filePath.includes('partials')
  )
  try {
    await fs.stat(outputDir)
    await fs.rm(outputDir, { recursive: true })
  } catch (e) {}

  for (const mjmlTemplatePath of mjmlTemplatePaths) {
    const extension = path.extname(mjmlTemplatePath)
    const fileName = path.basename(mjmlTemplatePath, extension)
    const mjmlTemplateParts = mjmlTemplatePath.replace(inputDir, outputDir).split('/')
    mjmlTemplateParts.pop()
    const htmlOutputPath = mjmlTemplateParts.join('/')
    console.warn('will create directory', htmlOutputPath)
    await fs.mkdir(htmlOutputPath, { recursive: true })
    const htmlOutputFilePath = `${htmlOutputPath}/${fileName}.html`
    console.warn('will create file', htmlOutputFilePath)
    await fs.writeFile(htmlOutputFilePath, await getHTLMFromMJML(mjmlTemplatePath), 'utf-8')
  }
}

main().then(() => {
  console.warn('finished building templates')
})
