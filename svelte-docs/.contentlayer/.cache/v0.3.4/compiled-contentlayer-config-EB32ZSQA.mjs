// contentlayer.config.js
import path from "node:path";
import { defineDocumentType, makeSource } from "contentlayer/source-files";
var computedFields = {
  slug: {
    type: "string",
    resolve: (doc) => doc._raw.flattenedPath.split("/").slice(1).join("/")
  },
  slugFull: {
    type: "string",
    resolve: (doc) => `/${doc._raw.flattenedPath}`
  },
  fileName: {
    type: "string",
    resolve: (doc) => path.parse(doc._raw.sourceFilePath.split("/").slice(-1).join("/")).name
  },
  suffix: {
    type: "string",
    resolve: (doc) => path.parse(doc._raw.sourceFilePath.split("/").slice(-1).join("/")).ext
  }
};
var Doc = defineDocumentType(() => ({
  name: "Doc",
  filePathPattern: `./*.md`,
  fields: {
    title: {
      type: "string",
      required: true
    },
    description: {
      type: "string",
      required: true
    },
    tagline: {
      type: "string",
      required: false
    }
  },
  computedFields
}));
var UtilityDoc = defineDocumentType(() => ({
  name: "UtilityDoc",
  filePathPattern: "utilities/**/*.md",
  fields: {
    title: {
      type: "string",
      required: true
    },
    description: {
      type: "string",
      required: true
    },
    category: {
      type: "string",
      required: true
    }
  },
  computedFields
}));
var contentlayer_config_default = makeSource({
  contentDirPath: "./content",
  documentTypes: [Doc, UtilityDoc],
  disableImportAliasWarning: true
});
export {
  Doc,
  UtilityDoc,
  contentlayer_config_default as default
};
//# sourceMappingURL=compiled-contentlayer-config-EB32ZSQA.mjs.map
