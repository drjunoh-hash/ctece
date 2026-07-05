import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DrawingBoardProps {
  onHome: () => void;
}

type Tool = 'brush' | 'eraser' | 'rainbow' | 'stamp';

// 유아 친화적인 밝고 선명한 색상 팔레트
const COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#FACC15', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#A16207', // brown
  '#1F2937', // near-black
  '#9CA3AF', // gray
  '#FFFFFF', // white
];

// 붓 굵기 (작게 / 보통 / 크게)
const BRUSH_SIZES = [
  { label: '가늘게', value: 8 },
  { label: '보통', value: 20 },
  { label: '굵게', value: 40 },
  { label: '아주 굵게', value: 72 },
];

// 유아가 좋아하는 스탬프(스티커) 이모지
const STAMPS = ['⭐', '❤️', '🌈', '🌸', '🐱', '🐶', '🦋', '🌞', '🍎', '🎈', '🚗', '⚽'];

const DrawingBoard: React.FC<DrawingBoardProps> = ({ onHome }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const hueRef = useRef(0); // 무지개 모드용 색상 회전값

  // 되돌리기(Undo)를 위한 스냅샷 스택
  const undoStackRef = useRef<ImageData[]>([]);

  const [color, setColor] = useState<string>(COLORS[0]);
  const [size, setSize] = useState<number>(BRUSH_SIZES[1].value);
  const [tool, setTool] = useState<Tool>('brush');
  const [stamp, setStamp] = useState<string>(STAMPS[0]);
  const [canUndo, setCanUndo] = useState(false);

  // 캔버스를 흰색으로 채우기
  const fillWhite = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }, []);

  // 캔버스 크기를 컨테이너에 맞추고(고해상도 대응) 기존 그림 보존
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.floor(rect.height));

    // 리사이즈 전 기존 그림 백업
    let prev: HTMLCanvasElement | null = null;
    if (canvas.width > 0 && canvas.height > 0) {
      prev = document.createElement('canvas');
      prev.width = canvas.width;
      prev.height = canvas.height;
      const pctx = prev.getContext('2d');
      if (pctx) pctx.drawImage(canvas, 0, 0);
    }

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;

    // 흰 배경 채우고 이전 그림 복원
    fillWhite(ctx, cssW, cssH);
    if (prev) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(prev, 0, 0, prev.width, prev.height, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, [fillWhite]);

  useEffect(() => {
    setupCanvas();
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(setupCanvas);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, [setupCanvas]);

  // 현재 캔버스 상태를 undo 스택에 저장 (최대 20개)
  const pushUndo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    try {
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      undoStackRef.current.push(snapshot);
      if (undoStackRef.current.length > 20) undoStackRef.current.shift();
      setCanUndo(true);
    } catch {
      // getImageData 실패(예: 보안 제한) 시 무시
    }
  }, []);

  const handleUndo = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const snapshot = undoStackRef.current.pop();
    if (snapshot) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.putImageData(snapshot, 0, 0);
      ctx.restore();
    }
    setCanUndo(undoStackRef.current.length > 0);
  }, []);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const drawStamp = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const fontSize = Math.max(size * 1.8, 40);
    ctx.save();
    ctx.font = `${fontSize}px "Jua", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stamp, x, y);
    ctx.restore();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    pushUndo();

    const p = getPoint(e);

    if (tool === 'stamp') {
      drawStamp(ctx, p.x, p.y);
      return;
    }

    isDrawingRef.current = true;
    lastPointRef.current = p;

    // 점 찍기(탭 한 번으로도 그려지도록)
    ctx.beginPath();
    ctx.arc(p.x, p.y, getStrokeWidth() / 2, 0, Math.PI * 2);
    ctx.fillStyle = getStrokeColor();
    ctx.fill();
  };

  const getStrokeWidth = () => size;

  const getStrokeColor = () => {
    if (tool === 'eraser') return '#FFFFFF';
    if (tool === 'rainbow') {
      hueRef.current = (hueRef.current + 8) % 360;
      return `hsl(${hueRef.current}, 90%, 55%)`;
    }
    return color;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const ctx = ctxRef.current;
    const last = lastPointRef.current;
    if (!ctx || !last) return;
    e.preventDefault();

    const p = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = getStrokeColor();
    ctx.lineWidth = getStrokeWidth();
    ctx.stroke();
    lastPointRef.current = p;
  };

  const endStroke = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    if (e) {
      try {
        canvasRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    if (!window.confirm('그림을 모두 지울까요?')) return;
    pushUndo();
    const rect = canvas.getBoundingClientRect();
    fillWhite(ctx, rect.width, rect.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    const stamp = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const name = `내그림_${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}_${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}.png`;
    link.download = name;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 툴 버튼 공통 스타일
  const toolBtn = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 font-bold text-sm md:text-base transition-transform active:scale-95 border-b-4 select-none ${
      active
        ? 'bg-indigo-500 text-white border-indigo-700'
        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'
    }`;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-3 md:gap-4 animate-fade-in px-1 md:px-0">
      {/* 상단 툴바 */}
      <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3 bg-white/80 backdrop-blur rounded-3xl p-2 md:p-3 shadow-sm border-2 border-blue-100">
        <div className="flex items-center gap-2">
          <button onClick={onHome} className={toolBtn(false)} aria-label="홈으로">
            <span className="text-xl md:text-2xl">🏠</span>
            <span className="hidden sm:block">홈</span>
          </button>
          <h2 className="text-xl md:text-3xl font-bold text-indigo-600 fun-font ml-1">
            🎨 그림 그리기
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleUndo} disabled={!canUndo} className={`${toolBtn(false)} ${!canUndo ? 'opacity-40 cursor-not-allowed' : ''}`} aria-label="되돌리기">
            <span className="text-xl md:text-2xl">↩️</span>
            <span className="hidden sm:block">되돌리기</span>
          </button>
          <button onClick={handleClear} className={toolBtn(false)} aria-label="전체 지우기">
            <span className="text-xl md:text-2xl">🧹</span>
            <span className="hidden sm:block">모두 지우기</span>
          </button>
          <button onClick={handleSave} className="flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 font-bold text-sm md:text-base transition-transform active:scale-95 border-b-4 bg-green-500 text-white border-green-700 hover:bg-green-600 select-none" aria-label="그림 저장">
            <span className="text-xl md:text-2xl">💾</span>
            <span className="hidden sm:block">저장하기</span>
          </button>
        </div>
      </div>

      {/* 도구 선택 */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-white rounded-3xl p-2 md:p-3 shadow-sm border-2 border-blue-100">
        <button onClick={() => setTool('brush')} className={toolBtn(tool === 'brush')}>
          <span className="text-xl md:text-2xl">🖌️</span>
          <span>붓</span>
        </button>
        <button onClick={() => setTool('rainbow')} className={toolBtn(tool === 'rainbow')}>
          <span className="text-xl md:text-2xl">🌈</span>
          <span>무지개</span>
        </button>
        <button onClick={() => setTool('stamp')} className={toolBtn(tool === 'stamp')}>
          <span className="text-xl md:text-2xl">⭐</span>
          <span>스티커</span>
        </button>
        <button onClick={() => setTool('eraser')} className={toolBtn(tool === 'eraser')}>
          <span className="text-xl md:text-2xl">🧽</span>
          <span>지우개</span>
        </button>

        {/* 붓 굵기 */}
        <div className="flex items-center gap-1.5 md:gap-2 ml-1 md:ml-2 pl-2 md:pl-3 border-l-2 border-slate-100">
          {BRUSH_SIZES.map((b) => (
            <button
              key={b.value}
              onClick={() => setSize(b.value)}
              aria-label={b.label}
              title={b.label}
              className={`flex items-center justify-center rounded-full transition-all active:scale-90 border-2 ${
                size === b.value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
              }`}
              style={{ width: 44, height: 44 }}
            >
              <span
                className="rounded-full bg-slate-700 block"
                style={{ width: Math.min(b.value / 2.2, 26), height: Math.min(b.value / 2.2, 26) }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 색상 / 스티커 팔레트 */}
      {tool === 'stamp' ? (
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 bg-white rounded-3xl p-2 md:p-3 shadow-sm border-2 border-blue-100">
          {STAMPS.map((s) => (
            <button
              key={s}
              onClick={() => setStamp(s)}
              className={`aspect-square rounded-2xl text-2xl md:text-3xl flex items-center justify-center transition-transform active:scale-90 ${
                stamp === s ? 'bg-indigo-100 ring-4 ring-indigo-400' : 'bg-slate-50 hover:bg-slate-100'
              }`}
              aria-label={`스티커 ${s}`}
            >
              {s}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 bg-white rounded-3xl p-2 md:p-3 shadow-sm border-2 border-blue-100">
          {COLORS.map((c) => {
            const active = color === c && tool !== 'eraser' && tool !== 'rainbow';
            return (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  if (tool === 'eraser' || tool === 'rainbow') setTool('brush');
                }}
                className={`aspect-square rounded-2xl transition-transform active:scale-90 border-2 ${
                  active ? 'ring-4 ring-indigo-400 scale-105' : ''
                } ${c === '#FFFFFF' ? 'border-slate-300' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
                aria-label={`색상 ${c}`}
              />
            );
          })}
        </div>
      )}

      {/* 그림판 캔버스 */}
      <div
        ref={containerRef}
        className="relative w-full rounded-[2rem] overflow-hidden border-4 border-white shadow-lg bg-white"
        style={{ height: 'min(62vh, 640px)', touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={(e) => {
            if (isDrawingRef.current) endStroke(e);
          }}
        />
      </div>

      <p className="text-center text-slate-400 text-sm md:text-base pb-2">
        손가락이나 마우스로 자유롭게 그려보세요! 다 그리면 <b className="text-green-500">저장하기</b>를 눌러요 😊
      </p>
    </div>
  );
};

export default DrawingBoard;
