import React from "react";
import { DownloadOutlined } from "@ant-design/icons";
import css from "./index.module.css";
import {
  POLICY_META,
  POLICY_SECTIONS,
  POLICY_SIGNATURE,
  PolicyBlock,
} from "./policyContent";

const POLICY_PDF_URL = "/policy.pdf";
const POLICY_FILE_NAME = "Политика обработки персональных данных.pdf";

const renderBlock = (block: PolicyBlock, index: number) => {
  if (block.type === "list") {
    return (
      <ul key={index} className={css.list}>
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <p key={index} className={css.paragraph}>
      {block.text}
    </p>
  );
};

const PolicyPage = () => {
  return (
    <div className={css.container}>
      <header className={css.header}>
        <div className={css.headerInner}>
          <a href="/" className={css.brand} aria-label="WanmaX">
            <img
              src="/images/logo.png"
              alt="WanmaX"
              className={css.brandLogo}
            />
            <span className={css.brandName}>WanmaX</span>
          </a>

          <a
            href={POLICY_PDF_URL}
            download={POLICY_FILE_NAME}
            className={css.downloadBtn}
          >
            <DownloadOutlined />
            <span>Скачать PDF</span>
          </a>
        </div>
      </header>

      <main className={css.main}>
        <article className={css.document}>
          <h1 className={css.title}>{POLICY_META.title}</h1>
          <p className={css.subtitle}>{POLICY_META.subtitle}</p>

          <dl className={css.meta}>
            {POLICY_META.details.map((item) => (
              <div key={item.label} className={css.metaRow}>
                <dt className={css.metaLabel}>{item.label}</dt>
                <dd className={css.metaValue}>{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className={css.toc}>
            <div className={css.tocTitle}>Содержание</div>
            <ol className={css.tocList}>
              {POLICY_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#section-${section.id}`} className={css.tocLink}>
                    {section.number}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          {POLICY_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={`section-${section.id}`}
              className={css.section}
            >
              <h2 className={css.sectionTitle}>
                <span className={css.sectionNumber}>{section.number}.</span>{" "}
                {section.title}
              </h2>
              {section.blocks.map(renderBlock)}
            </section>
          ))}

          <div className={css.signature}>
            <p className={css.paragraph}>{POLICY_SIGNATURE.role}</p>
            <p className={css.signatureLine}>
              {POLICY_SIGNATURE.signatureLine}
            </p>
            <p className={css.paragraph}>{POLICY_SIGNATURE.date}</p>
          </div>
        </article>
      </main>
    </div>
  );
};

export default PolicyPage;
