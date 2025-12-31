/**
 * Record audio from microphone
 */
export const recordAudio = (): Promise<{ start: () => void; stop: () => Promise<Blob | null> }> => {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        const start = () => {
          audioChunks.length = 0;
          mediaRecorder.start();
        };

        const stop = (): Promise<Blob | null> => {
          return new Promise((resolveStop) => {
            mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
              // Stop all tracks
              stream.getTracks().forEach(track => track.stop());
              resolveStop(audioBlob);
            };

            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            } else {
              resolveStop(null);
            }
          });
        };

        resolve({ start, stop });
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
        reject(error);
      });
  });
};

/**
 * Convert Blob to base64 data URL
 */
export const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert base64 data URL to Blob
 */
export const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'audio/webm';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Play audio from data URL
 */
export const playAudio = (dataURL: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio(dataURL);
    audio.onended = () => resolve();
    audio.onerror = reject;
    audio.play().catch(reject);
  });
};

