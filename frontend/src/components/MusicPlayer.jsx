import { useEffect, useRef } from 'react';
import './MusicPlayer.css';

export default function MusicPlayer({
  song,
  roomId,
  socket,
  isPlaying,
  setIsPlaying,
  muted,
  toggleMute,
  onTimeUpdate,
  onLoadedMetadata,
  onSongEnded,
  audioRef
}) {
  const playerContainerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  // Always keep a fresh reference to onSongEnded so the YT closure never goes stale
  const onSongEndedRef = useRef(onSongEnded);
  useEffect(() => { onSongEndedRef.current = onSongEnded; }, [onSongEnded]);

  const isYouTube = song?.source === 'youtube';

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (!document.getElementById('yt-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }, []);

  // Create / recreate YouTube player whenever the video ID changes
  useEffect(() => {
    if (!isYouTube || !song?.id) return;

    const createPlayer = () => {
      if (!playerContainerRef.current) return;

      // Destroy old player first
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch (e) {}
        ytPlayerRef.current = null;
      }

      // YT replaces the target element with an iframe — give it a fresh div each time
      playerContainerRef.current.innerHTML = '';
      const div = document.createElement('div');
      playerContainerRef.current.appendChild(div);

      ytPlayerRef.current = new window.YT.Player(div, {
        videoId: song.id,
        height: '0',
        width: '0',
        playerVars: { autoplay: 1, controls: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            muted ? e.target.mute() : e.target.unMute();
            e.target.playVideo();
          },
          onStateChange: (event) => {
            const S = window.YT.PlayerState;
            if (event.data === S.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === S.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === S.ENDED) {
              setIsPlaying(false);
              onSongEndedRef.current?.();
            }
          }
        }
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
    }

    // Poll current time for lyrics sync
    const interval = setInterval(() => {
      const p = ytPlayerRef.current;
      if (p?.getCurrentTime) {
        try { onTimeUpdate?.(p.getCurrentTime(), p.getDuration() || 0); } catch (e) {}
      }
    }, 500);

    return () => clearInterval(interval);
  }, [song?.id, isYouTube]);

  // Sync play / pause state → YT player
  useEffect(() => {
    if (!isYouTube || !ytPlayerRef.current) return;
    try {
      isPlaying ? ytPlayerRef.current.playVideo() : ytPlayerRef.current.pauseVideo();
    } catch (e) {}
  }, [isPlaying, isYouTube]);

  // Sync mute state → YT player
  useEffect(() => {
    if (!isYouTube || !ytPlayerRef.current) return;
    try {
      muted ? ytPlayerRef.current.mute() : ytPlayerRef.current.unMute();
    } catch (e) {}
  }, [muted, isYouTube]);

  const handlePlayPause = () => {
    if (isPlaying) {
      socket?.emit('pause-song', roomId);
      setIsPlaying(false);
    } else {
      socket?.emit('play-song', { roomId, song });
      setIsPlaying(true);
    }
  };

  return (
    <div className="music-player">
      <div className="player-controls">
        <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={handlePlayPause}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="mute-button btn-secondary btn-sm" onClick={toggleMute}>
          {muted ? '🎤 Karaoke' : '🔊 Live'}
        </button>
        <div className="player-info">
          <p className="player-title">{song.title}</p>
          <p className="player-artist">{song.artist}</p>
        </div>
      </div>

      {isYouTube ? (
        <div ref={playerContainerRef} style={{ display: 'none' }} />
      ) : song?.preview_url ? (
        <audio
          ref={audioRef}
          src={song.preview_url}
          autoPlay={isPlaying}
          muted={muted}
          onTimeUpdate={(e) => onTimeUpdate?.(e.target.currentTime, e.target.duration || 0)}
          onLoadedMetadata={(e) => onLoadedMetadata?.(e.target.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={onSongEnded}
          controls
          style={{ width: '100%', marginTop: '16px' }}
        />
      ) : (
        <p style={{ marginTop: '16px', color: '#999', textAlign: 'center' }}>No audio available</p>
      )}
    </div>
  );
}
