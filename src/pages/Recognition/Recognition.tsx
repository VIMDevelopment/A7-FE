import React, { useState } from "react";
import css from "./index.module.css";
import CameraModal from "./components/CameraModal/CameraModal";
import Button from "../../components/Button/Button";

const RecognitionPage = () => {
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const handleOpenCameraModal = () => {
    setIsCameraModalOpen(true);
  };

  const handleCloseCameraModal = () => {
    setIsCameraModalOpen(false);
  };

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Распознавание</div>

      <div className={css.content}>
        <Button onClick={handleOpenCameraModal} className={css.recognizeButton}>
          Распознать
        </Button>
      </div>

      <CameraModal open={isCameraModalOpen} onClose={handleCloseCameraModal} />
    </div>
  );
};

export default RecognitionPage;
