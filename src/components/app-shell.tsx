"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Command,
  Eye,
  EyeOff,
  Home,
  Lock,
  LogOut,
  Map,
  MoreHorizontal,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { FlowLogo } from "@/components/auth-art";
import { CatAvatar } from "@/components/pixel-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMembers } from "@/hooks/use-members";
import { useCreateSpace, useDeleteSpace, useSpaces, useUpdateSpace } from "@/hooks/use-spaces";
import { initials } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

type ShellWorkspace = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

type ShellUser = {
  name?: string | null;
  displayName?: string | null;
  email?: string | null;
  avatarTone: string;
  avatarAccent: string;
};

type ShellSpace = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  color: string;
  visibility: "PUBLIC" | "SELECTED" | "PRIVATE";
  ownerId: string | null;
  viewerIds: string[];
  taskCount: number;
};

export function AppShell({
  workspace,
  user,
  spaces,
  children,
}: {
  workspace: ShellWorkspace;
  user: ShellUser;
  spaces: ShellSpace[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const spacesQuery = useSpaces(workspace.id);
  const liveSpaces = spacesQuery.data?.spaces ?? spaces;
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const commandPaletteOpen = useUiStore((state) => state.commandPaletteOpen);
  const setCommandPaletteOpen = useUiStore((state) => state.setCommandPaletteOpen);
  const [spaceDialogOpen, setSpaceDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<ShellSpace | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const firstSpaceHref = liveSpaces[0]
    ? `/${workspace.slug}/spaces/${liveSpaces[0].id}`
    : `/${workspace.slug}/office`;
  const title = pageTitle(pathname, workspace.slug, liveSpaces);
  const openCreateSpace = () => {
    setEditingSpace(null);
    setSpaceDialogOpen(true);
  };
  const openEditSpace = (space: ShellSpace) => {
    setEditingSpace(space);
    setSpaceDialogOpen(true);
  };
  const searchItems = useMemo(
    () => [
      { label: "ภาพรวม", description: workspace.name, href: `/${workspace.slug}/dashboard`, icon: Home },
      { label: "ตึกออฟฟิศ", description: "ดูแผนที่ Spaces", href: `/${workspace.slug}/office`, icon: Map },
      { label: "สมาชิก & เชิญ", description: "จัดการสมาชิกและ invite links", href: `/${workspace.slug}/invites`, icon: Users },
      { label: "ตั้งค่า", description: "ธีมและการแจ้งเตือน", href: `/${workspace.slug}/settings`, icon: Settings },
      ...liveSpaces.map((space) => ({
        label: space.name,
        description: `${space.key} · ${space.taskCount} งาน`,
        href: `/${workspace.slug}/spaces/${space.id}`,
        icon: Search,
      })),
    ],
    [liveSpaces, workspace.name, workspace.slug],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setCommandPaletteOpen]);

  return (
    <div
      className="workspace-shell flex h-screen overflow-hidden bg-background text-foreground"
      style={{
        "--brand": workspace.color,
        "--workspace-color": workspace.color,
      } as CSSProperties}
    >
      <aside
        className="relative z-40 hidden h-full shrink-0 flex-col border-r-2 border-(--border-2) bg-(--surface) transition-[width] duration-200 md:flex"
        style={{ width: collapsed ? 62 : 252 }}
      >
        <button
          className="iconbtn absolute -right-4.5 top-20.5 z-80 h-9 w-9 border-(--border-2) bg-(--surface)! shadow-[0_3px_0_var(--shadow-hard)]"
          onClick={toggleSidebar}
          title={collapsed ? "ขยายแถบ" : "ย่อแถบ"}
          type="button"
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
        <div className="p-3">
          <div className="mb-3 flex items-center justify-center px-0.5">
            {collapsed ? <FlowLogo size={0} mark={26} /> : <FlowLogo size={17} mark={24} />}
          </div>
          <Link
            href={`/${workspace.slug}/dashboard`}
            className="navitem flex items-center justify-between gap-2 border-[var(--border)] bg-[var(--surface-2)] px-2 py-2"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-md border-2 bg-[color-mix(in_srgb,var(--workspace-color)_22%,var(--surface))] text-[15px]"
                style={{ borderColor: workspace.color } as CSSProperties}
              >
                {workspace.icon}
              </span>
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{workspace.name}</span>
                  <span className="font-tech block text-[11px] text-[var(--faint)]">
                    {workspace.role} · {liveSpaces.length} spaces
                  </span>
                </span>
              )}
            </span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-hidden px-3">
          <ShellLink
            collapsed={collapsed}
            active={pathname === `/${workspace.slug}/dashboard`}
            href={`/${workspace.slug}/dashboard`}
            icon={<Home size={18} />}
          >
            ภาพรวม
          </ShellLink>
          <ShellLink
            collapsed={collapsed}
            active={pathname === `/${workspace.slug}/office`}
            href={`/${workspace.slug}/office`}
            icon={<Map size={18} />}
          >
            ตึกออฟฟิศ
          </ShellLink>

          <div className="mt-4 flex items-center justify-between px-1">
            {!collapsed && (
              <span className="font-tech text-[11px] font-bold uppercase tracking-[.5px] text-muted-foreground">
                Spaces
              </span>
            )}
            <button className="iconbtn h-6 w-6" title="เพิ่ม Space" onClick={openCreateSpace} type="button">
              <Plus size={15} />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pb-2">
            {liveSpaces.length === 0 && !collapsed && (
              <button
                className="navitem flex items-center gap-2 border-dashed px-2 py-2 text-left text-sm text-muted-foreground"
                onClick={openCreateSpace}
                type="button"
              >
                <Plus size={15} />
                สร้าง Space แรก
              </button>
            )}
            {liveSpaces.map((space, index) => (
              <div key={space.id} className="group flex items-center gap-1">
                <ShellLink
                  collapsed={collapsed}
                  active={pathname === `/${workspace.slug}/spaces/${space.id}`}
                  href={`/${workspace.slug}/spaces/${space.id}`}
                  icon={
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 text-[9px] font-bold text-white shadow-[0_0_8px_color-mix(in_srgb,var(--space-accent)_45%,transparent)]"
                      style={{
                        background: space.color || roomAccent(index),
                        borderColor: `color-mix(in srgb, ${space.color || roomAccent(index)} 60%, #fff)`,
                        "--space-accent": space.color || roomAccent(index),
                      } as CSSProperties}
                    >
                      {space.key.slice(0, 2)}
                    </span>
                  }
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[var(--text)]">{space.name}</span>
                  </span>
                  {space.visibility !== "PUBLIC" && <Lock size={12} className="shrink-0 text-muted-foreground" />}
                  {space.taskCount > 0 ? (
                    <span className="chip ml-auto bg-[var(--surface-3)] px-2 py-0 text-[11px] text-muted-foreground">
                      {space.taskCount}
                    </span>
                  ) : (
                    <span className="ml-auto h-2 w-2 rounded-[2px] bg-[var(--faint)] opacity-50" />
                  )}
                </ShellLink>
                {!collapsed && (
                  <button
                    className="iconbtn h-8 w-8 opacity-70 transition group-hover:opacity-100"
                    title="แก้ไข Space"
                    onClick={() => openEditSpace(space)}
                    type="button"
                  >
                    <MoreHorizontal size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-1 border-t-2 border-[var(--border)] py-2">
            <ShellLink
              collapsed={collapsed}
              active={pathname === `/${workspace.slug}/invites`}
              href={`/${workspace.slug}/invites`}
              icon={<Users size={18} />}
            >
              สมาชิก & เชิญ
            </ShellLink>
            <ShellLink
              collapsed={collapsed}
              active={pathname === `/${workspace.slug}/settings`}
              href={`/${workspace.slug}/settings`}
              icon={<Settings size={18} />}
            >
              ตั้งค่า
            </ShellLink>
          </div>
        </nav>

        <div className="flex items-center gap-2 border-t-2 border-[var(--border)] p-3">
          <CatAvatar cat={safeCatTone(user.avatarTone)} size={32} online label={user.displayName ?? user.name ?? "current user"} />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">
                {user.displayName ?? user.name ?? "FlowUp user"}
              </span>
              <span className="block truncate text-[11px] text-[var(--faint)]">
                {user.email ?? "Product owner"}
              </span>
            </span>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[58px] shrink-0 items-center justify-between gap-3 border-b-2 border-(--border-2) bg-(--surface) px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="md:hidden">
              <FlowLogo size={0} mark={28} />
            </div>
            <h2 className="truncate text-lg font-semibold">{title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="pbtn hidden h-10 px-2 text-[13.5px] sm:inline-flex lg:px-3"
              onClick={() => setCommandPaletteOpen(true)}
              type="button"
            >
              <Search size={16} />
              <span className="hidden lg:inline">ค้นหา</span>
              <kbd className="font-tech hidden rounded border border-[var(--border)] bg-[var(--surface-3)] px-1.5 py-0.5 text-[11px] text-muted-foreground xl:inline-flex">
                <Command size={11} className="inline" />K
              </kbd>
            </button>
            <button className="iconbtn relative h-9 w-9" title="การแจ้งเตือน">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-[2px] border border-[var(--surface)] bg-[var(--pr-urgent)]" />
            </button>
            <ThemeToggle />
            {liveSpaces.length > 0 ? (
              <Button asChild className="h-9 px-3 text-[13.5px]">
                <Link href={firstSpaceHref}>
                  <Plus size={16} />
                  <span className="hide-narrow">งานใหม่</span>
                </Link>
              </Button>
            ) : (
              <Button className="h-9 px-3 text-[13.5px]" onClick={openCreateSpace} type="button">
                <Plus size={16} />
                <span className="hide-narrow">สร้าง Space</span>
              </Button>
            )}
            <div className="relative hidden sm:block">
              <button
                className="grid place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)]"
                type="button"
                aria-label="เปิดเมนูบัญชี"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((open) => !open)}
              >
                <CatAvatar
                  cat={safeCatTone(user.avatarTone)}
                  size={34}
                  online
                  title={initials(user.displayName ?? user.name ?? workspace.name)}
                />
              </button>
              {userMenuOpen && (
                <div className="pixel-card anim-pop absolute right-0 top-[calc(100%+10px)] z-[70] w-[260px] bg-(--surface) p-3 shadow-[0_8px_0_var(--shadow-hard)]">
                  <div className="flex items-center gap-3 border-b-2 border-[var(--border)] px-1 pb-3">
                    <CatAvatar cat={safeCatTone(user.avatarTone)} size={42} online />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{user.displayName ?? user.name ?? "FlowUp user"}</p>
                      <p className="truncate text-sm text-muted-foreground">{user.email ?? "ไม่มีอีเมล"}</p>
                    </div>
                  </div>
                  <div className="grid gap-1 pt-3">
                    <Link
                      href={`/${workspace.slug}/settings`}
                      className="navitem min-h-10 px-2 py-2"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings size={18} />
                      ตั้งค่า
                    </Link>
                    <button
                      className="navitem min-h-10 px-2 py-2 text-left"
                      type="button"
                      onClick={() => {
                        setTheme(theme === "dark" ? "light" : "dark");
                        setUserMenuOpen(false);
                      }}
                    >
                      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                      สลับธีม
                    </button>
                    <button
                      className="navitem min-h-10 px-2 py-2 text-left text-[var(--pr-urgent)] hover:text-[var(--pr-urgent)]"
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                      <LogOut size={18} />
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="mobile-safe-bottom min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t-2 border-(--border-2) bg-(--surface) px-1 py-1 shadow-[0_-8px_24px_var(--shadow-soft)] md:hidden">
        <MobileShellLink
          active={pathname === `/${workspace.slug}/dashboard`}
          href={`/${workspace.slug}/dashboard`}
          icon={<Home size={18} />}
          label="ภาพรวม"
        />
        <MobileShellLink
          active={pathname === `/${workspace.slug}/office`}
          href={`/${workspace.slug}/office`}
          icon={<Map size={18} />}
          label="ตึก"
        />
        <MobileShellLink
          active={liveSpaces.some((space) => pathname === `/${workspace.slug}/spaces/${space.id}`)}
          href={firstSpaceHref}
          icon={<Plus size={18} />}
          label="งาน"
        />
        <MobileShellLink
          active={pathname === `/${workspace.slug}/invites`}
          href={`/${workspace.slug}/invites`}
          icon={<Users size={18} />}
          label="สมาชิก"
        />
        <MobileShellLink
          active={pathname === `/${workspace.slug}/settings`}
          href={`/${workspace.slug}/settings`}
          icon={<Settings size={18} />}
          label="ตั้งค่า"
        />
      </nav>
      {spaceDialogOpen && (
        <SpaceDialog
          workspaceId={workspace.id}
          space={editingSpace}
          onClose={() => setSpaceDialogOpen(false)}
          onChanged={() => router.refresh()}
        />
      )}
      {commandPaletteOpen && (
        <CommandPalette
          items={searchItems}
          onClose={() => setCommandPaletteOpen(false)}
          onSelect={(href) => {
            setCommandPaletteOpen(false);
            router.push(href);
          }}
        />
      )}
    </div>
  );
}

function CommandPalette({
  items,
  onClose,
  onSelect,
}: {
  items: {
    label: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[];
  onClose: () => void;
  onSelect: (href: string) => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter((item) =>
        `${item.label} ${item.description}`.toLowerCase().includes(normalizedQuery),
      )
    : items;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="scrim z-[90] flex items-start justify-center p-3 pt-20 sm:p-6 sm:pt-24" onMouseDown={onClose}>
      <section
        className="pixel-card anim-pop w-full max-w-[620px] overflow-hidden bg-(--surface) p-0"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b-2 border-[var(--border)] px-4 py-3">
          <Search size={18} className="text-muted-foreground" />
          <input
            className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-[var(--faint)]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหา Space, หน้า, การตั้งค่า..."
            autoFocus
          />
          <button className="iconbtn h-8 w-8" type="button" onClick={onClose} aria-label="ปิดค้นหา">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[420px] overflow-auto p-2">
          {filteredItems.length === 0 && (
            <p className="rounded-md border-2 border-dashed border-[var(--border)] p-4 text-sm text-muted-foreground">
              ไม่พบผลลัพธ์
            </p>
          )}
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-[var(--hover)]"
                type="button"
                onClick={() => onSelect(item.href)}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-[var(--border)] bg-[var(--surface-2)] text-[var(--brand)]">
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{item.label}</span>
                  <span className="block truncate text-sm text-muted-foreground">{item.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MobileShellLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[11px] font-semibold ${
        active
          ? "bg-[color-mix(in_srgb,var(--brand)_14%,var(--surface-2))] text-[var(--brand)]"
          : "text-muted-foreground"
      }`}
    >
      {icon}
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

function ShellLink({
  href,
  icon,
  children,
  collapsed,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`navitem flex min-h-10 w-full min-w-0 items-center gap-2 px-2 py-1.5 text-sm ${active ? "active" : ""}`}
      title={collapsed && typeof children === "string" ? children : undefined}
    >
      {icon}
      {!collapsed && children}
    </Link>
  );
}

function pageTitle(pathname: string, slug: string, spaces: ShellSpace[]) {
  if (pathname.endsWith("/office")) return "ตึกออฟฟิศ";
  if (pathname.endsWith("/invites")) return "สมาชิก & การเชิญ";
  if (pathname.endsWith("/settings")) return "ตั้งค่า";
  const space = spaces.find((item) => pathname === `/${slug}/spaces/${item.id}`);
  return space?.name ?? "ภาพรวม";
}

function roomAccent(index: number) {
  return ["var(--dev)", "var(--head)", "var(--uat)", "var(--deploy)", "var(--brand)"][index] ?? "var(--brand)";
}

function safeCatTone(value: string) {
  return ["orange", "gray", "cream", "tux", "blue", "pink"].includes(value)
    ? (value as "orange" | "gray" | "cream" | "tux" | "blue" | "pink")
    : "orange";
}

function SpaceDialog({
  workspaceId,
  space,
  onClose,
  onChanged,
}: {
  workspaceId: string;
  space: ShellSpace | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const membersQuery = useMembers(workspaceId);
  const createSpace = useCreateSpace();
  const updateSpace = useUpdateSpace(workspaceId);
  const deleteSpace = useDeleteSpace(workspaceId);
  const [name, setName] = useState(space?.name ?? "");
  const [key, setKey] = useState(space?.key ?? "");
  const [description, setDescription] = useState(space?.description ?? "");
  const [color, setColor] = useState(space?.color?.startsWith("var(") ? "#8B6CF6" : space?.color ?? "#8B6CF6");
  const [visibility, setVisibility] = useState<"PUBLIC" | "SELECTED" | "PRIVATE">(space?.visibility ?? "PUBLIC");
  const [viewerIds, setViewerIds] = useState<string[]>(space?.viewerIds ?? []);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(space);
  const busy = createSpace.isPending || updateSpace.isPending || deleteSpace.isPending;
  const members = useMemo(() => membersQuery.data?.members ?? [], [membersQuery.data?.members]);

  async function submit() {
    setError(null);
    const normalizedKey = (key || keyFromName(name)).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    const payload = {
      workspaceId,
      name: name.trim(),
      key: normalizedKey,
      description: description.trim(),
      color,
      visibility,
      viewerIds: visibility === "SELECTED" ? viewerIds : [],
    };

    try {
      if (space) {
        await updateSpace.mutateAsync({ ...payload, id: space.id });
      } else {
        await createSpace.mutateAsync(payload);
      }
      onChanged();
      onClose();
    } catch {
      setError("บันทึก Space ไม่สำเร็จ ตรวจชื่อ, key หรือสิทธิ์การมองเห็นอีกครั้ง");
    }
  }

  async function remove() {
    if (!space) return;
    if (!confirm(`ลบ Space "${space.name}" และงานทั้งหมดในห้องนี้?`)) return;
    try {
      await deleteSpace.mutateAsync(space.id);
      onChanged();
      onClose();
    } catch {
      setError("ลบ Space ไม่สำเร็จ");
    }
  }

  function toggleViewer(userId: string) {
    setViewerIds((current) =>
      current.includes(userId)
        ? current.filter((item) => item !== userId)
        : [...current, userId],
    );
  }

  return (
    <div className="scrim z-[80] flex items-center justify-center p-5" onMouseDown={onClose}>
      <section
        className="pixel-card anim-pop max-h-[92vh] w-full max-w-[560px] overflow-auto bg-(--surface) p-0"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b-2 border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? "แก้ไข Space" : "สร้าง Space ใหม่"}</h2>
            <p className="text-xs text-muted-foreground">กำหนดชื่อ สี และคนที่มองเห็นห้องนี้</p>
          </div>
          <button className="iconbtn h-9 w-9" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </header>

        <div className="grid gap-4 p-5">
          <div className="grid gap-2">
            <Label className="lbl" htmlFor="space-name">ชื่อ Space</Label>
            <Input id="space-name" value={name} onChange={(event) => {
              setName(event.target.value);
              if (!isEditing) setKey(keyFromName(event.target.value));
            }} placeholder="เช่น Developer, UAT, Marketing" />
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
            <div className="grid gap-2">
              <Label className="lbl" htmlFor="space-key">Key</Label>
              <Input id="space-key" value={key} onChange={(event) => setKey(event.target.value.toUpperCase())} placeholder="DEV" />
            </div>
            <div className="grid gap-2">
              <Label className="lbl" htmlFor="space-color">สี</Label>
              <Input id="space-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-10 p-1" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="lbl" htmlFor="space-desc">คำอธิบาย</Label>
            <Textarea id="space-desc" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </div>

          <div className="grid gap-2">
            <Label className="lbl" htmlFor="space-visibility">ใครเห็น Space นี้ได้บ้าง</Label>
            <Select id="space-visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as typeof visibility)}>
              <option value="PUBLIC">เห็นได้ทุกคนใน Workspace</option>
              <option value="SELECTED">เลือกคนที่เห็นได้</option>
              <option value="PRIVATE">ส่วนตัว เฉพาะเจ้าของ</option>
            </Select>
            <VisibilityHint visibility={visibility} />
          </div>

          {visibility === "SELECTED" && (
            <div className="pixel-frame grid max-h-52 gap-2 overflow-auto p-3">
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground">ยังไม่มีสมาชิกให้เลือก</p>
              )}
              {members.map((member) => (
                <label key={member.user.id} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={viewerIds.includes(member.user.id)}
                    onChange={() => toggleViewer(member.user.id)}
                  />
                  <CatAvatar cat="gray" size={28} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{member.user.name ?? member.user.email}</span>
                    <span className="text-xs text-muted-foreground">{member.role}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[var(--border)] px-5 py-4">
          {isEditing ? (
            <button className="pbtn border-[var(--pr-urgent)] px-3 py-2 text-sm text-[var(--pr-urgent)]" disabled={busy} onClick={remove} type="button">
              <Trash2 size={15} />
              ลบ Space
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button className="pbtn px-3 py-2 text-sm" onClick={onClose} type="button">ยกเลิก</button>
            <Button disabled={busy} onClick={submit} type="button">
              {busy ? "กำลังบันทึก..." : isEditing ? "บันทึกการแก้ไข" : "สร้าง Space"}
            </Button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function VisibilityHint({ visibility }: { visibility: "PUBLIC" | "SELECTED" | "PRIVATE" }) {
  const content = {
    PUBLIC: { icon: Eye, text: "สมาชิกทุกคนใน Workspace จะเห็น Space นี้" },
    SELECTED: { icon: Users, text: "เฉพาะคนที่เลือก และเจ้าของ Space จะเห็น" },
    PRIVATE: { icon: EyeOff, text: "เฉพาะคนสร้าง Space จะเห็น" },
  }[visibility];
  const Icon = content.icon;
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon size={14} />
      {content.text}
    </p>
  );
}

function keyFromName(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase()
    .slice(0, 4);
  return normalized || "SPC";
}
