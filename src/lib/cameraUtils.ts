/**
 * Capture image from camera using getUserMedia API
 */
export const captureFromCamera = (): Promise<string | null> => {
  return new Promise((resolve) => {
    // Create video element for camera preview
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    
    // Create canvas for capturing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve(null);
      return;
    }

    // Request camera access
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
          // Set canvas size to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Create modal for camera preview
          const modal = document.createElement('div');
          modal.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
          `;
          
          const container = document.createElement('div');
          container.style.cssText = `
            position: relative;
            max-width: 90vw;
            max-height: 70vh;
          `;
          
          video.style.cssText = `
            width: 100%;
            height: auto;
            border-radius: 12px;
            background: #000;
          `;
          
          const buttonContainer = document.createElement('div');
          buttonContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: center;
          `;
          
          const captureButton = document.createElement('button');
          captureButton.textContent = '📷 Foto aufnehmen';
          captureButton.style.cssText = `
            padding: 12px 24px;
            background: #4ade80;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
          `;
          
          const cancelButton = document.createElement('button');
          cancelButton.textContent = 'Abbrechen';
          cancelButton.style.cssText = `
            padding: 12px 24px;
            background: #6b7280;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
          `;
          
          captureButton.onclick = () => {
            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0);
            
            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png');
            
            // Stop camera stream
            stream.getTracks().forEach(track => track.stop());
            
            // Remove modal
            document.body.removeChild(modal);
            
            resolve(dataUrl);
          };
          
          cancelButton.onclick = () => {
            // Stop camera stream
            stream.getTracks().forEach(track => track.stop());
            
            // Remove modal
            document.body.removeChild(modal);
            
            resolve(null);
          };
          
          container.appendChild(video);
          buttonContainer.appendChild(captureButton);
          buttonContainer.appendChild(cancelButton);
          modal.appendChild(container);
          modal.appendChild(buttonContainer);
          document.body.appendChild(modal);
        };
      })
      .catch((error) => {
        console.error('Error accessing camera:', error);
        alert('Kamera-Zugriff wurde verweigert oder ist nicht verfügbar.');
        resolve(null);
      });
  });
};

