import type { CSSProperties } from 'react';
import logoLight from '../../ds/assets/logo.png';
import logoDark from '../../ds/assets/logo-dark.png';
import { useThemeOptional } from '../../theme/useTheme';

type BrandLogoProps = {
  height?: number | string;
  style?: CSSProperties;
  className?: string;
  alt?: string;
};

/** 테마에 맞는 Qurie 로고. 다크모드는 흰 전용 자산을 쓴다. */
export function BrandLogo({
  height = 36,
  style,
  className,
  alt = 'Qurie',
}: BrandLogoProps) {
  const dark = useThemeOptional()?.theme === 'dark';
  return (
    <img
      src={dark ? logoDark : logoLight}
      alt={alt}
      className={className}
      style={{
        height,
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
        ...style,
      }}
    />
  );
}
