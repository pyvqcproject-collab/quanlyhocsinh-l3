import React, { useRef, useState, useEffect } from "react";
import { Eraser, Pen, RotateCcw, CheckCircle } from "lucide-react";

export default function DrawingCanvas({ onSubmit, submitting, children }: { onSubmit: (data: string) => void, submitting: boolean, children?: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // Fill white background initially
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4 bg-sky-50 p-6 rounded-[2rem] border-4 border-sky-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setTool("pen")} className={`p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 border-2 ${tool === "pen" ? "bg-sky-500 text-white border-sky-600 shadow-md" : "bg-white text-slate-500 hover:bg-slate-100 border-slate-200"}`}>
            <Pen className="w-6 h-6" />
          </button>
          <button onClick={() => setTool("eraser")} className={`p-4 rounded-2xl transition-all hover:scale-105 active:scale-95 border-2 ${tool === "eraser" ? "bg-sky-500 text-white border-sky-600 shadow-md" : "bg-white text-slate-500 hover:bg-slate-100 border-slate-200"}`}>
            <Eraser className="w-6 h-6" />
          </button>
        </div>
        
        <div className="h-10 w-1 bg-sky-200 rounded-full mx-2"></div>
        
        <div className="flex items-center gap-3">
          {["#000000", "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"].map(c => (
            <button key={c} onClick={() => { setColor(c); setTool("pen"); }} className={`w-10 h-10 rounded-full border-4 transition-transform shadow-sm ${color === c && tool === "pen" ? "scale-125 border-white ring-2 ring-sky-400" : "border-white hover:scale-110"}`} style={{ backgroundColor: c }} />
          ))}
          <input type="color" value={color} onChange={e => { setColor(e.target.value); setTool("pen"); }} className="w-10 h-10 rounded-full cursor-pointer border-2 border-slate-200 p-0 hover:scale-110 transition-transform" />
        </div>

        <div className="h-10 w-1 bg-sky-200 rounded-full mx-2"></div>

        <div className="flex items-center gap-4 flex-1 min-w-[150px] bg-white px-4 py-2 rounded-2xl border-2 border-slate-200">
          <span className="text-sm font-bold text-slate-500">Nét vẽ:</span>
          <input type="range" min="1" max="20" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="flex-1 accent-sky-500" />
        </div>

        <div className="h-10 w-1 bg-sky-200 rounded-full mx-2"></div>

        <button onClick={clearCanvas} className="flex items-center gap-2 px-6 py-3 bg-rose-100 text-rose-600 hover:bg-rose-200 hover:text-rose-700 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 border-2 border-rose-200">
          <RotateCcw className="w-5 h-5" /> Xóa tất cả
        </button>
      </div>

      <div className="border-4 border-slate-200 rounded-[2.5rem] overflow-hidden bg-white shadow-inner relative group">
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-bold text-slate-500 border-2 border-slate-100 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          Khu vực vẽ tranh 🎨
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full h-auto cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
      </div>

      {children}

      <div className="flex justify-center pt-4">
        <button 
          onClick={handleSubmit} 
          disabled={submitting}
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
        >
          <CheckCircle className="w-8 h-8" /> Nộp bài ngay!
        </button>
      </div>
    </div>
  );
}
