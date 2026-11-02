import React, { useState } from "react";
import { Input } from "antd";
import Button from "../../components/Button/Button";
import { defaultApiAxiosParams } from "../../api/helpers";
import { showNotification } from "../../components/ShowNotification";
import { downloadJournal, type JournalKind } from "./journalDownload";

const JournalDownload = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState<JournalKind | null>(null);

  const handle = async (kind: JournalKind) => {
    setLoading(kind);
    try {
      await downloadJournal(kind, { from, to }, defaultApiAxiosParams);
    } catch {
      showNotification({ type: "error", message: "Не удалось выгрузить журнал" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", margin: "12px 0" }}>
      <span>Журнал облака (CSV): с</span>
      <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: 170 }} />
      <span>по</span>
      <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 170 }} />
      <Button onClick={() => void handle("deletion")} showSpinner={loading === "deletion"} disabled={!!loading}>
        Записи об удалении
      </Button>
      <Button onClick={() => void handle("action")} showSpinner={loading === "action"} disabled={!!loading}>
        Журнал действий
      </Button>
    </div>
  );
};

export default JournalDownload;
