import React, { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, Pen, RotateCcw, CheckCircle, Maximize2, Minimize2, Undo2, Square, Circle, Minus, Type, Download } from "lucide-react";

type Tool = "pen" | "eraser" | "rect" | "circle" | "line";

export default function DrawingCanvas({ onSubmit, submitting, children }: { onSubmit: (data: string) => void, submitting: boolean, children?: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<Tool>("pen");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setHistory(prev => [...prev.slice(-19), dataUrl]); // Keep last 20 steps
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // Fill white background initially
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
      }
    }
  }, [saveToHistory]);

  // Handle window resize for full screen
  useEffect(() => {
    const handleResize = () => {
      if (isFullScreen && canvasRef.current) {
        // We don't want to clear the canvas on resize, so we might need to copy content
        // But for simplicity in this version, we'll just keep the 800x500 internal size
        // and let CSS handle the scaling.
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFullScreen]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    // Calculate scale factor between canvas internal resolution and display size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e.nativeEvent);
    setIsDrawing(true);
    setStartPos(coords);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
        if (tool === "pen" || tool === "eraser") {
          ctx.beginPath();
          ctx.moveTo(coords.x, coords.y);
        }
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || !snapshot) return;

    const coords = getCoordinates(e.nativeEvent);

    if (tool === "pen" || tool === "eraser") {
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else {
      // For shapes, restore snapshot first
      ctx.putImageData(snapshot, 0, 0);
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = color;
      ctx.beginPath();
      
      if (tool === "rect") {
        ctx.strokeRect(startPos.x, startPos.y, coords.x - startPos.x, coords.y - startPos.y);
      } else if (tool === "circle") {
        const radius = Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2));
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === "line") {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const undo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current state
      const prevState = newHistory[newHistory.length - 1];
      
      const canvas = canvasRef.current;
      if (canvas && prevState) {
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.src = prevState;
        img.onload = () => {
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          }
        };
        setHistory(newHistory);
      }
    }
  };

  const clearCanvas = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ hình vẽ không?")) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          saveToHistory();
        }
      }
    }
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      onSubmit(dataUrl);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = "my-drawing.png";
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className={`space-y-6 ${isFullScreen ? 'fixed inset-0 z-[10000] bg-slate-900 p-4 sm:p-8 flex flex-col overflow-hidden' : ''}`}>
      {/* Toolbar */}
      <div className={`flex flex-wrap items-center gap-3 bg-white p-4 rounded-[1.5rem] border-4 border-slate-200 shadow-lg ${isFullScreen ? 'mb-4' : ''}`}>
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border-2 border-slate-100">
          <ToolButton active={tool === "pen"} onClick={() => setTool("pen")} icon={<Pen className="w-5 h-5" />} title="Bút vẽ" />
          <ToolButton active={tool === "eraser"} onClick={() => setTool("eraser")} icon={<Eraser className="w-5 h-5" />} title="Cục tẩy" />
          <div className="w-px h-8 bg-slate-200 mx-1"></div>
          <ToolButton active={tool === "line"} onClick={() => setTool("line")} icon={<Minus className="w-5 h-5" />} title="Đường thẳng" />
          <ToolButton active={tool === "rect"} onClick={() => setTool("rect")} icon={<Square className="w-5 h-5" />} title="Hình chữ nhật" />
          <ToolButton active={tool === "circle"} onClick={() => setTool("circle")} icon={<Circle className="w-5 h-5" />} title="Hình tròn" />
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border-2 border-slate-100">
          <ToolButton onClick={undo} disabled={history.length <= 1} icon={<Undo2 className="w-5 h-5" />} title="Hoàn tác" />
          <ToolButton onClick={clearCanvas} icon={<RotateCcw className="w-5 h-5 text-rose-500" />} title="Xóa hết" />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border-2 border-slate-100 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
          {["#000000", "#ffffff", "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"].map(c => (
            <button 
              key={c} 
              onClick={() => { setColor(c); if (tool === "eraser") setTool("pen"); }} 
              className={`w-8 h-8 rounded-full border-2 transition-all flex-shrink-0 ${color === c && tool !== "eraser" ? "scale-110 ring-2 ring-sky-400 border-white" : "border-slate-200 hover:scale-110"}`} 
              style={{ backgroundColor: c }} 
            />
          ))}
          <input type="color" value={color} onChange={e => { setColor(e.target.value); if (tool === "eraser") setTool("pen"); }} className="w-8 h-8 rounded-full cursor-pointer border-2 border-slate-200 p-0 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border-2 border-slate-100 flex-1 min-w-[120px]">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Cỡ:</span>
          <input type="range" min="1" max="50" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="flex-1 accent-sky-500 h-1.5" />
          <span className="text-xs font-bold text-slate-600 w-6">{brushSize}</span>
        </div>

        <div className="flex items-center gap-2">
          <ToolButton onClick={() => setIsFullScreen(!isFullScreen)} icon={isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />} title={isFullScreen ? "Thu nhỏ" : "Toàn màn hình"} />
          <ToolButton onClick={downloadImage} icon={<Download className="w-5 h-5" />} title="Tải về máy" />
        </div>
      </div>

      {/* Canvas Area */}
      <div className={`relative flex-1 bg-slate-200 rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl ${isFullScreen ? 'cursor-crosshair' : ''}`}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          className="w-full h-full object-contain bg-white touch-none"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
        
        {isFullScreen && (
          <div className="absolute bottom-8 right-8 flex gap-4">
            <button 
              onClick={() => setIsFullScreen(false)}
              className="bg-slate-800/80 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-bold border-2 border-white/20 hover:bg-slate-700 transition-all"
            >
              Thoát Fullscreen
            </button>
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-6 h-6" /> Nộp bài
            </button>
          </div>
        )}
      </div>

      {!isFullScreen && (
        <>
          {children}
          <div className="flex justify-center pt-4">
            <button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white px-12 py-5 rounded-[2rem] font-black text-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-4 border-b-8 border-emerald-700"
            >
              <CheckCircle className="w-10 h-10" /> Nộp bài ngay!
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ToolButton({ active, onClick, icon, title, disabled }: { active?: boolean, onClick: () => void, icon: React.ReactNode, title: string, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      title={title}
      className={`p-3 rounded-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 ${active ? "bg-sky-500 text-white shadow-inner" : "text-slate-500 hover:bg-slate-200"}`}
    >
      {icon}
    </button>
  );
}
