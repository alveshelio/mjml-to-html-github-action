import mjml2html from 'mjml'
import path from 'path'
import fs from 'fs/promises'
import appRoot from 'app-root-path'
import { getInput } from '@actions/core'
import { Dirent } from 'fs'

const input = getInput('input', { required: true })
const output = getInput('output', { required: true })

async function getHTLMFromMJML(filePath: string) {
  const fileContent = await fs.readFile(filePath, 'utf-8')
  return mjml2html(fileContent.toString()).html
}

async function findEmailTemplateFiles(directory: string) {
  let items: Dirent[] = []
  try {
    console.warn('directory', directory)
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
console.warn('appRoot', appRoot.path)

async function main() {
  const inputDir = `${appRoot.path}/${input}`
  const outputDir = `${appRoot.path}/${output}`

  const filePaths = await findEmailTemplateFiles(inputDir)

  const mjmlTemplatePaths = filePaths.filter(
    (emailTemplate) =>
      path.extname(emailTemplate).includes('mjml') && !emailTemplate.includes('partials')
  )
  console.warn('outputDir', outputDir)
  try {
    await fs.stat(outputDir)
    await fs.rm(outputDir, { recursive: true })
  } catch (e) {}

  for (const mjmlTemplatePath of mjmlTemplatePaths) {
    const [, ...mjmlTemplatePathParts] = mjmlTemplatePath.split('/')
    const fileName = mjmlTemplatePathParts.pop()?.split('.')[0]
    const partialHtmlOutputPath = mjmlTemplatePathParts.join('/')
    const htmlOutputDirectoryPath = `${outputDir}/${partialHtmlOutputPath}`
    console.warn('htmlOutputDirectoryPath', htmlOutputDirectoryPath)
    await fs.mkdir(htmlOutputDirectoryPath, { recursive: true })
    const htmlOutputFilePath = `${outputDir}/${partialHtmlOutputPath}/${fileName}.html`
    console.warn('htmlOutputFilePath', htmlOutputFilePath)
    await fs.writeFile(htmlOutputFilePath, await getHTLMFromMJML(mjmlTemplatePath), 'utf-8')
  }
}

main().then(() => {
  console.warn('finished building templates')
})
