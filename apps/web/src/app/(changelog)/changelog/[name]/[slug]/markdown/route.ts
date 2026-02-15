import { readFile } from "node:fs/promises";
import path from "node:path";
import { changelog } from "@/../.source/server";
import { getCompany } from "@/utils/changelog";

interface RouteProps {
  params: Promise<{ name: string; slug: string }>;
}

function markdownResponse(content: string, status = 200) {
  return new Response(content, {
    status,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      vary: "accept",
    },
  });
}

function stripFrontmatter(source: string) {
  return source.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
}

export async function GET(_: Request, { params }: RouteProps) {
  const { name, slug } = await params;
  const company = getCompany(name);
  const entry = changelog.find(
    (item) => item.info.path === `${name}/${slug}.mdx`
  );

  if (!company || !entry) {
    return markdownResponse("# Not found\n", 404);
  }

  const filePath = path.join(
    process.cwd(),
    "src/content/changelog",
    entry.info.path
  );
  const mdxSource = await readFile(filePath, "utf8");
  const body = stripFrontmatter(mdxSource);

  const markdown = [
    `# ${entry.title}`,
    "",
    `Date: ${entry.date}`,
    `Company: ${company.name}`,
    "",
    body,
    "",
  ].join("\n");

  return markdownResponse(markdown);
}
