import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Building2, Users } from "lucide-react";
import { CatAvatar, type CatTone } from "@/components/pixel-primitives";
import { cn } from "@/lib/utils";

type OfficeSpace = {
  id: string;
  name: string;
  key: string;
  color: string;
  taskCount: number;
  openTaskCount: number;
};

type OfficeMember = {
  id: string;
  name: string | null;
  email: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
  avatarTone: CatTone;
  avatarAccent: string;
};

const roomPositions = [
  { key: "dev", label: "DEVELOPER", top: "21%", left: "25%", accent: "var(--dev)" },
  { key: "head", label: "SECTION HEAD", top: "17%", left: "75%", accent: "var(--head)" },
  { key: "uat", label: "UAT", top: "45%", left: "23%", accent: "var(--uat)" },
  { key: "deploy", label: "DEPLOY", top: "45%", left: "74%", accent: "var(--deploy)" },
];

export function OfficeMap({
  workspaceSlug,
  spaces,
  members = [],
  className,
  compact = false,
}: {
  workspaceSlug: string;
  spaces: OfficeSpace[];
  members?: OfficeMember[];
  className?: string;
  compact?: boolean;
}) {
  const mapped = spaces.slice(0, 4);
  const extra = compact ? [] : spaces.slice(4);

  return (
    <section className={cn("grid gap-3", className)}>
      <div className="pixel-card overflow-hidden bg-[var(--bg-deep)] p-0">
        <div className="relative aspect-square min-h-[320px] w-full sm:min-h-[420px]">
          <Image
            src="/assets/pixel-office.png"
            alt="ตึกออฟฟิศแมวแบบพิกเซล"
            fill
            sizes="(max-width: 1024px) 100vw, 1080px"
            priority={!compact}
            className="pixelated object-cover"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_55%,color-mix(in_srgb,var(--bg-deep)_52%,transparent))]" />
          <AmbientSprites />
          {mapped.map((space, index) => (
            <RoomMarker
              key={space.id}
              workspaceSlug={workspaceSlug}
              space={space}
              position={roomPositions[index]}
              index={index}
              compact={compact}
              members={membersForRoom(members, index, compact ? 2 : 3)}
            />
          ))}
          <div className="absolute bottom-[8%] left-1/2 z-10 -translate-x-1/2">
            <span className="chip border-[var(--lobby)] bg-[color-mix(in_srgb,var(--lobby)_18%,var(--surface))] text-[var(--lobby)] shadow-[0_0_14px_color-mix(in_srgb,var(--lobby)_40%,transparent)]">
              <Building2 size={13} />
              ล็อบบี้ · ทางเข้า
            </span>
          </div>
        </div>
      </div>

      {extra.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {extra.map((space) => (
              <Link
                key={space.id}
                href={`/${workspaceSlug}/spaces/${space.id}`}
                className="pbtn px-3 py-2 text-sm"
              >
                <span className="h-4 w-4 rounded" style={{ background: space.color }} />
                {space.name}
                <span className="chip bg-[var(--surface-3)] px-2 py-0 text-[11px] text-muted-foreground">
                  {space.openTaskCount}
                </span>
              </Link>
            ))}
          </div>
          <Link href={`/${workspaceSlug}/invites`} className="pbtn px-3 py-2 text-sm">
            <Users size={16} />
            ดูสมาชิกทั้งตึก
          </Link>
        </div>
      )}
    </section>
  );
}

function RoomMarker({
  workspaceSlug,
  space,
  position,
  index,
  compact,
  members,
}: {
  workspaceSlug: string;
  space: OfficeSpace;
  position: (typeof roomPositions)[number];
  index: number;
  compact: boolean;
  members: OfficeMember[];
}) {
  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ top: position.top, left: position.left }}
    >
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--room-accent)_32%,transparent),transparent_68%)] blur-md transition-all group-hover:h-56 group-hover:w-56"
        style={{ "--room-accent": position.accent } as CSSProperties}
      />
      <Link
        href={`/${workspaceSlug}/spaces/${space.id}`}
        className="pixel-card group relative block min-w-32 cursor-pointer bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] p-2 text-left backdrop-blur transition duration-200 hover:-translate-y-1 hover:scale-[1.04] sm:min-w-36 sm:p-2.5"
        style={{
          borderColor: position.accent,
          boxShadow: `0 4px 0 rgba(0,0,0,.55), 0 0 ${compact ? 12 : 18}px color-mix(in srgb, ${position.accent} 50%, transparent)`,
          animation: `flo-bob ${3 + index * 0.5}s ease-in-out infinite`,
          animationDelay: `${index * 0.25}s`,
        }}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md border-2 bg-[color-mix(in_srgb,var(--room-accent)_24%,var(--surface))] text-[13px]"
              style={{ "--room-accent": position.accent, borderColor: position.accent } as CSSProperties}
            >
              {space.key.slice(0, 1)}
            </span>
            <span className="min-w-0">
              <span className="font-pixel block text-[8.5px] uppercase tracking-normal" style={{ color: position.accent }}>
                {position.label}
              </span>
              <span className="font-tech block truncate text-[13px] font-bold leading-tight sm:text-[14.5px]">
                {space.name}
              </span>
            </span>
          </span>
          {space.openTaskCount > 0 && (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[var(--pr-urgent)]"
              title={`${space.openTaskCount} งานเปิดอยู่`}
            />
          )}
        </span>
        <span className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span className="flex pl-1">
              {members.map((member) => (
                <span
                  key={member.id}
                  className="-ml-1.5 rounded-md border-2 border-[var(--surface)] bg-[var(--surface)]"
                  style={{ boxShadow: `0 0 0 1px ${member.avatarAccent}` }}
                >
                  <CatAvatar
                    cat={member.avatarTone}
                    size={22}
                    title={member.name ?? member.email ?? "member"}
                  />
                </span>
              ))}
            </span>
            {!compact && <span className="font-tech text-[11.5px] text-muted-foreground">กำลังทำงาน</span>}
          </span>
          <span className="chip bg-[color-mix(in_srgb,currentColor_14%,transparent)] px-2 py-0 text-[11.5px]" style={{ color: position.accent }}>
            {space.openTaskCount} งาน
          </span>
        </span>
        {!compact && (
          <span className="font-tech mt-2 hidden items-center gap-1.5 text-[12.5px] font-bold group-hover:flex" style={{ color: position.accent }}>
            เข้าสู่ Space <ArrowRight size={13} />
          </span>
        )}
      </Link>
    </div>
  );
}

function membersForRoom(members: OfficeMember[], roomIndex: number, count: number) {
  if (members.length === 0) return [];
  return Array.from({ length: Math.min(count, members.length) }, (_, offset) => {
    const index = (roomIndex + offset) % members.length;
    return members[index];
  });
}

function AmbientSprites() {
  const sprites = [
    { x: "50%", y: "64%", text: "💬", duration: 5 },
    { x: "40%", y: "36%", text: "✨", duration: 6 },
    { x: "62%", y: "32%", text: "⚙️", duration: 7 },
    { x: "55%", y: "78%", text: "🐾", duration: 8 },
  ];

  return (
    <>
      {sprites.map((sprite, index) => (
        <span
          key={`${sprite.text}-${index}`}
          className="pointer-events-none absolute z-10 text-base opacity-80 drop-shadow"
          style={{
            left: sprite.x,
            top: sprite.y,
            animation: `flo-drift ${sprite.duration}s ease-in-out infinite`,
            animationDelay: `${index * 0.6}s`,
          }}
        >
          {sprite.text}
        </span>
      ))}
    </>
  );
}
