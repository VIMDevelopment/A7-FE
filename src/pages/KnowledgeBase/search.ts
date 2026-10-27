import { KnowledgeArticle, KnowledgeBlock } from "./instructions";

export const normalizeSearch = (value: string) => value.trim().toLowerCase();

export const blockTexts = (block: KnowledgeBlock): string[] => {
  if (typeof block === "string") return [block];
  if ("bullets" in block) return block.bullets;
  if ("numbered" in block) return block.numbered;
  return [block.quote];
};

export const articleMatchesQuery = (article: KnowledgeArticle, query: string) => {
  if (!query) {
    return true;
  }

  const searchableText = [
    article.title,
    ...(article.paragraphs ?? []),
    ...(article.sections ?? []).flatMap((section) => [
      section.title,
      ...section.blocks.flatMap(blockTexts),
    ]),
    ...(article.steps ?? []),
    ...(article.tips ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query);
};
