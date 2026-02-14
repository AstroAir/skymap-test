const FOV_STARS = [
  { w: 2, t: 10, l: 20, o: 0.5 }, { w: 1, t: 30, l: 50, o: 0.3 }, { w: 2, t: 55, l: 75, o: 0.6 },
  { w: 1, t: 70, l: 15, o: 0.4 }, { w: 1, t: 20, l: 85, o: 0.5 }, { w: 2, t: 45, l: 35, o: 0.3 },
  { w: 1, t: 80, l: 60, o: 0.4 }, { w: 2, t: 15, l: 45, o: 0.7 }, { w: 1, t: 60, l: 90, o: 0.3 },
  { w: 1, t: 35, l: 10, o: 0.5 }, { w: 2, t: 75, l: 40, o: 0.4 }, { w: 1, t: 50, l: 65, o: 0.6 },
];

export function MockFovUI() {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#0a0e27] to-[#1a1e3a] relative overflow-hidden flex items-center justify-center">
      {/* Mock stars */}
      {FOV_STARS.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: `${star.w}px`,
            height: `${star.w}px`,
            top: `${star.t}%`,
            left: `${star.l}%`,
            opacity: star.o,
          }}
        />
      ))}
      {/* FOV rectangles */}
      <div className="relative">
        <div className="w-48 h-32 border-2 border-blue-400/60 rounded-sm" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-24 border border-green-400/40 rounded-sm" />
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/50">
          2.1° × 1.4° — ASI2600MC + RedCat 51
        </div>
      </div>
      {/* Mock mosaic grid */}
      <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md rounded-md p-2 border border-white/10">
        <div className="text-[10px] text-white/70 font-medium mb-1">Mosaic 2×2</div>
        <div className="grid grid-cols-2 gap-0.5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="w-5 h-4 border border-blue-400/40 rounded-[2px] bg-blue-400/10" />
          ))}
        </div>
      </div>
    </div>
  );
}
