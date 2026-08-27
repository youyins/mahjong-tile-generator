"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export type TileType = "wan" | "tong" | "tiao" | "wind" | "dragon"

export interface TileData {
  id: string
  type: TileType
  value: number | string
  label: string
  sortOrder: number
}

// All mahjong tiles data
export const ALL_TILES: TileData[] = [
  // 萬 (Characters) - 1-9
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `wan-${i + 1}`,
    type: "wan" as TileType,
    value: i + 1,
    label: `${i + 1}萬`,
    sortOrder: i + 1,
  })),
  // 筒 (Dots) - 1-9
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `tong-${i + 1}`,
    type: "tong" as TileType,
    value: i + 1,
    label: `${i + 1}筒`,
    sortOrder: 100 + i + 1,
  })),
  // 條 (Bamboo) - 1-9
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `tiao-${i + 1}`,
    type: "tiao" as TileType,
    value: i + 1,
    label: `${i + 1}條`,
    sortOrder: 200 + i + 1,
  })),
  // 風牌 (Winds)
  { id: "dong", type: "wind", value: "東", label: "東", sortOrder: 301 },
  { id: "nan", type: "wind", value: "南", label: "南", sortOrder: 302 },
  { id: "xi", type: "wind", value: "西", label: "西", sortOrder: 303 },
  { id: "bei", type: "wind", value: "北", label: "北", sortOrder: 304 },
  // 三元牌 (Dragons)
  { id: "zhong", type: "dragon", value: "中", label: "中", sortOrder: 305 },
  { id: "fa", type: "dragon", value: "發", label: "發", sortOrder: 306 },
  { id: "bai", type: "dragon", value: "白", label: "白", sortOrder: 307 },
]

// Get image path for a tile
function getTileImagePath(tile: TileData): string {
  if (tile.type === "wan") {
    return `/tiles/${tile.value}wan.png`
  }
  if (tile.type === "tong") {
    return `/tiles/${tile.value}tong.png`
  }
  if (tile.type === "tiao") {
    return `/tiles/${tile.value}tiao.png`
  }
  // Wind and dragon tiles use their id directly
  if (tile.type === "wind" || tile.type === "dragon") {
    return `/tiles/${tile.id}.png`
  }
  return ""
}

// Character mappings for fallback display
const NUMBER_CHARS: Record<number, string> = {
  1: "一",
  2: "二",
  3: "三",
  4: "四",
  5: "五",
  6: "六",
  7: "七",
  8: "八",
  9: "九",
}

interface MahjongTileProps {
  tile: TileData
  onClick?: () => void
  className?: string
  size?: "sm" | "md" | "lg" | "dynamic"
  style?: React.CSSProperties
}

export function MahjongTile({
  tile,
  onClick,
  className,
  size = "md",
  style,
}: MahjongTileProps) {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: "w-10 h-14",
    md: "w-12 h-16",
    lg: "w-14 h-[76px]",
    dynamic: "",
  }

  const imagePath = getTileImagePath(tile)

  // Fallback content when image fails to load
  const renderFallbackContent = () => {
    if (tile.type === "wan") {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <span className="font-bold text-red-600 leading-none text-[0.9em]">
            {NUMBER_CHARS[tile.value as number]}
          </span>
          <span className="font-bold text-red-600 leading-none text-[0.8em]">萬</span>
        </div>
      )
    }

    if (tile.type === "tong") {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <span className="font-bold text-blue-600 leading-none text-[1em]">
            {tile.value}
          </span>
          <span className="font-bold text-blue-600 leading-none text-[0.8em]">筒</span>
        </div>
      )
    }

    if (tile.type === "tiao") {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <span className="font-bold text-emerald-600 leading-none text-[1em]">
            {tile.value}
          </span>
          <span className="font-bold text-emerald-600 leading-none text-[0.8em]">條</span>
        </div>
      )
    }

    if (tile.type === "wind") {
      return (
        <div className="flex items-center justify-center w-full h-full">
          <span className="font-bold text-slate-800 text-[1.2em]">{tile.value}</span>
        </div>
      )
    }

    if (tile.type === "dragon") {
      if (tile.value === "中") {
        return (
          <div className="flex items-center justify-center w-full h-full">
            <span className="font-bold text-red-600 text-[1.2em]">中</span>
          </div>
        )
      }
      if (tile.value === "發") {
        return (
          <div className="flex items-center justify-center w-full h-full">
            <span className="font-bold text-emerald-600 text-[1.2em]">發</span>
          </div>
        )
      }
      if (tile.value === "白") {
        return (
          <div className="flex items-center justify-center w-full h-full">
            <div className="w-[60%] h-[50%] border-2 border-slate-300 rounded-sm" />
          </div>
        )
      }
    }

    return null
  }

  return (
    <button
      onClick={onClick}
      style={style}
      className={cn(
        // Outer tile container - white background, rounded corners, shadow
        "relative bg-white rounded-lg overflow-hidden",
        "border border-[#dde5d7]",
        "shadow-[0_3px_10px_rgba(0,0,0,0.08)]",
        // Hover effect - float up with deeper shadow
        "hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
        "transition-all duration-200 ease-out",
        "cursor-pointer select-none",
        sizeClasses[size],
        className
      )}
    >
      {!imageError ? (
        <img
          src={imagePath}
          alt={tile.label}
          crossOrigin="anonymous"
          onError={() => setImageError(true)}
          draggable={false}
          className="w-full h-full object-contain scale-110"
          style={{ display: "block" }}
        />
      ) : (
        renderFallbackContent()
      )}
    </button>
  )
}
