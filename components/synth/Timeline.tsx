import React, { useState, useEffect } from "react";

interface ChordData {
  note: string;
  name: string;
  notes: string[];
}

interface TimelineProps {
  onTimelineUpdate?: (slots: (ChordData | null)[]) => void;
  isPlaying: boolean;
  currentSlotIndex: number;
  initialSlots: (ChordData | null)[];
}

const Timeline: React.FC<TimelineProps> = ({
  onTimelineUpdate,
  isPlaying,
  currentSlotIndex,
  initialSlots,
}) => {
  const [slots, setSlots] = useState<(ChordData | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  // Update slots when initialSlots prop changes
  useEffect(() => {
    if (initialSlots && initialSlots.some((slot) => slot !== null)) {
      setSlots(initialSlots);
      console.log("Timeline updated with initialSlots:", initialSlots);
    }
  }, [initialSlots]);

  // Handle dropping a chord into a timeline slot
  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    const chordData = JSON.parse(e.dataTransfer.getData("chord")) as ChordData;

    // Update the slots array with the new chord
    const newSlots = [...slots];
    newSlots[slotIndex] = chordData;
    setSlots(newSlots);

    // Notify parent component about the timeline update
    if (onTimelineUpdate) {
      onTimelineUpdate(newSlots);
    }
  };

  // Allow dropping
  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle clearing a slot by clicking on it
  const handleClearSlot = (slotIndex: number) => {
    const newSlots = [...slots];
    newSlots[slotIndex] = null;
    setSlots(newSlots);

    // Notify parent component about the timeline update
    if (onTimelineUpdate) {
      onTimelineUpdate(newSlots);
    }
  };

  // Get chord color for visualization
  const getChordColor = (note: string | undefined) => {
    const chordColors: Record<string, string> = {
      C: "#8A2BE2",
      D: "#7B42E5",
      E: "#6C5AE8",
      F: "#4B7BE8",
      G: "#20A4E8",
      A: "#20C5D5",
      B: "#20D5CB",
    };
    return note ? chordColors[note] || "#6C63FF" : "rgba(255, 255, 255, 0.1)";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "750px",
        margin: "0 auto 20px auto",
        backgroundColor: "transparent",
        borderRadius: "8px",
        padding: "15px",
        boxShadow: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          height: "80px",
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          borderRadius: "4px",
          padding: "5px",
          position: "relative",
        }}
      >
        {slots.map((slot, index) => (
          <div
            key={`slot-${index}`}
            onDragOver={allowDrop}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => slot && handleClearSlot(index)}
            onMouseEnter={() => setHoveredSlot(index)}
            onMouseLeave={() => setHoveredSlot(null)}
            style={{
              width: "22%",
              height: "90%",
              backgroundColor: getChordColor(slot?.note),
              borderRadius: "4px",
              margin: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: slot ? "pointer" : "default",
              transition: "all 0.2s ease",
              userSelect: "none",
              border:
                isPlaying && currentSlotIndex === index
                  ? "3px solid rgba(255, 255, 255, 0.9)"
                  : slot
                  ? "2px solid rgba(255, 255, 255, 0.2)"
                  : "2px dashed rgba(255, 255, 255, 0.3)",
              boxShadow:
                isPlaying && currentSlotIndex === index
                  ? "0 0 15px rgba(255, 255, 255, 0.5)"
                  : "none",
              position: "relative",
            }}
          >
            {slot ? (
              <>
                <div
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  {slot.name}
                </div>
                {hoveredSlot === index && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      right: "0",
                      backgroundColor: "rgba(255, 0, 0, 0.7)",
                      color: "white",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                      margin: "3px",
                      opacity: 0.8,
                    }}
                  >
                    ×
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  color: "rgba(255, 255, 255, 0.4)",
                  fontSize: "0.8rem",
                }}
              >
                Slot {index + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
