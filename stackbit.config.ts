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
          type: "page",
          urlPath: "/",
          filePath: "content.json", // Editor now writes here!
          fields: [
            { name: "hero_title", type: "string", label: "Hero Title" },
            { name: "hero_subtext", type: "string", label: "Hero Subtext" },
            { name: "dr_rohit_name", type: "string", label: "Dr. Rohit Name" },
            { name: "dr_rohit_bio", type: "string", label: "Dr. Rohit Bio" },
            { name: "dr_shallu_name", type: "string", label: "Dr. Shallu Name" },
            { name: "dr_shallu_bio", type: "string", label: "Dr. Shallu Bio" },
            { name: "footer_address", type: "string", label: "Address" }
          ]
        }
      ]
    })
  ]
});
