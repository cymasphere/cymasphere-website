import React, { useState, useRef, useEffect, useCallback } from "react";

interface Note {
  id: number;
  noteName: string;
  startBeat: number;
  duration: number;
}

interface PianoRollProps {
  onNotesChange?: (notes: Note[]) => void;
  onNotePlay?: (noteName: string) => void;
  initialNotes?: Note[];
  externalPlaybackPosition?: number | null;
}

interface PianoRollConfig {
  noteWidth: number;
  noteHeight: number;
  headerHeight: number;
  keyWidth: number;
  cols: number;
  noteNames: string[];
  beatsPerBar: number;
  subdivision: number;
  totalBars: number;
  isBlackKey: Record<string, boolean>;
  noteColors: Record<string, string>;
}

const PianoRoll: React.FC<PianoRollProps> = ({
  onNotesChange,
  onNotePlay,
  initialNotes = [],
  externalPlaybackPosition = null,
}) => {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState<number>(0);
  const [hoveredNoteId, setHoveredNoteId] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration for the piano roll
  const config: PianoRollConfig = {
    noteWidth: 30,
    noteHeight: 24,
    headerHeight: 0, // No header
    keyWidth: 60,
    cols: 64, // 16 beats per bar * 4 bars
    noteNames: [
      "C5",
      "B4",
      "A#4",
      "A4",
      "G#4",
      "G4",
      "F#4",
      "F4",
      "E4",
      "D#4",
      "D4",
      "C#4",
      "C4",
      "B3",
      "A#3",
      "A3",
      "G#3",
      "G3",
      "F#3",
      "F3",
      "E3",
      "D#3",
      "D3",
      "C#3",
      "C3",
    ],
    beatsPerBar: 4,
    subdivision: 4, // 16th notes per beat
    totalBars: 4,
    isBlackKey: {
      C: false,
      "C#": true,
      Db: true,
      D: false,
      "D#": true,
      Eb: true,
      E: false,
      F: false,
      "F#": true,
      Gb: true,
      G: false,
      "G#": true,
      Ab: true,
      A: false,
      "A#": true,
      Bb: true,
      B: false,
    },
    noteColors: {
      C: "#8A2BE2",
      "C#": "#7B42E5",
      Db: "#7B42E5",
      D: "#7B42E5",
      "D#": "#6C5AE8",
      Eb: "#6C5AE8",
      E: "#6C5AE8",
      F: "#4B7BE8",
      "F#": "#20A4E8",
      Gb: "#20A4E8",
      G: "#20A4E8",
      "G#": "#20C5D5",
      Ab: "#20C5D5",
      A: "#20C5D5",
      "A#": "#20D5CB",
      Bb: "#20D5CB",
      B: "#20D5CB",
    },
  };

  // Check if note is a black key
  const isBlackKey = (noteName: string): boolean => {
    const note = noteName.substring(0, noteName.length - 1);
    return config.isBlackKey[note] || false;
  };

  // Get color based on note name
  const getNoteColor = (noteName: string): string => {
    const rootNote = noteName.substring(0, noteName.includes("#") ? 2 : 1);
    return config.noteColors[rootNote] || "#6C63FF";
  };

  // Handle mouse down on grid - start drawing a note
  const handleGridMouseDown = (e: React.MouseEvent): void => {
    // Remove the class check since it's preventing the interaction
    // The click event happens on the grid div itself
    if (!isDrawing && gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate position in terms of beats and bars
      const totalBeats = config.totalBars * config.beatsPerBar;
      const sixteenthsPerBeat = config.subdivision;

      // Calculate the startBeat position in sixteenth notes
      const startBeat = Math.floor(
        (x / rect.width) * (totalBeats * sixteenthsPerBeat)
      );

      // Get the note name based on the row index
      const row = Math.floor(y / config.noteHeight);
      const noteIndex = config.noteNames.length - 1 - row;
      const noteName = config.noteNames[noteIndex];

      // Ensure within bounds
      if (
        startBeat >= 0 &&
        startBeat < config.cols &&
        noteIndex >= 0 &&
        noteIndex < config.noteNames.length
      ) {
        // Create a new note with a full beat duration (4 sixteenth notes in 4/4 time)
        const newNote = {
          id: Date.now(),
          noteName: noteName,
          startBeat: startBeat,
          duration: sixteenthsPerBeat, // Full beat duration
        };

        // Add note to state
        setNotes((prevNotes) => [...prevNotes, newNote]);

        // Notify parent component
        if (onNotesChange) {
          const updatedNotes = [...notes, newNote];
          onNotesChange(updatedNotes);
        }

        // Play the note when placed
        if (onNotePlay) {
          onNotePlay(noteName);
        }
      }
    }
  };

  // Handle mouse up - finish drawing note
  const handleMouseUp = useCallback((): void => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  }, [isDrawing]);

  // Handle click on an existing note
  const handleNoteClick = (e: React.MouseEvent, note: Note): void => {
    e.stopPropagation();
    setSelectedNote(note.id === selectedNote ? null : note.id);

    // Play the note when clicked
    if (onNotePlay) {
      onNotePlay(note.noteName);
    }
  };

  // Handle deleting a note
  const handleNoteDelete = (e: React.MouseEvent, noteId: number): void => {
    e.stopPropagation();

    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.filter((note) => note.id !== noteId);

      // Notify parent component
      if (onNotesChange) {
        onNotesChange(updatedNotes);
      }

      return updatedNotes;
    });

    setSelectedNote(null);
  };

  // Clean up on unmount
  useEffect(() => {
    // Capture the current playbackRef value at effect level
    const currentPlayback = playbackRef.current;

    return () => {
      if (currentPlayback) {
        clearInterval(currentPlayback);
      }
    };
  }, []);

  // Add event listeners for mouse up
  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDrawing, handleMouseUp]);

  // Add an effect to update notes when initialNotes changes
  useEffect(() => {
    if (initialNotes && initialNotes.length > 0) {
      setNotes(initialNotes);
    }
  }, [initialNotes]);

  // Update local playback position when external position changes
  useEffect(() => {
    if (externalPlaybackPosition !== null) {
      setPlaybackPosition(externalPlaybackPosition);
    }
  }, [externalPlaybackPosition]);

  // Add a new style block with keyframes for a smoother animation
  const playheadStyle = {
    position: "absolute" as const,
    left: `${
      ((typeof externalPlaybackPosition === "number"
        ? externalPlaybackPosition
        : playbackPosition) /
        config.cols) *
      100
    }%`,
    top: 0,
    width: "3px", // Slightly wider
    height: "100%",
    backgroundColor: "#FF5E5B",
    boxShadow: "0 0 10px #FF5E5B, 0 0 15px rgba(255, 94, 91, 0.8)",
    zIndex: 8,
    animation: "pulse 0.5s infinite alternate",
    opacity: 0.95,
    transition: "left 0.116s cubic-bezier(0.1, 0.7, 0.1, 1)", // Smoother cubic-bezier transition
  };

  // Render the playhead with improved animations
  const renderPlayhead = () => {
    if (
      !(
        playbackPosition >= 0 ||
        (externalPlaybackPosition !== null && externalPlaybackPosition >= 0)
      )
    )
      return null;

    return (
      <div style={playheadStyle}>
        {/* Add a glow effect at the top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "-3px",
            width: "9px",
            height: "9px",
            borderRadius: "50%",
            backgroundColor: "#FF5E5B",
            boxShadow: "0 0 10px 3px rgba(255, 94, 91, 0.9)",
          }}
        />
      </div>
    );
  };

  // Render piano keyboard
  const renderPianoKeys = () => {
    return (
      <div
        className="piano-keys"
        style={{
          position: "absolute",
          left: 0,
          top: config.headerHeight,
          width: `${config.keyWidth}px`,
          height: `${config.noteNames.length * config.noteHeight}px`,
          borderRight: "1px solid rgba(255, 255, 255, 0.2)",
          overflow: "hidden",
          backgroundColor: "#111",
          zIndex: 1,
        }}
      >
        {/* Grid lines for each note position */}
        {config.noteNames.map((note, index) => (
          <div
            key={`grid-${note}`}
            style={{
              position: "absolute",
              top: `${index * config.noteHeight}px`,
              left: 0,
              width: "100%",
              height: `${config.noteHeight}px`,
              borderBottom: "1px solid rgba(40, 40, 40, 0.7)",
              zIndex: 0,
            }}
          />
        ))}

        {/* Render all white keys first */}
        {config.noteNames.map((note, index) => {
          if (!isBlackKey(note)) {
            const noteName = note.slice(0, -1);
            const octave = note.slice(-1);

            return (
              <div
                key={`white-${note}`}
                onClick={() => onNotePlay && onNotePlay(note)}
                style={{
                  position: "absolute",
                  top: `${index * config.noteHeight}px`,
                  left: 0,
                  width: "100%",
                  height: `${config.noteHeight}px`,
                  backgroundColor: "white",
                  borderBottom: "1px solid #bbb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#333",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  userSelect: "none",
                  zIndex: 1,
                }}
              >
                {noteName}
                <span style={{ fontSize: "0.5rem", marginLeft: "1px" }}>
                  {octave}
                </span>
              </div>
            );
          }
          return null;
        })}

        {/* Render black keys on top */}
        {config.noteNames.map((note, index) => {
          if (isBlackKey(note)) {
            return (
              <div
                key={`black-${note}`}
                onClick={() => onNotePlay && onNotePlay(note)}
                style={{
                  position: "absolute",
                  top: `${index * config.noteHeight}px`,
                  left: 0,
                  width: "70%",
                  height: `${config.noteHeight}px`,
                  backgroundColor: "black",
                  borderBottom: "1px solid #555",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  userSelect: "none",
                  zIndex: 2,
                }}
              >
                {note}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  // Render note grid
  const renderNoteGrid = () => {
    return (
      <div
        className="note-grid"
        style={{
          position: "absolute",
          left: `${config.keyWidth}px`,
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          backgroundColor: "rgba(30, 30, 45, 0.4)",
          pointerEvents: "none", // Make sure this doesn't interfere with mouse events
        }}
      >
        {/* Vertical bar divider lines (heavy) */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`bar-line-${index}`}
            style={{
              position: "absolute",
              left: `${index * 25}%`, // Position at each bar boundary
              top: 0,
              width: index < 4 ? "2px" : "0", // No right border on last line
              height: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.4)",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Beat division lines (thinner) */}
        {Array.from({ length: 16 }).map((_, index) => (
          <div
            key={`beat-line-${index}`}
            style={{
              position: "absolute",
              left: `${index * 6.25}%`, // 4 beats per bar, 16 total
              top: 0,
              width: "1px",
              height: "100%",
              backgroundColor:
                index % 4 === 0 ? "transparent" : "rgba(255, 255, 255, 0.15)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Horizontal lines for note rows */}
        {config.noteNames.map((_, index) => (
          <div
            key={`h-line-${index}`}
            style={{
              position: "absolute",
              left: 0,
              top: `${index * config.noteHeight}px`,
              width: "100%",
              height: "1px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              pointerEvents: "none",
            }}
          />
        ))}
      </div>
    );
  };

  // Get piano roll height based on number of notes
  const getPianoRollHeight = () => {
    return config.noteNames.length * config.noteHeight + config.headerHeight;
  };

  return (
    <div
      className="piano-roll"
      style={{
        position: "relative",
        width: "100%",
        height: `${getPianoRollHeight()}px`,
        backgroundColor: "#1f1f2f",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "4px",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Piano keys on the left */}
      {renderPianoKeys()}

      {/* Note grid with vertical and horizontal lines */}
      {renderNoteGrid()}

      {/* Note grid (for placing notes) */}
      <div
        ref={gridRef}
        className="note-grid-interactive"
        style={{
          position: "absolute",
          left: `${config.keyWidth}px`,
          top: 0,
          width: `calc(100% - ${config.keyWidth}px)`,
          height: `${config.noteNames.length * config.noteHeight}px`,
          cursor: isDrawing ? "grabbing" : "crosshair",
          zIndex: 5,
          backgroundColor: "transparent",
        }}
        onMouseDown={handleGridMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Render existing notes */}
        {notes.map((note) => (
          <div
            key={note.id}
            style={{
              position: "absolute",
              left: `${(note.startBeat / config.cols) * 100}%`,
              top: `${
                config.noteNames.indexOf(note.noteName) * config.noteHeight
              }px`,
              width: `${(note.duration / config.cols) * 100}%`,
              height: `${config.noteHeight - 2}px`,
              backgroundColor: getNoteColor(note.noteName),
              borderRadius: "3px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "0.7rem",
              fontWeight: "bold",
              opacity: 0.9,
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
              cursor: "pointer",
              userSelect: "none",
              zIndex: selectedNote === note.id ? 7 : 6,
            }}
            onClick={(e) => handleNoteClick(e, note)}
            onMouseEnter={() => setHoveredNoteId(note.id)}
            onMouseLeave={() => setHoveredNoteId(null)}
          >
            {note.noteName}
            {hoveredNoteId === note.id && (
              <div
                style={{
                  position: "absolute",
                  right: "2px",
                  top: "2px",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 100, 100, 0.7)",
                  fontSize: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                onClick={(e) => handleNoteDelete(e, note.id)}
              >
                ✕
              </div>
            )}
          </div>
        ))}

        {/* Enhanced playback position indicator (playhead) */}
        {renderPlayhead()}
      </div>

      {/* Add CSS animation for the playhead pulse effect */}
      <style>
        {`
          @keyframes pulse {
            from { opacity: 0.8; }
            to { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default PianoRoll;
