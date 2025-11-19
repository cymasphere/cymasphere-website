// YouTube API type declarations
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, config: any) => any;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
      ready: (callback: () => void) => void;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export {};







