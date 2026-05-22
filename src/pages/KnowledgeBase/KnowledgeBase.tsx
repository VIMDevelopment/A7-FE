import React, { useMemo, useState } from "react";
import { Collapse } from "antd";
import { PictureOutlined } from "@ant-design/icons";
import css from "./index.module.css";
import Input from "../../components/Input/Input";
import {
  KNOWLEDGE_CATEGORIES,
  KnowledgeArticle,
  KnowledgeScreenshot,
} from "./instructions";
import { useShowPermissions } from "../../auth/userData";
import { ROUTES } from "../../routes/constants";

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query) {
    return text;
  }

  const lowerText = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let startIndex = 0;
  let matchIndex = lowerText.indexOf(query, startIndex);

  while (matchIndex !== -1) {
    if (matchIndex > startIndex) {
      parts.push(text.slice(startIndex, matchIndex));
    }

    parts.push(
      <mark key={`${matchIndex}-${text}`} className={css.highlight}>
        {text.slice(matchIndex, matchIndex + query.length)}
      </mark>
    );

    startIndex = matchIndex + query.length;
    matchIndex = lowerText.indexOf(query, startIndex);
  }

  if (startIndex < text.length) {
    parts.push(text.slice(startIndex));
  }

  return parts.length > 0 ? parts : text;
};

const articleMatchesQuery = (article: KnowledgeArticle, query: string) => {
  if (!query) {
    return true;
  }

  const searchableText = [
    article.title,
    ...(article.paragraphs ?? []),
    ...(article.steps ?? []),
    ...(article.tips ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query);
};

const Screenshot: React.FC<KnowledgeScreenshot> = ({ src, caption }) => {
  const [hasError, setHasError] = useState(false);
  const fileName = src.split("/").pop() ?? src;

  return (
    <figure className={css.screenshot}>
      {hasError ? (
        <div className={css.screenshotPlaceholder}>
          <PictureOutlined className={css.screenshotPlaceholderIcon} />
          <span>
            Скрин ещё не загружен: <code>{fileName}</code>
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={caption}
          loading="lazy"
          className={css.screenshotImg}
          onError={() => setHasError(true)}
        />
      )}
      <figcaption className={css.screenshotCaption}>{caption}</figcaption>
    </figure>
  );
};

const ArticleContent: React.FC<{
  article: KnowledgeArticle;
  query: string;
}> = ({ article, query }) => (
  <div className={css.articleContent}>
    {article.paragraphs?.map((paragraph) => (
      <p key={paragraph} className={css.paragraph}>
        {highlightText(paragraph, query)}
      </p>
    ))}

    {article.screenshots && article.screenshots.length > 0 && (
      <div className={css.screenshots}>
        {article.screenshots.map((screenshot) => (
          <Screenshot key={screenshot.src} {...screenshot} />
        ))}
      </div>
    )}

    {article.steps && article.steps.length > 0 && (
      <ol className={css.steps}>
        {article.steps.map((step) => (
          <li key={step}>{highlightText(step, query)}</li>
        ))}
      </ol>
    )}

    {article.tips && article.tips.length > 0 && (
      <div className={css.tips}>
        <div className={css.tipsTitle}>Полезно знать</div>
        <ul className={css.tipsList}>
          {article.tips.map((tip) => (
            <li key={tip}>{highlightText(tip, query)}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const KnowledgeBasePage = () => {
  const [search, setSearch] = useState("");
  const { hasPrivileges, getRoutePrivileges } = useShowPermissions();

  const accessibleCategories = useMemo(() => {
    return KNOWLEDGE_CATEGORIES.filter((category) => {
      if (!category.routePath) return true;
      const route = ROUTES.find((item) => item.path === category.routePath);
      if (!route) return true;
      return hasPrivileges(getRoutePrivileges(route));
    });
  }, [hasPrivileges, getRoutePrivileges]);

  const filteredCategories = useMemo(() => {
    const query = normalizeSearch(search);

    return accessibleCategories
      .map((category) => ({
        ...category,
        articles: category.articles.filter((article) =>
          articleMatchesQuery(article, query)
        ),
      }))
      .filter((category) => category.articles.length > 0);
  }, [accessibleCategories, search]);

  const hasResults = filteredCategories.length > 0;
  const query = normalizeSearch(search);

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>База знаний</div>
      <p className={css.subtitle}>
        Инструкции по работе с разделами сайта
      </p>

      <div className={css.searchWrapper}>
        <Input
          label="Поиск по инструкциям"
          placeholder="Например: загрузка, промпт, распознавание"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!hasResults ? (
        <div className={css.emptyState}>
          По запросу «{search}» ничего не найдено
        </div>
      ) : (
        <div className={css.categories}>
          {filteredCategories.map((category) => (
            <section key={category.id} className={css.category}>
              <h2 className={css.categoryTitle}>{category.title}</h2>
              <Collapse
                className={css.collapse}
                items={category.articles.map((article) => ({
                  key: article.id,
                  label: highlightText(article.title, query),
                  children: <ArticleContent article={article} query={query} />,
                }))}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBasePage;
