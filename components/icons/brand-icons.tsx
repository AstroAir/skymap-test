/**
 * Brand icon wrappers
 * Wraps Simple Icons components to match Lucide's className-based interface,
 * and re-exports custom icons for brands not in Simple Icons.
 */

import {
  SiNextdotjs,
  SiReact,
  SiTypescript,
  SiTailwindcss,
  SiTauri,
  SiShadcnui,
  SiApple,
  SiLinux,
  SiGithub,
} from '@icons-pack/react-simple-icons';
import { StellariumIcon } from './stellarium-icon';
import { ZustandIcon } from './zustand-icon';
import { WindowsIcon as CustomWindowsIcon } from './windows-icon';

// ============================================================================
// Simple Icons wrapper to match Lucide interface (className + currentColor)
// ============================================================================

type IconProps = { className?: string; style?: React.CSSProperties };

function wrap(
  Icon: React.ComponentType<{ size?: number | string; color?: string; className?: string; style?: React.CSSProperties; title?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>,
) {
  const Wrapped = ({ className, style }: IconProps) => (
    <Icon color="currentColor" className={className} style={style} title="" aria-hidden="true" />
  );
  Wrapped.displayName = Icon.displayName ?? 'WrappedSimpleIcon';
  return Wrapped;
}

// ============================================================================
// Wrapped Simple Icons — use these instead of raw Si* imports
// ============================================================================

export const NextjsIcon = wrap(SiNextdotjs);
export const ReactIcon = wrap(SiReact);
export const TypeScriptIcon = wrap(SiTypescript);
export const TailwindIcon = wrap(SiTailwindcss);
export const TauriIcon = wrap(SiTauri);
export const ShadcnIcon = wrap(SiShadcnui);
export const WindowsIcon = CustomWindowsIcon;
export const AppleIcon = wrap(SiApple);
export const LinuxIcon = wrap(SiLinux);
export const GitHubIcon = wrap(SiGithub);

// ============================================================================
// Re-export custom icons
// ============================================================================

export { StellariumIcon } from './stellarium-icon';
export { ZustandIcon } from './zustand-icon';

// ============================================================================
// Tech stack icon map (for tech-stack.tsx)
// ============================================================================

export const techBrandIconMap: Record<string, React.ComponentType<IconProps>> = {
  stellariumEngine: StellariumIcon,
  nextjs: NextjsIcon,
  react: ReactIcon,
  typescript: TypeScriptIcon,
  tailwind: TailwindIcon,
  tauri: TauriIcon,
  zustand: ZustandIcon,
  shadcnui: ShadcnIcon,
};

// ============================================================================
// Platform icon map (for hero-section.tsx)
// ============================================================================

export const platformIconMap: Record<string, React.ComponentType<IconProps>> = {
  windows: WindowsIcon,
  macos: AppleIcon,
  linux: LinuxIcon,
};
