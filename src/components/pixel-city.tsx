import { cn } from "@/lib/utils";

const buildings = [
  "h-20 bg-primary/75",
  "h-28 bg-secondary",
  "h-16 bg-accent",
  "h-32 bg-primary/55",
  "h-24 bg-secondary/80",
  "h-14 bg-accent/80",
];

export function PixelCity({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("blueprint-grid relative overflow-hidden rounded-lg border", className)}
    >
      <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 px-4">
        {buildings.map((building, index) => (
          <div
            key={building + index}
            className={cn("pixel-window w-14 rounded-t-sm", building)}
          >
            <div className="grid grid-cols-3 gap-1 p-2">
              {Array.from({ length: 9 }).map((_, windowIndex) => (
                <span
                  key={windowIndex}
                  className="aspect-square bg-background/70"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 right-8 pixel-cat pixelated" />
    </div>
  );
}
