import type {
  IrisImageMarker,
  IrisImageResolution,
} from "@notra/ai/types/autonomy-capabilities";

const IRIS_IMAGE_MARKER_PATTERN =
  /^[^\S\r\n]*\[iris-image:([^\]\r\n]*)\][^\S\r\n]*$/gm;
const COLLAPSE_BLANK_LINES_PATTERN = /\n{3,}/g;
const MARKDOWN_ALT_TEXT_ESCAPE_PATTERN = /([\\[\]])/g;
const MARKDOWN_URL_UNSAFE_PATTERN = /[\s()]/;

export const parseIrisImageMarkers = (markdown: string): IrisImageMarker[] => {
  const markers: IrisImageMarker[] = [];
  for (const match of markdown.matchAll(IRIS_IMAGE_MARKER_PATTERN)) {
    const description = (match[1] ?? "").trim();
    if (description.length > 0) {
      markers.push({ index: markers.length, raw: match[0], description });
    }
  }
  return markers;
};

export const applyIrisImageResolutions = (
  markdown: string,
  resolutions: readonly IrisImageResolution[]
): string => {
  const replacementByIndex = new Map<number, string | null>(
    resolutions.map((resolution) => [resolution.index, resolution.replacement])
  );
  let markerIndex = 0;
  const replaced = markdown.replace(
    IRIS_IMAGE_MARKER_PATTERN,
    (_matched, description: string) => {
      if (description.trim().length === 0) {
        return "";
      }
      const currentIndex = markerIndex;
      markerIndex += 1;
      return replacementByIndex.get(currentIndex) ?? "";
    }
  );

  return replaced.replace(COLLAPSE_BLANK_LINES_PATTERN, "\n\n").trim();
};

export const buildIrisImageMarkdown = (params: {
  altText: string;
  imageUrl: string;
}): string => {
  const altText = params.altText.replace(
    MARKDOWN_ALT_TEXT_ESCAPE_PATTERN,
    "\\$1"
  );
  const imageUrl = MARKDOWN_URL_UNSAFE_PATTERN.test(params.imageUrl)
    ? `<${params.imageUrl}>`
    : params.imageUrl;

  return `![${altText}](${imageUrl})`;
};
