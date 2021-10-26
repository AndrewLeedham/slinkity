const { toMountPoint } = require('./toMountPoint')
const toFormattedDataForProps = require('./toFormattedDataForProps')
const { join } = require('path')
const { IMPORT_ALIASES } = require('../../../utils/consts')

function toAbsImport(inputPath) {
  return join(IMPORT_ALIASES.root, inputPath)
}

/**
 * @param {object} eleventyConfig
 * @typedef AddPageExtParams
 * @property {import('../../componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../../../cli/toViteSSR').ViteSSR} viteSSR
 * @param {AddPageExtParams}
 */
module.exports = function addPageExtension(eleventyConfig, { componentAttrStore, viteSSR }) {
  eleventyConfig.addExtension('tsx', {
    read: false,
    getData: async (inputPath) => {
      const { frontMatter } = await viteSSR.toComponentCommonJSModule(toAbsImport(inputPath))
      return frontMatter
    },
    compile: (_, inputPath) =>
      async function (data) {
        const absInputPath = toAbsImport(inputPath)
        const { getProps, frontMatter } = await viteSSR.toComponentCommonJSModule(absInputPath)

        const props = await getProps(
          toFormattedDataForProps({
            ...data,
            shortcodes: eleventyConfig.javascriptFunctions ?? {},
          }),
        )
        const hydrate = frontMatter.render ?? 'eager'
        const id = componentAttrStore.push({
          path: absInputPath,
          props,
          styleToFilePathMap: {},
          hydrate,
          pageOutputPath: data.page.outputPath,
        })

        return toMountPoint({ id, hydrate })
      },
  })
}
