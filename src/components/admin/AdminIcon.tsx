/** Admin UI icons — Lucide */

import {
  Atom,
  BarChart3,
  BookOpen,
  ChevronLeft,
  CircleDot,
  ClipboardList,
  CreditCard,
  FileText,
  Flame,
  Folder,
  HelpCircle,
  Map,
  Trophy,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react';

export type AdminIconName =
  | 'chart'
  | 'layers'
  | 'video'
  | 'help'
  | 'folder'
  | 'clipboard'
  | 'users'
  | 'trophy'
  | 'map'
  | 'node'
  | 'file'
  | 'book'
  | 'chevron-left'
  | 'flame'
  | 'atom'
  | 'coin';

const ICON_MAP: Record<AdminIconName, LucideIcon> = {
  chart: BarChart3,
  layers: Map,
  video: Video,
  help: HelpCircle,
  folder: Folder,
  clipboard: ClipboardList,
  users: Users,
  trophy: Trophy,
  map: Map,
  node: CircleDot,
  file: FileText,
  book: BookOpen,
  'chevron-left': ChevronLeft,
  flame: Flame,
  atom: Atom,
  coin: CreditCard,
};

export function AdminIcon({
  name,
  size = 18,
  className,
  strokeWidth = 1.75,
}: {
  name: AdminIconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} className={className} strokeWidth={strokeWidth} aria-hidden />;
}

/** Topic badges on game map — letters/symbols, not emoji */
export const TOPIC_ICON_GLYPHS = ['Φ', 'λ', 'π', 'Ω', 'F', 'v', 'E', 'P', 'H', 'K'] as const;
