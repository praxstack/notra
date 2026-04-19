import fs from "node:fs";
import path from "node:path";
import type { Skill, SkillMetadata } from "@notra/ai/types/tools";
import { type Tool, tool } from "ai";
import matter from "gray-matter";
import z from "zod";

function parseSkillFrontmatter(content: string): Partial<SkillMetadata> {
  const parsed = matter(content);
  return {
    name: parsed.data.name,
    version: parsed.data.version,
    description: parsed.data.description,
    "allowed-tools": parsed.data["allowed-tools"],
  };
}

function getSkillMetadata(
  skillFolder: string,
  skillsDir: string
): SkillMetadata {
  const skillPath = path.join(skillsDir, skillFolder);
  const skillMdPath = path.join(skillPath, "SKILL.md");

  if (!fs.existsSync(skillMdPath)) {
    return { name: skillFolder, folder: skillFolder, filename: "SKILL.md" };
  }

  const content = fs.readFileSync(skillMdPath, "utf-8");
  const metadata = parseSkillFrontmatter(content);

  return {
    name: metadata.name || skillFolder,
    version: metadata.version,
    description: metadata.description,
    "allowed-tools": metadata["allowed-tools"],
    folder: skillFolder,
    filename: "SKILL.md",
  };
}

export function listAvailableSkills(): Tool {
  return tool({
    description:
      "List available writing skills. Returns name, version, description, and folder for each. Call getSkillByName to load a skill's full content.",
    inputSchema: z.object({
      limit: z.number().default(10).describe("The number of skills to list"),
      offset: z
        .number()
        .default(0)
        .describe("The offset to start listing skills from"),
    }),
    execute: async ({ limit, offset }) => {
      const skillsDir = getSkillsDir();
      const skillFolders = fs
        .readdirSync(skillsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      const skills = skillFolders
        .slice(offset, offset + limit)
        .map((folder) => getSkillMetadata(folder, skillsDir));

      return {
        skills,
        total: skillFolders.length,
      };
    },
  });
}

function getSkillsDir(): string {
  const candidates = [
    path.join(process.cwd(), "src", "lib", "ai", "skills"),
    path.join(process.cwd(), "packages", "ai", "src", "skills"),
    path.join(process.cwd(), "..", "..", "packages", "ai", "src", "skills"),
  ];

  const skillsDir = candidates.find((candidate) => fs.existsSync(candidate));

  if (!skillsDir) {
    throw new Error(
      `Skills directory not found. Checked: ${candidates.join(", ")}`
    );
  }

  return skillsDir;
}

export function getSkillByName(): Tool {
  return tool({
    description:
      "Load a skill's full content by name or folder. Call listAvailableSkills first to discover available names.",
    inputSchema: z.object({
      name: z
        .string()
        .describe(
          "The name of the skill to get. Can be the skill's name from frontmatter or the folder name."
        ),
    }),
    execute: async ({ name }) => {
      const skillsDir = getSkillsDir();
      const skillFolders = fs
        .readdirSync(skillsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      let skillFolder: string | undefined;

      for (const folder of skillFolders) {
        const skillPath = path.join(skillsDir, folder);
        const skillMdPath = path.join(skillPath, "SKILL.md");

        if (fs.existsSync(skillMdPath)) {
          const content = fs.readFileSync(skillMdPath, "utf-8");
          const parsed = matter(content);
          const skillName = parsed.data.name;

          if (
            folder.toLowerCase() === name.toLowerCase() ||
            skillName?.toLowerCase() === name.toLowerCase()
          ) {
            skillFolder = folder;
            break;
          }
        } else if (folder.toLowerCase() === name.toLowerCase()) {
          skillFolder = folder;
          break;
        }
      }

      if (!skillFolder) {
        return {
          error: `Skill "${name}" not found. Use list_available_skills to see all available skills.`,
        };
      }

      const skillPath = path.join(skillsDir, skillFolder);
      const skillMdPath = path.join(skillPath, "SKILL.md");

      if (!fs.existsSync(skillMdPath)) {
        return {
          error: `Skill file not found for "${skillFolder}".`,
        };
      }

      const content = fs.readFileSync(skillMdPath, "utf-8");
      const parsed = matter(content);
      const metadata = parseSkillFrontmatter(content);

      return {
        name: metadata.name || skillFolder,
        version: metadata.version,
        description: metadata.description,
        "allowed-tools": metadata["allowed-tools"],
        folder: skillFolder,
        filename: "SKILL.md",
        content: parsed.content,
      } satisfies Skill;
    },
  });
}
