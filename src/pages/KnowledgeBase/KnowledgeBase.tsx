import React, { useMemo, useState } from "react";
import { Collapse } from "antd";
import css from "./index.module.css";
import Input from "../../components/Input/Input";
import { KNOWLEDGE_CATEGORIES, KnowledgeArticle } from "./instructions";

const normalizeSearch = (value: string) => value.trim().toLowerCase();

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

const ArticleContent: React.FC<{ article: KnowledgeArticle }> = ({
  article,
}) => (
  <div className={css.articleContent}>
    {article.paragraphs?.map((paragraph) => (
      <p key={paragraph} className={css.paragraph}>
        {paragraph}
      </p>
    ))}

    {article.steps && article.steps.length > 0 && (
      <ol className={css.steps}>
        {article.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    )}

    {article.tips && article.tips.length > 0 && (
      <div className={css.tips}>
        <div className={css.tipsTitle}>Полезно знать</div>
        <ul className={css.tipsList}>
          {article.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const KnowledgeBasePage = () => {
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    const query = normalizeSearch(search);

    return KNOWLEDGE_CATEGORIES.map((category) => ({
      ...category,
      articles: category.articles.filter((article) =>
        articleMatchesQuery(article, query)
      ),
    })).filter((category) => category.articles.length > 0);
  }, [search]);

  const hasResults = filteredCategories.length > 0;

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
                  label: article.title,
                  children: <ArticleContent article={article} />,
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
