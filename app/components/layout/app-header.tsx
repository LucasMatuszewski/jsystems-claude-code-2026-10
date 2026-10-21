import Image from "next/image";
import type { ReactNode } from "react";
import { texts } from "@/lib/case/texts";

type AppHeaderProps = { actions?: ReactNode };

export function AppHeader({ actions }: AppHeaderProps): React.JSX.Element {
  return (
    <header className="flex h-[72px] w-full items-center justify-between gap-3 bg-background px-4 [box-shadow:var(--header-shadow)] lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Image
          alt={texts.app.logoAlt}
          className="h-8 w-auto shrink-0 sm:h-10"
          height={38}
          src="/logo.svg"
          unoptimized
          width={218}
        />
        <h1 className="min-w-0 text-[16px] leading-[22px] font-semibold text-foreground sm:text-[20px]">
          {texts.app.productName}
        </h1>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
