// Notification sound utility
let audioContext: AudioContext | null = null;

// Initialize audio context on first user interaction
export const initAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to create audio context:', error);
    }
  }
  return audioContext;
};

export const playNotificationSound = async () => {
  try {
    // Initialize or resume audio context
    const ctx = initAudioContext();
    if (!ctx) return;
    
    // Resume audio context if suspended (required by browsers)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    // First beep
    const oscillator1 = ctx.createOscillator();
    const gainNode1 = ctx.createGain();
    
    oscillator1.connect(gainNode1);
    gainNode1.connect(ctx.destination);
    
    oscillator1.frequency.value = 800;
    oscillator1.type = 'sine';
    
    gainNode1.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator1.start(ctx.currentTime);
    oscillator1.stop(ctx.currentTime + 0.1);
    
    // Second beep after 100ms
    setTimeout(() => {
      const oscillator2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(ctx.destination);
      
      oscillator2.frequency.value = 1000;
      oscillator2.type = 'sine';
      
      gainNode2.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      oscillator2.start(ctx.currentTime);
      oscillator2.stop(ctx.currentTime + 0.1);
    }, 100);
    
    console.log('Notification sound played');
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
};
