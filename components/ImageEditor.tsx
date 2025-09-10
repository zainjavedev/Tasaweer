import React, { useState, useRef, MouseEvent, RefObject } from 'react';
import { SelectionBox } from '../types';

interface ImageEditorProps {
  imageUrl: string;
  onSelectionChange: (selection: SelectionBox | null) => void;
  imageRef: RefObject<HTMLImageElement>;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onSelectionChange, imageRef }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<SelectionBox | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getCoords = (e: MouseEvent<HTMLDivElement>): { x: number, y: number } => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    setStartPoint({ x, y });
    setSelection(null); 
    onSelectionChange(null);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    const { x: endX, y: endY } = getCoords(e);
    const newSelection = {
      x: Math.min(startPoint.x, endX),
      y: Math.min(startPoint.y, endY),
      width: Math.abs(startPoint.x - endX),
      height: Math.abs(startPoint.y - endY),
    };
    setSelection(newSelection);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (selection && selection.width > 5 && selection.height > 5) {
        onSelectionChange(selection);
    } else {
        setSelection(null);
        onSelectionChange(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-2xl mx-auto select-none touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // Stop drawing if mouse leaves
    >
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Image to edit"
        className="w-full h-auto rounded-lg shadow-md"
        draggable="false"
      />
      {selection && (
        <div
          className="absolute border-2 border-dashed border-yellow-400 bg-yellow-400/20 pointer-events-none"
          style={{
            left: selection.x,
            top: selection.y,
            width: selection.width,
            height: selection.height,
          }}
        />
      )}
    </div>
  );
};
