import type { LayoutPreset, SectionType } from "@cvcreator/document-model";

export interface TemplateCapabilityMap {
  draggableSections: SectionType[];
  contextMenuSections: SectionType[];
  htmlEditableSections: SectionType[];
}

export interface TemplateManifest {
  id: string;
  name: string;
  description: string;
  compatibleLayouts: LayoutPreset["id"][];
  capabilityMap: TemplateCapabilityMap;
}

export const builtInTemplateManifests: TemplateManifest[] = [
  {
    id: "core-resume-template",
    name: "Core Resume Template",
    description: "Base manifest that keeps every mandatory section editable and movable.",
    compatibleLayouts: ["executive-split", "editorial-column", "folio-balance"],
    capabilityMap: {
      draggableSections: [
        "title-summary",
        "contact",
        "photo",
        "experience",
        "education",
        "hard-skills",
        "soft-skills",
        "languages",
      ],
      contextMenuSections: [
        "title-summary",
        "contact",
        "photo",
        "experience",
        "education",
        "hard-skills",
        "soft-skills",
        "languages",
      ],
      htmlEditableSections: [
        "title-summary",
        "contact",
        "photo",
        "experience",
        "education",
        "hard-skills",
        "soft-skills",
        "languages",
      ],
    },
  },
];
