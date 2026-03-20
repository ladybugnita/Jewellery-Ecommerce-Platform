import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import './WebcamCapture.css'; 

const WebcamCapture = ({ onCapture, onClose }) => {
  const webcamRef = useRef(null);
  const [image, setImage] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
  }, [webcamRef]);

  const saveImage = () => {
    if (image) {
      onCapture(image);
      onClose();
    }
  };

  const retake = () => {
    setImage(null);
  };

  return (
    <div className="webcam-modal">
      <div className="webcam-container">
        {!image ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{ facingMode: 'user' }}
            />
            <button className="capture-btn" onClick={capture}>
              Capture Photo
            </button>
          </>
        ) : (
          <>
            <img src={image} alt="captured" className="captured-preview" />
            <div className="webcam-actions">
              <button onClick={retake}>Retake</button>
              <button onClick={saveImage}>Use This Photo</button>
            </div>
          </>
        )}
        <button className="close-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default WebcamCapture;