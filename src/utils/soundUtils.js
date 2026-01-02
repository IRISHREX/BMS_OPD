/**
 * Utility functions to play sound effects
 * Uses global settings: window.globalSoundVolume (0-1) and window.globalSoundMuted (boolean)
 */

// Initialize global sound settings from localStorage
if (typeof window !== 'undefined') {
  const storedVolume = localStorage.getItem('soundVolume');
  const storedMuted = localStorage.getItem('soundMuted');
  window.globalSoundVolume = storedVolume ? parseFloat(storedVolume) / 100 : 0.5;
  window.globalSoundMuted = storedMuted ? JSON.parse(storedMuted) : false;
}

export const playSound = (soundName) => {
  // Check if sound is muted
  if (window.globalSoundMuted) {
    return;
  }

  try {
    const audio = new Audio(`/${soundName}`);
    // Use global volume setting (0-1 scale)
    audio.volume = window.globalSoundVolume || 0.5;
    audio.play().catch(error => {
      console.warn(`Failed to play ${soundName}:`, error);
    });
  } catch (error) {
    console.warn(`Error creating audio for ${soundName}:`, error);
  }
};

export const playSaveSound = () => {
  playSound('save.mp3');
};

export const playLoadSound = () => {
  playSound('mech_reload.mp3');
};

export const playLoadSound2 = () => {
  playSound('mech_reload2.mp3');
};

export const playDeleteSound = () => {
  playSound('delete.mp3');
};
