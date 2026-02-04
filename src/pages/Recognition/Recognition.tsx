import React, { useState, useCallback } from "react";
import css from "./index.module.css";
import CameraCapture from "./components/CameraCapture";
import RecognitionResults from "./components/RecognitionResults";

const RecognitionPage = () => {
  const [matchedPhotoIds, setMatchedPhotoIds] = useState<string[]>([]);

  // Обработка успешного распознавания
  const handleRecognitionSuccess = useCallback((photoIds: string[]) => {
    setMatchedPhotoIds(photoIds);
  }, []);

  // Обработка распознавания заново
  const handleRecognizeAgain = useCallback(() => {
    setMatchedPhotoIds([]);
  }, []);

  return (
    <div className={css.container}>
      <div className={css.pageTitle}>Распознавание</div>

      <div className={css.content}>
        {matchedPhotoIds.length > 0 ? (
          <RecognitionResults
            photoIds={matchedPhotoIds}
            onRecognizeAgain={handleRecognizeAgain}
          />
        ) : (
          <CameraCapture
            onRecognitionSuccess={handleRecognitionSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default RecognitionPage;
