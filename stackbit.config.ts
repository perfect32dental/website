import { defineStackbitConfig } from "@stackbit/types";
import { GitContentSource } from "@stackbit/cms-git";

export default defineStackbitConfig({
  stackbitVersion: "~0.6.0",
  ssgName: "custom",
  contentSources: [
    new GitContentSource({
      rootPath: __dirname,
      contentDirs: ["./"],
      models: [
        {
          name: "Page",
          type: "page", // This tells Stackbit it's a visual page
          hideContent: true,
          urlPath: "/",
          filePath: "index.html",
          fields: [
            { name: "hero_title", type: "string" },
            { name: "hero_subtext", type: "string" },
            { name: "dr_rohit_name", type: "string" },
            { name: "dr_rohit_bio", type: "string" },
            { name: "dr_shallu_name", type: "string" },
            { name: "dr_shallu_bio", type: "string" },
            { name: "footer_address", type: "string" }
          ]
        }
      ]
    })
  ]
});
