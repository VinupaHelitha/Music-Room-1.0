import { useEffect, useRef } from 'react';
import './LyricsDisplay.css';

export default function LyricsDisplay({ lyrics, activeLineIndex = 0, onLineSelect }) {
  const lyricsLines = lyrics?.lyrics ? lyrics.lyrics.split('\n') : [];
  const activeRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (activeRef.current && contentRef.current) {
      const container = contentRef.current;
      const element = activeRef.current;
      const elementOffsetTop = element.offsetTop;
      const containerHeight = container.clientHeight;
      const elementHeight = element.clientHeight;

      // Scroll so active line is centered in the container
      const scrollTop = elementOffsetTop - (containerHeight / 2) + (elementHeight / 2);
      container.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
    }
  }, [activeLineIndex]);

  if (!lyrics || !lyricsLines.length) {
    return (
      <div className="lyrics-card card">
        <div className="empty-lyrics-message">
          <p>🎵 No Lyrics Available</p>
          <p style={{ fontSize: '13px', color: '#999' }}>Lyrics will appear here when a song is playing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lyrics-card card">
      <div className="lyrics-header">
        <h4>{lyrics.song}</h4>
        <p>{lyrics.artist}</p>
        <p className="lyrics-source">Via {lyrics.source}</p>
      </div>
      <div className="lyrics-content" ref={contentRef}>
        {lyricsLines.map((line, idx) => (
          <p
            key={idx}
            ref={idx === activeLineIndex ? activeRef : null}
            className={`lyrics-line ${idx === activeLineIndex ? 'active-line' : ''}`}
            onClick={() => onLineSelect?.(idx)}
          >
            {line || <br />}
          </p>
        ))}
      </div>
    </div>
  );
}
