import mjml2html from 'mjml'
import path from 'path'
import fs from 'fs'
import appRoot from 'app-root-path'
import { getInput } from '@actions/core'

const input = getInput('input', { required: true })
const output = getInput('output', { required: true })

async function getHTLMFromMJML(filePath: string) {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  return mjml2html(fileContent.toString()).html
}

async function findEmailTemplateFiles(directory: string) {
  const items = fs.readdirSync(directory, { withFileTypes: true })
  const fileNames = items
    .filter((file) => !file.isDirectory())
    .map((file) => `${directory}/${file.name}`)
  const folders = items.filter((item) => item.isDirectory())
  for (const folder of folders) {
    fileNames.push(...(await findEmailTemplateFiles(`${directory}/${folder.name}`)))
  }

  return fileNames
}

async function main() {
  const filePaths = await findEmailTemplateFiles(input)
  const mjmlTemplatePaths = filePaths.filter(
    (emailTemplate) =>
      path.extname(emailTemplate).includes('mjml') && !emailTemplate.includes('partials')
  )
  const outputDir = `${appRoot}/${output}`
  fs.statSync(outputDir)
  fs.rmSync(outputDir, { recursive: true })

  for (const mjmlTemplatePath of mjmlTemplatePaths) {
    const [, ...mjmlTemplatePathParts] = mjmlTemplatePath.split('/')
    const fileName = mjmlTemplatePathParts.pop()?.split('.')[0]
    const partialHtmlOutputPath = mjmlTemplatePathParts.join('/')
    const htmlOutputDirectoryPath = `${outputDir}/${partialHtmlOutputPath}`
    await fs.mkdirSync(htmlOutputDirectoryPath, { recursive: true })
    const htmlOutputFilePath = `${outputDir}/${partialHtmlOutputPath}/${fileName}.html`
    await fs.writeFileSync(htmlOutputFilePath, await getHTLMFromMJML(mjmlTemplatePath), 'utf-8')
  }
}

main().then(() => {
  console.warn('finished building templates')
})
