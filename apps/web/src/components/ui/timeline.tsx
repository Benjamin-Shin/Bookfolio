"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, HTMLMotionProps } from "framer-motion";
import { AlertCircle, Loader2 } from "lucide-react";
import type { TimelineColor } from "@/types";

const timelineVariants = cva("flex flex-col relative", {
  variants: {
    size: {
      sm: "gap-4",
      md: "gap-6",
      lg: "gap-8",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

/**
 * Timeline component props interface
 * @interface TimelineProps
 * @extends {React.HTMLAttributes<HTMLOListElement>}
 * @extends {VariantProps<typeof timelineVariants>}
 */
interface TimelineProps
  extends React.HTMLAttributes<HTMLOListElement>,
    VariantProps<typeof timelineVariants> {
  /** Size of the timeline icons */
  iconsize?: "sm" | "md" | "lg";
}

/**
 * Timeline component for displaying a vertical list of events or items
 * @component
 */
const Timeline = React.forwardRef<HTMLOListElement, TimelineProps>(
  ({ className, iconsize, size, children, ...props }, ref) => {
    const items = React.Children.toArray(children);

    if (items.length === 0) {
      return <TimelineEmpty />;
    }

    return (
      <ol
        ref={ref}
        aria-label="Timeline"
        className={cn(
          timelineVariants({ size }),
          "relative w-full max-w-2xl mx-auto pt-8 pb-4",
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (
            React.isValidElement(child) &&
            typeof child.type !== "string" &&
            "displayName" in child.type &&
            child.type.displayName === "TimelineItem"
          ) {
            return React.cloneElement(child, {
              iconsize,
              showConnector: index !== items.length - 1,
            } as React.ComponentProps<typeof TimelineItem>);
          }
          return child;
        })}
      </ol>
    );
  }
);
Timeline.displayName = "Timeline";

/**
 * TimelineItem component props interface
 * @interface TimelineItemProps
 * @extends {Omit<HTMLMotionProps<"li">, "ref">}
 */
interface TimelineItemProps extends Omit<HTMLMotionProps<"li">, "ref"> {
  /** Date string for the timeline item */
  date?: string;
  /** Title of the timeline item */
  title?: string;
  /** Description text */
  description?: string;
  /** Custom icon element */
  icon?: React.ReactNode;
  /** Color theme for the icon */
  iconColor?: TimelineColor;
  /** Current status of the item */
  status?: "completed" | "in-progress" | "pending";
  /** Color theme for the connector line */
  connectorColor?: TimelineColor;
  /** Whether to show the connector line */
  showConnector?: boolean;
  /** Size of the icon */
  iconsize?: "sm" | "md" | "lg";
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** true면 콘텐츠(제목·설명)를 좌측 시간 밑에 표시, 우측은 비워둠 */
  contentBelowDate?: boolean;
  /** 우측 컬럼 제목 (타임라인 시간선 기준 우측 = 펌프 이력 등) */
  rightTitle?: string;
  /** 우측 컬럼 설명 */
  rightDescription?: string;
  /** 우측 컬럼용 아이콘 (우측만 있을 때 사용) */
  rightIcon?: React.ReactNode;
  /** 우측 컬럼용 아이콘 색상 */
  rightIconColor?: TimelineColor;
  /** 우측 컬럼 시간 (좌측 date와 동일 스타일·크기로 표시) */
  rightDate?: string;
}

const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
  (
    {
      className,
      date,
      title,
      description,
      icon,
      iconColor,
      status = "completed",
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      connectorColor,
      showConnector = true,
      iconsize,
      loading,
      error,
      contentBelowDate = false,
      rightTitle,
      rightDescription,
      rightIcon,
      rightIconColor,
      rightDate,
      // Omit unused Framer Motion props
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      initial,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      animate,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      transition,
      ...props
    },
    ref
  ) => {
    const commonClassName = cn("relative w-full mb-8 last:mb-0", className);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [connectorHeight, setConnectorHeight] = React.useState<number | undefined>(undefined);

    // description 높이에 따라 연결선 높이 계산
    React.useEffect(() => {
      if (!showConnector || !contentRef.current) return;

      const updateConnectorHeight = () => {
        const contentElement = contentRef.current;
        if (!contentElement) return;

        // content 영역의 높이 측정
        const contentHeight = contentElement.offsetHeight;
        // 아이콘 아래부터 content 끝까지의 거리 + 다음 항목까지의 여백(mb-8 = 2rem = 32px)
        // mt-2 (아이콘과 연결선 사이 간격) = 0.5rem = 8px
        const height = contentHeight + 32; // mb-8 (2rem) 추가
        setConnectorHeight(Math.max(height, 64)); // 최소 4rem (64px)
      };

      // 초기 측정
      updateConnectorHeight();

      // ResizeObserver로 동적 높이 변경 감지
      const resizeObserver = new ResizeObserver(updateConnectorHeight);
      resizeObserver.observe(contentRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }, [showConnector, description, title]);

    // Loading State
    if (loading) {
      return (
        <motion.li
          ref={ref}
          className={commonClassName}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="status"
          {...props}
        >
          <div className="grid grid-cols-[minmax(auto,8rem)_auto_1fr] items-start px-4">
            <div className="pr-4 text-right">
              <div className="h-4 w-24 animate-pulse rounded bg-muted dark:bg-gray-700" />
            </div>

            <div className="mx-3 flex flex-col items-center justify-start gap-y-2">
              <div className="relative flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-muted dark:bg-gray-700 ring-8 ring-background dark:ring-gray-800">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground dark:text-gray-400" />
              </div>
              {showConnector && (
                <div className="h-full w-0.5 animate-pulse bg-muted dark:bg-gray-600" />
              )}
            </div>

            <div className="flex flex-col gap-2 pl-2">
              <div className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted dark:bg-gray-700" />
                <div className="h-3 w-48 animate-pulse rounded bg-muted dark:bg-gray-700" />
              </div>
            </div>
          </div>
        </motion.li>
      );
    }

    // Error State
    if (error) {
      return (
        <motion.li
          ref={ref}
          className={cn(
            commonClassName,
            "border border-destructive/50 dark:border-destructive/60 bg-destructive/10 dark:bg-destructive/20"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="alert"
          {...props}
        >
          <div className="grid grid-cols-[minmax(auto,8rem)_auto_1fr] items-start px-4">
            <div className="pr-4 text-right">
              <TimelineTime className="text-destructive dark:text-red-400">{date}</TimelineTime>
            </div>

            <div className="mx-3 flex flex-col items-center justify-start gap-y-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20 dark:bg-destructive/30 ring-8 ring-background dark:ring-gray-800">
                <AlertCircle className="h-4 w-4 text-destructive dark:text-red-400" />
              </div>
              {showConnector && (
                <TimelineConnector status="pending" className="h-full" />
              )}
            </div>

            <div className="flex flex-col gap-2 pl-2">
              <TimelineHeader>
                <TimelineTitle className="text-destructive dark:text-red-400">
                  {title || "Error"}
                </TimelineTitle>
              </TimelineHeader>
              <TimelineDescription className="text-destructive dark:text-red-400">
                {error}
              </TimelineDescription>
            </div>
          </div>
        </motion.li>
      );
    }

    const content = (
      <div
        ref={contentRef}
        className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start relative"
        {...(status === "in-progress" ? { "aria-current": "step" } : {})}
      >
        {/* Date (contentBelowDate 시 시간 밑에 제목·설명) */}
        <div className={cn("flex flex-col justify-start pt-1", contentBelowDate && "gap-2")}>
          <TimelineTime className="text-right pr-4">{date}</TimelineTime>
          {contentBelowDate && (
            <TimelineContent className="text-left pl-0 pr-4">
              <TimelineHeader>
                <TimelineTitle>{title}</TimelineTitle>
              </TimelineHeader>
              <TimelineDescription>{description}</TimelineDescription>
            </TimelineContent>
          )}
        </div>

        {/* Timeline dot and connector (좌측만 있으면 icon, 우측만 있으면 rightIcon 사용) */}
        <div className="flex flex-col items-center relative">
          <div className="relative z-10">
            <TimelineIcon
              icon={((title != null && title !== "") || (description != null && description !== "")) ? icon : (rightTitle != null || rightDescription != null || rightDate != null) ? rightIcon : icon}
              color={((title != null && title !== "") || (description != null && description !== "")) ? iconColor : (rightTitle != null || rightDescription != null || rightDate != null) ? rightIconColor : iconColor}
              status={status}
              iconSize={iconsize}
            />
          </div>
          {showConnector && (
            <div
              className={cn(
                "absolute top-full left-1/2 -translate-x-1/2 w-0.5 mt-2 z-0",
                "bg-black dark:bg-white"
              )}
              style={{
                height: connectorHeight ? `${connectorHeight}px` : "calc(100% + 2rem)",
                minHeight: "4rem"
              }}
            />
          )}
        </div>

        {/* Content: contentBelowDate면 좌측에 이미 표시됨. 우측은 rightTitle/rightDescription 또는 비움 */}
        {!contentBelowDate ? (
          <TimelineContent>
            <TimelineHeader>
              <TimelineTitle>{title}</TimelineTitle>
            </TimelineHeader>
            <TimelineDescription>{description}</TimelineDescription>
          </TimelineContent>
        ) : (rightTitle != null || rightDescription != null || rightDate != null) ? (
          <TimelineContent>
            {rightDate != null && rightDate !== "" && (
              <TimelineTime className="text-left pl-0 pb-1 text-sm font-medium text-muted-foreground dark:text-gray-400">
                {rightDate}
              </TimelineTime>
            )}
            <TimelineHeader>
              <TimelineTitle>{rightTitle ?? ""}</TimelineTitle>
            </TimelineHeader>
            <TimelineDescription>{rightDescription ?? ""}</TimelineDescription>
          </TimelineContent>
        ) : (
          <div className="flex flex-col gap-2 pl-2" />
        )}
      </div>
    );

    // Filter out Framer Motion specific props
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      style,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onDrag,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onDragStart,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onDragEnd,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onAnimationStart,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onAnimationComplete,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      transformTemplate,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      whileHover,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      whileTap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      whileDrag,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      whileFocus,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      whileInView,
      ...filteredProps
    } = props;

    return (
      <li ref={ref} className={commonClassName} {...filteredProps}>
        {content}
      </li>
    );
  }
);
TimelineItem.displayName = "TimelineItem";

interface TimelineTimeProps extends React.HTMLAttributes<HTMLTimeElement> {
  /** Date string, Date object, or timestamp */
  date?: string | Date | number;
  /** Optional format for displaying the date */
  format?: Intl.DateTimeFormatOptions;
}

const defaultDateFormat: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "2-digit",
};

const TimelineTime = React.forwardRef<HTMLTimeElement, TimelineTimeProps>(
  ({ className, date, format, children, ...props }, ref) => {
    const formattedDate = React.useMemo(() => {
      if (!date) return "";

      try {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return "";

        return new Intl.DateTimeFormat("en-US", {
          ...defaultDateFormat,
          ...format,
        }).format(dateObj);
      } catch (error) {
        console.error("Error formatting date:", error);
        return "";
      }
    }, [date, format]);

    return (
      <time
        ref={ref}
        dateTime={date ? new Date(date).toISOString() : undefined}
        className={cn(
          "text-sm font-medium tracking-tight text-muted-foreground dark:text-gray-400",
          className
        )}
        {...props}
      >
        {children || formattedDate}
      </time>
    );
  }
);
TimelineTime.displayName = "TimelineTime";

const TimelineConnector = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    status?: "completed" | "in-progress" | "pending";
    color?: "primary" | "secondary" | "muted" | "accent";
  }
>(({ className, status = "completed", color, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-0.5",
      {
        "bg-primary dark:bg-primary/80": color === "primary" || (!color && status === "completed"),
        "bg-muted dark:bg-gray-600": color === "muted" || (!color && status === "pending"),
        "bg-secondary dark:bg-secondary/80": color === "secondary",
        "bg-accent dark:bg-accent/80": color === "accent",
        "bg-gradient-to-b from-primary to-muted dark:from-primary/80 dark:to-gray-600":
          !color && status === "in-progress",
      },
      className
    )}
    {...props}
  />
));
TimelineConnector.displayName = "TimelineConnector";

const TimelineHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-4", className)}
    {...props}
  />
));
TimelineHeader.displayName = "TimelineHeader";

const TimelineTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base font-semibold leading-none tracking-tight text-secondary-foreground dark:text-gray-100",
      className
    )}
    {...props}
  >
    {children}
  </h3>
));
TimelineTitle.displayName = "TimelineTitle";

const TimelineIcon = ({
  icon,
  color,
  status = "completed",
  iconSize = "md",
}: {
  icon?: React.ReactNode;
  color?: "primary" | "secondary" | "muted" | "accent" | "destructive" | "warning" | "amber" | "orange";
  status?: "completed" | "in-progress" | "pending" | "error";
  iconSize?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const colorClasses = {
    primary: "bg-blue-600 text-white dark:bg-blue-600 dark:text-white border-2 border-blue-600 dark:border-blue-600",
    secondary: "bg-gray-600 text-white dark:bg-gray-400 dark:text-white border-2 border-gray-600 dark:border-gray-400",
    muted: "bg-gray-400 text-white dark:bg-gray-600 dark:text-white border-2 border-gray-400 dark:border-gray-600",
    accent: "bg-purple-600 text-white dark:bg-purple-600 dark:text-white border-2 border-purple-600 dark:border-purple-600",
    destructive: "bg-red-600 text-white dark:bg-red-600 dark:text-white border-2 border-red-600 dark:border-red-600",
    warning: "bg-yellow-500 text-white dark:bg-yellow-500 dark:text-white border-2 border-yellow-500 dark:border-yellow-500",
    amber: "bg-amber-600 text-white dark:bg-amber-400 dark:text-white border-2 border-amber-600 dark:border-amber-400",
    orange: "bg-orange-600 text-white dark:bg-orange-500 dark:text-white border-2 border-orange-600 dark:border-orange-500",
  };

  // status에 따라 기본 색상 결정 (color가 명시되지 않은 경우)
  const resolvedColor =
    color ||
    (status === "completed"
      ? "primary"
      : status === "in-progress"
      ? "accent"
      : status === "pending"
      ? "muted"
      : status === "error"
      ? "destructive"
      : "primary");

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full ring-8 ring-background dark:ring-gray-800 shadow-sm",
        sizeClasses[iconSize],
        colorClasses[resolvedColor],
        // status에 따른 추가 스타일
        status === "in-progress" && "animate-pulse",
        status === "pending" && "opacity-75"
      )}
    >
      {icon ? (
        <div
          className={cn(
            "flex items-center justify-center text-white dark:text-white",
            iconSizeClasses[iconSize]
          )}
        >
          {icon}
        </div>
      ) : (
        <div
          className={cn(
            "rounded-full bg-current opacity-50",
            iconSizeClasses[iconSize]
          )}
        />
      )}
    </div>
  );
};

const TimelineDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "max-w-sm text-sm sm:text-base text-muted-foreground dark:text-gray-400 whitespace-pre-line leading-relaxed",
      className
    )}
    {...props}
  />
));
TimelineDescription.displayName = "TimelineDescription";

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-2 pl-2", className)}
    {...props}
  />
));
TimelineContent.displayName = "TimelineContent";

const TimelineEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col items-center justify-center p-8 text-center",
      className
    )}
    {...props}
  >
    <p className="text-sm text-muted-foreground dark:text-gray-400">
      {children || "No timeline items to display"}
    </p>
  </div>
));
TimelineEmpty.displayName = "TimelineEmpty";

export {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineHeader,
  TimelineTitle,
  TimelineIcon,
  TimelineDescription,
  TimelineContent,
  TimelineTime,
  TimelineEmpty,
};
