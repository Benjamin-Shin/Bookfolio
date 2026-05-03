"use client";

/**
 * 타임라인 목록을 `framer-motion`으로 감싼 레이아웃.
 *
 * @history
 * - 2026-05-03: `motion` 키를 `item.id`로 고정(역순 렌더 시 리스트 안정화)
 */
import React from "react";
import { Timeline, TimelineItem } from "./timeline";
import { motion } from "framer-motion";
import type { TimelineElement } from "@/types";

interface TimelineLayoutProps {
  items: TimelineElement[];
  size?: "sm" | "md" | "lg";
  iconColor?: "primary" | "secondary" | "muted" | "accent";
  customIcon?: React.ReactNode;
  animate?: boolean;
  connectorColor?: "primary" | "secondary" | "muted" | "accent";
  className?: string;
}

export const TimelineLayout = ({
  items,
  size = "md",
  iconColor,
  customIcon,
  animate = true,
  connectorColor,
  className,
}: TimelineLayoutProps) => {
  return (
    <Timeline size={size} className={className}>
      {[...items].reverse().map((item, index) => (
        <motion.div
          key={item.id}
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{
            duration: 0.5,
            delay: index * 0.1,
            ease: "easeOut",
          }}
        >
          <TimelineItem
            date={item.date}
            title={item.title}
            description={item.description}
            icon={
              typeof item.icon === "function"
                ? item.icon()
                : item.icon || customIcon
            }
            iconColor={item.color || iconColor}
            connectorColor={item.color || connectorColor}
            showConnector={index !== items.length - 1}
          />
        </motion.div>
      ))}
    </Timeline>
  );
};
