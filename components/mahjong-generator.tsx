"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { toPng } from "html-to-image"
import { MahjongTile, ALL_TILES, type TileData } from "./mahjong-tile"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Trash2, X, Download } from "lucide-react"

interface SelectedTile extends TileData {
  instanceId: string
}

export function MahjongGenerator() {
  const [selectedTiles, setSelectedTiles] = useState<SelectedTile[]>([])
  const selectedAreaRef = useRef<HTMLDivElement>(null)
  const [tileSize, setTileSize] = useState({ width: 56, height: 76 })
  const [gap, setGap] = useState(8)
  const containerRef = useRef<HTMLDivElement>(null)

  const MAX_TILES = 16

  // Calculate dynamic tile size based on container width and tile count
  const calculateLayout = useCallback(() => {
    if (!containerRef.current) return

    const containerWidth = containerRef.current.offsetWidth
    const tileCount = Math.max(selectedTiles.length, 1)
    
    // Base dimensions (aspect ratio ~1:1.36 for real mahjong tiles)
    const idealWidth = 56
    const minWidth = 40
    const aspectRatio = 1.36

    // Start with maximum gap and padding
    let currentGap = 8
    let padding = 16
    
    // Calculate available width for tiles
    let availableWidth = containerWidth - padding * 2
    let requiredWidth = tileCount * idealWidth + (tileCount - 1) * currentGap

    // If tiles don't fit, reduce gap first
    if (requiredWidth > availableWidth && tileCount > 1) {
      // Try reducing gap
      for (let g = 8; g >= 0; g -= 1) {
        requiredWidth = tileCount * idealWidth + (tileCount - 1) * g
        if (requiredWidth <= availableWidth) {
          currentGap = g
          break
        }
        currentGap = g
      }
    }

    // Recalculate with new gap
    requiredWidth = tileCount * idealWidth + (tileCount - 1) * currentGap
    
    // If still doesn't fit, reduce padding
    if (requiredWidth > availableWidth) {
      for (let p = 16; p >= 4; p -= 2) {
        availableWidth = containerWidth - p * 2
        requiredWidth = tileCount * idealWidth + (tileCount - 1) * currentGap
        if (requiredWidth <= availableWidth) {
          padding = p
          break
        }
        padding = p
      }
    }

    // Recalculate available width with final padding
    availableWidth = containerWidth - padding * 2
    requiredWidth = tileCount * idealWidth + (tileCount - 1) * currentGap

    // If still doesn't fit, reduce tile size
    let finalWidth = idealWidth
    if (requiredWidth > availableWidth && tileCount > 0) {
      finalWidth = Math.max(
        minWidth,
        Math.floor((availableWidth - (tileCount - 1) * currentGap) / tileCount)
      )
    }

    setTileSize({
      width: finalWidth,
      height: Math.round(finalWidth * aspectRatio),
    })
    setGap(currentGap)
  }, [selectedTiles.length])

  useEffect(() => {
    calculateLayout()
    window.addEventListener("resize", calculateLayout)
    return () => window.removeEventListener("resize", calculateLayout)
  }, [calculateLayout])

  const addTile = (tile: TileData) => {
    if (selectedTiles.length >= MAX_TILES) return
    setSelectedTiles((prev) => [
      ...prev,
      { ...tile, instanceId: `${tile.id}-${Date.now()}-${Math.random()}` },
    ])
  }

  const removeTile = (instanceId: string) => {
    setSelectedTiles((prev) => prev.filter((t) => t.instanceId !== instanceId))
  }

  const removeLastTile = () => {
    setSelectedTiles((prev) => prev.slice(0, -1))
  }

  const clearAll = () => {
    setSelectedTiles([])
  }

  const sortTiles = () => {
    setSelectedTiles((prev) => [...prev].sort((a, b) => a.sortOrder - b.sortOrder))
  }

  const downloadPng = async () => {
    if (!selectedAreaRef.current || selectedTiles.length === 0) return

    try {
      const dataUrl = await toPng(selectedAreaRef.current, {
        backgroundColor: "transparent",
        pixelRatio: 2,
      })

      const link = document.createElement("a")
      link.download = `mahjong-tiles-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Failed to download PNG:", error)
    }
  }

  // Group tiles by type for display
  const wanTiles = ALL_TILES.filter((t) => t.type === "wan")
  const tongTiles = ALL_TILES.filter((t) => t.type === "tong")
  const tiaoTiles = ALL_TILES.filter((t) => t.type === "tiao")
  const honorTiles = ALL_TILES.filter((t) => t.type === "wind" || t.type === "dragon")

  return (
    <div className="min-h-screen bg-[#e8f0e8] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-700 tracking-tight">
            麻將牌型產生器
          </h1>
          <p className="text-slate-500 text-sm">
            點擊下方麻將牌加入牌型，最多 16 張
          </p>
        </div>

        {/* Selected Tiles Area */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-emerald-200/50 p-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={sortTiles}
              disabled={selectedTiles.length === 0}
              className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowUpDown className="w-4 h-4" />
              排序
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={removeLastTile}
              disabled={selectedTiles.length === 0}
              className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <X className="w-4 h-4" />
              刪除最後一張
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={selectedTiles.length === 0}
              className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              清空
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={downloadPng}
              disabled={selectedTiles.length === 0}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="w-4 h-4" />
              下載 PNG
            </Button>
          </div>

          {/* Selected Tiles Display */}
          <div
            ref={containerRef}
            className="bg-emerald-50/80 rounded-xl min-h-[100px] flex items-center justify-center border border-emerald-200/50"
          >
            {selectedTiles.length === 0 ? (
              <p className="text-emerald-600/60 text-sm py-8">點擊下方麻將牌開始建立牌型</p>
            ) : (
              <div
                ref={selectedAreaRef}
                className="flex items-end justify-center py-4 px-2"
                style={{ gap: `${gap}px` }}
              >
                {selectedTiles.map((tile) => (
                  <MahjongTile
                    key={tile.instanceId}
                    tile={tile}
                    onClick={() => removeTile(tile.instanceId)}
                    size="dynamic"
                    style={{
                      width: tileSize.width,
                      height: tileSize.height,
                      fontSize: `${Math.max(10, tileSize.width * 0.22)}px`,
                    }}
                    className="flex-shrink-0 hover:opacity-80 hover:translate-y-0"
                  />
                ))}
              </div>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-2">
            已選 {selectedTiles.length} / {MAX_TILES} 張（點擊牌可刪除）
          </p>
        </div>

        {/* Tile Selection Area */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-emerald-200/50 p-4 md:p-6 space-y-6">
          {/* 萬 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-red-600 flex items-center gap-2">
              <span className="w-1 h-4 bg-red-500 rounded-full" />
              萬子
            </h3>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {wanTiles.map((tile) => (
                <MahjongTile
                  key={tile.id}
                  tile={tile}
                  onClick={() => addTile(tile)}
                  size="md"
                />
              ))}
            </div>
          </div>

          {/* 筒 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full" />
              筒子
            </h3>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {tongTiles.map((tile) => (
                <MahjongTile
                  key={tile.id}
                  tile={tile}
                  onClick={() => addTile(tile)}
                  size="md"
                />
              ))}
            </div>
          </div>

          {/* 條 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-emerald-600 flex items-center gap-2">
              <span className="w-1 h-4 bg-emerald-500 rounded-full" />
              條子
            </h3>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {tiaoTiles.map((tile) => (
                <MahjongTile
                  key={tile.id}
                  tile={tile}
                  onClick={() => addTile(tile)}
                  size="md"
                />
              ))}
            </div>
          </div>

          {/* 字牌 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <span className="w-1 h-4 bg-slate-500 rounded-full" />
              字牌
            </h3>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {honorTiles.map((tile) => (
                <MahjongTile
                  key={tile.id}
                  tile={tile}
                  onClick={() => addTile(tile)}
                  size="md"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          麻將牌型產生器
        </p>
      </div>
    </div>
  )
}
