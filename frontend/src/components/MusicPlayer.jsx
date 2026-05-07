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
  audioRef
}) {
  const playerRef = useRef(null);
  const windowRef = useRef(null);
  const isYouTube = song?.source === 'youtube' || song?.preview_url?.includes('youtube');

  // YouTube API setup (only once)
  useEffect(() => {
    if (!isYouTube) return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      windowRef.current = window;
    }
  }, [isYouTube]);

  useEffect(() => {
    if (!isYouTube || !window.YT || !song?.id) return;

    const player = new window.YT.Player(playerRef.current, {
      height: '0',
      width: '0',
      videoId: song.id,
      playerVars: {
        controls: 0,
        autoplay: 0,
        modestbranding: 1
      },
      events: {
        onReady: () => {
          if (isPlaying) {
            player.playVideo();
          }
        },
        onStateChange: (event) => {
          if (event.data === 1) {
            setIsPlaying(true);
          } else if (event.data === 2) {
            setIsPlaying(false);
          }
        }
      }
    });

    // Update time every 100ms for YouTube
    const interval = setInterval(() => {
      if (player && player.getCurrentTime) {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        onTimeUpdate?.(currentTime, duration);
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [isYouTube, song?.id, isPlaying, setIsPlaying, onTimeUpdate]);

  const handlePlayPause = () => {
    if (isYouTube) {
      const player = window.YT?.Player;
      if (!player) return;

      if (!isPlaying) {
        playerRef.current?.playVideo?.();
        socket?.emit('play-song', { roomId, song });
        setIsPlaying(true);
      } else {
        playerRef.current?.pauseVideo?.();
        socket?.emit('pause-song', roomId);
        setIsPlaying(false);
      }
    } else {
      if (!isPlaying) {
        socket?.emit('play-song', { roomId, song });
        setIsPlaying(true);
      } else {
        socket?.emit('pause-song', roomId);
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = (event) => {
    const currentTime = event.target.currentTime;
    const duration = event.target.duration || 0;
    onTimeUpdate?.(currentTime, duration);
  };

  const handleLoadedMetadata = (event) => {
    onLoadedMetadata?.(event.target.duration);
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
        <div id="yt-player" ref={playerRef} style={{ display: 'none' }}></div>
      ) : song?.preview_url ? (
        <audio
          ref={audioRef}
          src={song.preview_url}
          autoPlay={isPlaying}
          muted={muted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls
          style={{ width: '100%', marginTop: '16px' }}
        />
      ) : (
        <p style={{ marginTop: '16px', color: '#999', textAlign: 'center' }}>No audio available</p>
      )}
    </div>
  );
}
