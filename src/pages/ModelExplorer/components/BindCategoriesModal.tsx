import React, { FC, useState } from "react";
import { Select } from "antd";
import { useQueryClient } from "react-query";
import Modal from "../../../components/Modal/Modal";
import { showNotification } from "../../../components/ShowNotification";
import { useGetPrompts } from "../../../apiV2/a7-service";
import { defaultApiAxiosParams } from "../../../api/helpers";
import { CategoryWithProcessing, useBindCategory } from "../../../api/processingApi";

type Props = {
  open: boolean;
  chainId: string;
  chainTitle: string;
  onClose: () => void;
};

/**
 * «Назначить категории» из результатов прогона (R-39.1): привязка делается там, где видно
 * доказательство — картинки рядом с эталоном и цена. Истина хранится у категории.
 */
const BindCategoriesModal: FC<Props> = ({ open, chainId, chainTitle, onClose }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { data: promptsData } = useGetPrompts({ axios: defaultApiAxiosParams });
  const categories = (promptsData?.data ?? []) as CategoryWithProcessing[];
  const bind = useBindCategory();

  const handleOk = async () => {
    let done = 0;
    for (const categoryId of selected) {
      try {
        await bind.mutateAsync({ categoryId, chainId });
        done += 1;
      } catch (err) {
        showNotification({
          type: "error",
          message:
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Не удалось привязать категорию",
        });
      }
    }
    if (done > 0) {
      showNotification({ type: "success", message: `Привязано категорий: ${done} → «${chainTitle}»` });
      void queryClient.invalidateQueries({ queryKey: ["/prompts"] });
    }
    setSelected([]);
    onClose();
  };

  return (
    <Modal
      title={`Назначить категории цепочке «${chainTitle}»`}
      open={open}
      onOk={handleOk}
      onCancel={() => {
        setSelected([]);
        onClose();
      }}
      okButtonName={`Привязать (${selected.length})`}
      cancelButtonName="Отмена"
      okButtonDisabled={selected.length === 0}
      isLoading={bind.isLoading}
    >
      <p>
        Все промпты выбранных категорий будут обрабатываться этой цепочкой вместо nano-banana-pro.
        Сохраняется снимок шагов: правка цепочки в конфигураторе привязку не меняет.
      </p>
      <Select
        mode="multiple"
        style={{ width: "100%" }}
        placeholder="Выберите категории"
        value={selected}
        onChange={(value: string[]) => setSelected(value)}
        optionFilterProp="label"
        options={categories.map((c) => ({
          value: c.id ?? "",
          label:
            c.processing?.chainId === chainId
              ? `${c.title} · уже привязана`
              : c.processing
                ? `${c.title} · сейчас: ${c.processing.chainTitle}`
                : c.title ?? "",
        }))}
      />
    </Modal>
  );
};

export default BindCategoriesModal;
