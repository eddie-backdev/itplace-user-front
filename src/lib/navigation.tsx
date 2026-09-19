'use client';

import NextLink from 'next/link';
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { useCallback, useEffect, useMemo } from 'react';

type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children' | 'className'> & {
  to: string;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
  className?: string;
  children?: ReactNode;
};

type NavLinkState = { isActive: boolean; isPending: false };

type NavLinkProps = Omit<LinkProps, 'className' | 'children'> & {
  end?: boolean;
  className?: string | ((state: NavLinkState) => string);
  children?: ReactNode | ((state: NavLinkState) => ReactNode);
};

const normalizePathname = (pathname: string) => {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

export function Link({ to, children, ...props }: LinkProps) {
  return (
    <NextLink href={to} {...props}>
      {children}
    </NextLink>
  );
}

export function NavLink({
  to,
  end = false,
  className,
  children,
  ...props
}: NavLinkProps) {
  const pathname = normalizePathname(usePathname());
  const targetPathname = normalizePathname(to.split(/[?#]/, 1)[0] || '/');
  const isActive =
    targetPathname === '/'
      ? pathname === '/'
      : end
        ? pathname === targetPathname
        : pathname === targetPathname || pathname.startsWith(`${targetPathname}/`);
  const state: NavLinkState = { isActive, isPending: false };

  return (
    <NextLink
      href={to}
      className={typeof className === 'function' ? className(state) : className}
      {...props}
    >
      {typeof children === 'function' ? children(state) : children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();

  return useCallback(
    (to: string | number, options: NavigateOptions = {}) => {
      if (typeof to === 'number') {
        if (to < 0) router.back();
        else if (to > 0) router.forward();
        return;
      }

      if (options.replace) router.replace(to);
      else router.push(to);
    },
    [router]
  );
}

export function useLocation() {
  const pathname = usePathname();

  return {
    pathname,
    search: typeof window === 'undefined' ? '' : window.location.search,
    hash: typeof window === 'undefined' ? '' : window.location.hash,
    state: null,
    key: pathname,
  };
}

export function useParams<T extends Record<string, string | undefined>>() {
  return useNextParams() as T;
}

export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams, options?: NavigateOptions) => void,
] {
  const router = useRouter();
  const pathname = usePathname();
  const nextSearchParams = useNextSearchParams();
  const searchString = nextSearchParams.toString();
  const searchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const setSearchParams = useCallback(
    (next: URLSearchParams, options: NavigateOptions = {}) => {
      const query = next.toString();
      const destination = query ? `${pathname}?${query}` : pathname;
      if (options.replace) router.replace(destination);
      else router.push(destination);
    },
    [pathname, router]
  );

  return [searchParams, setSearchParams];
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [replace, router, to]);

  return null;
}
