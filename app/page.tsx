"use client";
import { LucideCircle, LucideLetterText, LucidePencil, LucideRectangleHorizontal, LucideText, LucideTimerReset, LucideUndo, LucideZoomIn, LucideZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import initdraw from "./canvas/index";

function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<"pencil" | "rect" | "circle" | "text"|"">("");
  const undoRef = useRef<(() => void) | null>(null);
  const getShapeCountRef = useRef<(() => number) | null>(null);
  const [shapeCount, setShapeCount] = useState(0);
  const [size, setSize] = useState({ "width": 0, "height": 0 })
  const zoomInRef = useRef<(() => void) | null>(null);
  const zoomOutRef = useRef<(() => void) | null>(null);
  const resetViewRef = useRef<(() => void) | null>(null);
  // Add a ref to store the cleanup function
  const cleanupRef = useRef<(() => void) | null>(null);


  useEffect(() => {
    // Set initial size
    setSize({ width: window.innerWidth, height: window.innerHeight });
    // Handler for resize
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    if (canvasRef.current) {
      // Clean up previous instance if it exists
      if (cleanupRef.current) {
        cleanupRef.current();
      }

      initdraw(canvasRef.current, stage).then((api) => {
        if (api) {
          // Store the cleanup function
          cleanupRef.current = api.destroy;
          
          // Store other api functions
          if (api.undoLastShape) {
            undoRef.current = api.undoLastShape;
          }
          if (api.getShapeCount) {
            getShapeCountRef.current = api.getShapeCount;
            setShapeCount(api.getShapeCount());
          }
          if (api.zoomIn) {
            zoomInRef.current = api.zoomIn;
          }
          if (api.zoomOut) {
            zoomOutRef.current = api.zoomOut;
          }
          if (api.resetView) {
            resetViewRef.current = api.resetView;
          }
        }
      });
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [canvasRef, stage]);


  
  // Update shape count after undo
  const handleUndo = () => {
    if (undoRef.current) {
      undoRef.current();
      if (getShapeCountRef.current) {
        setShapeCount(getShapeCountRef.current());
      }
    }
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="w-screen h-screen ">
      <canvas className="" ref={canvasRef} width={size.width} height={size.height}></canvas>
      <div className="left-0 flex top-20  absolute z-10 bg-gray-500 rounded-3xl">
        <div className="flex flex-col justify-between w-max m-.5 items-center p-3 ">
          <button
            className={`cursor-pointer  ${stage === "pencil" ? "text-white" : "text-black"}`
            } title="Pencil" onClick={() => setStage("pencil")}> <LucidePencil /> </button>
          <button
            className={`mt-1 cursor-pointer ${stage === "circle" ? "text-white" : "text-black"}`
            } title="Circle" onClick={() => setStage("circle")}> <LucideCircle /> </button>
          <button
            className={`mt-1 cursor-pointer ${stage === "rect" ? "text-white" : "text-black"}`}
            title="Rectangle"
             onClick={() => setStage("rect")}> <LucideRectangleHorizontal /> </button>
          <button
            className={`mt-1 cursor-pointer ${stage === "text" ? "text-white" : "text-black"}`}
            title="Text"
             onClick={() => setStage("text")}><LucideText/></button>
          <button
            onClick={handleUndo}
            title="Undo (Ctrl+Z)"
            disabled={shapeCount === 0}
            className={shapeCount === 0 ? " opacity-50 cursor-not-allowed mt-1" : "mt-1"}
          >
            <LucideUndo />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Canvas;