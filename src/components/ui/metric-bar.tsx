"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MetricBarProps {
  label: string;
  value: string;
  percent: number;
  color?: "blue" | "purple" | "orange" | "green" | "red";
  className?: string;
}

const colorMap = {
  blue: {
    dot: "bg-viz-blue",
    fill: "bg-viz-blue",
    text: "text-viz-blue",
  },
  purple: {
    dot: "bg-viz-purple",
    fill: "bg-viz-purple",
    text: "text-viz-purple",
  },
  orange: {
    dot: "bg-viz-orange",
    fill: "bg-viz-orange",
    text: "text-viz-orange",
  },
  green: {
    dot: "bg-viz-green",
    fill: "bg-viz-green",
    text: "text-viz-green",
  },
  red: {
    dot: "bg-viz-red",
    fill: "bg-viz-red",
    text: "text-viz-red",
  },
};

export function MetricBar({
  label,
  value,
  percent,
  color = "blue",
  className,
}: MetricBarProps) {
  const colors = colorMap[color];

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", colors.dot)} />
      <span className="text-[0.58rem] text-muted-foreground w-11 flex-shrink-0">
        {label}
      </span>
      <div className="metric-bar">
        <div
          className={cn("metric-fill", colors.fill)}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <span className={cn("text-[0.6rem] font-bold min-w-10 text-right", colors.text)}>
        {value}
      </span>
    </div>
  );
}
