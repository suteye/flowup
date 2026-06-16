import Image from "next/image";
import { cn } from "@/lib/utils";

export function FlowLogo({
  size = 22,
  mark = 26,
  className,
}: {
  size?: number;
  mark?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
<div className="row gap10" style={{ alignItems: 'center' }}>
      <div style={{ width: mark, height: mark, position: 'relative', display: 'grid', placeItems: 'center', background: 'var(--brand)', borderRadius: 6, boxShadow: '0 2px 0 color-mix(in srgb,var(--brand) 50%,#000)' }}>
        <svg viewBox="0 0 32 32" width={mark * 0.7} height={mark * 0.7} shapeRendering="crispEdges">
          <polygon points="6,4 13,9 6,11" fill="#fff" />
          <polygon points="26,4 19,9 26,11" fill="#fff" />
          <polygon points="9,8 22,8 25,12 25,22 20,26 12,26 7,22 7,12" fill="#fff" />
          <rect x="12" y="15" width="2" height="3" fill="var(--brand)" />
          <rect x="18" y="15" width="2" height="3" fill="var(--brand)" />
          <polygon points="15,19 17,19 16,21" fill="var(--brand)" />
        </svg>
      </div>
      <span className="font-pixel neon" style={{ fontSize: size, color: 'var(--brand)' }}>FlowUp</span>
    </div>
    </div>
  );
}

export function OfficeArt({
  children,
  dim = 0.5,
  className,
}: {
  children: React.ReactNode;
  dim?: number;
  className?: string;
}) {
  return (
    // <div
    //   className={cn(
    //     "relative h-full overflow-hidden bg-zinc-200",
    //     className,
    //   )}
    // >
    //   <Image
    //     src="/assets/pixel-office.png"
    //     alt=""
    //     fill
    //     priority
    //     sizes="(max-width: 1024px) 100vw, 65vw"
    //     className="pixelated object-cover object-center"
    //   />
    //   <div
    //     className="absolute inset-0"
    //     style={{
    //       background: `linear-gradient(90deg, rgba(25,21,39,.12), rgba(25,21,39,.2)), radial-gradient(circle at 48% 38%, transparent 34%, rgba(25,21,39,${dim}) 100%)`,
    //     }}
    //   />
    //   <div className="blueprint-grid absolute inset-0 opacity-50" />
    //   <FloatingBubbles />
    //   <div className="relative h-full">{children}</div>
    // </div>
     <div
      className={cn("relative h-full overflow-hidden bg-[var(--bg-deep)]", className)}
    >
      {/* <img src="assets/office.png" className="pixelated" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.9 }} /> */}
       <Image
        src="/assets/pixel-office.png"
        alt=""
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 65vw"
        className="pixelated object-cover object-center"
      />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, transparent, color-mix(in srgb, var(--bg-deep) ' + dim * 100 + '%, transparent) 70%, var(--bg-deep))' }} />
      <div className="blueprint" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
      {/* drifting status bubbles */}
      <FloatingBubbles />
      <div style={{ position: 'relative', height: '100%' }}>{children}</div>
    </div>
  );
}

export function FloatingBubbles() {
  const bubbles = [
    { x: "18%", y: "22%", c: "var(--dev)", t: "</>" },
    { x: "74%", y: "18%", c: "var(--head)", t: "chart" },
    { x: "22%", y: "53%", c: "var(--uat)", t: "search" },
    { x: "70%", y: "46%", c: "var(--deploy)", t: "rocket" },
  ];

  return (
    <>
      {bubbles.map((bubble, index) => (
        <div
          key={bubble.t}
          className="absolute"
          style={{
            left: bubble.x,
            top: bubble.y,
            animation: `flo-bob ${2.5 + index * 0.4}s ease-in-out infinite`,
            animationDelay: `${index * 0.3}s`,
          }}
        >
          <div
            className="grid h-14 w-14 place-items-center rounded-md border-2 bg-white text-lg font-bold shadow-[0_4px_0_rgba(0,0,0,.18)]"
            style={{
              color: bubble.c,
              borderColor: bubble.c,
              boxShadow: `0 4px 0 rgba(0,0,0,.18), 0 0 16px color-mix(in srgb, ${bubble.c} 30%, transparent)`,
            }}
          >
            <BubbleIcon name={bubble.t} />
          </div>
        </div>
      ))}
    </>
  );
}

function BubbleIcon({ name }: { name: string }) {
  if (name === "chart") {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <rect x="5" y="11" width="3" height="7" fill="#3e8bff" />
        <rect x="11" y="6" width="3" height="12" fill="#2fd17a" />
        <rect x="17" y="9" width="3" height="9" fill="#ff5ca8" />
      </svg>
    );
  }
  if (name === "search") return "⌕";
  if (name === "rocket") return "🚀";
  return name;
}

export function Spinner({ light = false }: { light?: boolean }) {
  return (
    <span
      className="inline-block h-4 w-4 rounded-full"
      style={{
        border: `2px solid ${light ? "rgba(255,255,255,.4)" : "var(--border-2)"}`,
        borderTopColor: light ? "#fff" : "var(--brand)",
        animation: "flo-spin .7s linear infinite",
      }}
    />
  );
}
