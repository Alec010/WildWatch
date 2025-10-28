"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const [hasOverflow, setHasOverflow] = React.useState(false);
  const [isLargeScreen, setIsLargeScreen] = React.useState(false);
  const tabsListRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const checkOverflow = () => {
      if (tabsListRef.current) {
        const windowWidth = window.innerWidth;
        const isLarge = windowWidth >= 1280;
        setIsLargeScreen(isLarge);

        // On devices >= 1240px, completely disable scrolling
        if (isLarge) {
          setHasOverflow(false);
          return;
        }

        // Only check for overflow on smaller devices
        const { scrollWidth, clientWidth } = tabsListRef.current;
        const tolerance = 2;
        const contentOverflows = scrollWidth > clientWidth + tolerance;

        // Debug logging (uncomment for debugging)
        // console.log("TabsList overflow check:", {
        //   scrollWidth,
        //   clientWidth,
        //   windowWidth,
        //   contentOverflows,
        //   isLarge,
        //   currentHasOverflow: hasOverflow,
        //   element: tabsListRef.current,
        // });

        setHasOverflow(contentOverflows);
      }
    };

    // Initial check for screen size
    const initialCheck = () => {
      const windowWidth = window.innerWidth;
      const isLarge = windowWidth >= 1280;
      setIsLargeScreen(isLarge);
      if (isLarge) {
        setHasOverflow(false);
      }
    };

    // Use requestAnimationFrame to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      initialCheck();
      checkOverflow();
    }, 0);

    // Also check after a short delay to catch any async rendering
    const delayedCheck = setTimeout(checkOverflow, 100);

    // Use ResizeObserver to detect when the element size changes
    let resizeObserver: ResizeObserver | null = null;
    if (tabsListRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        checkOverflow();
      });
      resizeObserver.observe(tabsListRef.current);
    }

    window.addEventListener("resize", checkOverflow);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(delayedCheck);
      window.removeEventListener("resize", checkOverflow);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [props.children]); // Re-run when children change

  return (
    <TabsPrimitive.List
      ref={tabsListRef}
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 items-center justify-center rounded-lg p-[3px]",
        // On large screens, always use w-fit and never allow scrolling
        isLargeScreen
          ? "w-fit"
          : hasOverflow
          ? "w-full overflow-x-auto scrollbar-hide"
          : "w-fit",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
