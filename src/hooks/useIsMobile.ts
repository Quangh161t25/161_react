import { useState, useEffect } from 'react';

/**
 * Hook phát hiện giao diện màn hình điện thoại (mobile)
 * Mặc định breakpoint là 768px (theo chuẩn Tailwind md breakpoint)
 */
export const useIsMobile = (breakpoint = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
};
