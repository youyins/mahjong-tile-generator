"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { toPng } from "html-to-image"
import { MahjongTile, ALL_TILES, type TileData } from "./mahjong-tile"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Trash2, X, Download } from "lucide-react"

interface SelectedTile extends TileData {
  instanceId: string
}

type TileCountMode = "13" | "16" | "meld"

const SELF_DRAW_GAP = 18
const MELD_GROUP_GAP = 18

export function MahjongGenerator() {
  const [selectedTiles, setSelectedTiles] = useState<SelectedTile[]>([])
  const selectedAreaRef = useRef<HTMLDivElement>(null)
  const [tileSize, setTileSize] = useState({ width: 56, height: 76 })
  const [gap, setGap] = useState(8)
  const [tileCountMode, setTileCountMode] = useState<TileCountMode>("16")
  const containerRef = useRef<HTMLDivElement>(null)

  const maxTiles = tileCountMode === "13" ? 14 : tileCountMode === "meld" ? 15 : 17
  const isSelfDrawMode = tileCountMode !== "meld"
  const isFullSelfDraw = isSelfDrawMode && selectedTiles.length === maxTiles

  // Calculate dynamic tile size based on container width and tile count
  const calculateLayout = useCallback(() => {
    if (!containerRef.current) return

    const containerWidth = containerRef.current.offsetWidth
    const tileCount = Math.max(selectedTiles.length, 1)
    const selfDrawGap = isFullSelfDraw ? SELF_DRAW_GAP : 0
    const meldGroupCount = tileCountMode === "meld" ? Math.max(0, Math.ceil(tileCount / 3) - 1) : 0
    const groupGap = meldGroupCount * MELD_GROUP_GAP
    
    // Base dimensions (aspect ratio ~1:1.36 for real mahjong tiles)
    const idealWidth = 56
    const minWidth = 40
    const aspectRatio = 1.36

    // Keep the existing compact arrangement as the only layout.
    const currentGap = 1
    let padding = 16
    
    // Calculate available width for tiles
    let availableWidth = containerWidth - padding * 2
    let requiredWidth = tileCount * idealWidth + (tileCount - 1) * currentGap + selfDrawGap + groupGap + selfDrawGap + groupGap
    
    // If still doesn't fit, reduce padding
    if (requiredWidth > availableWidth) {
      for (let p = 16; p >= 4; p -= 2) {
        availableWidth = containerWidth - p * 2
        requiredWidth = tileCount * idealWidth + (tileCount - 1) * currentGap + selfDrawGap + groupGap
        if (requiredWidth <= availableWidth) {
          padding = p
          break
        }
        padding = p
      }
    }

    // Recalculate available width with final padding
    availableWidth = containerWidth - padding * 2
    requiredWidth = tileCount * idealWidth + (tileCount - 1) * currentGap + selfDrawGap + groupGap

    // If still doesn't fit, reduce tile size
    let finalWidth = idealWidth
    if (requiredWidth > availableWidth && tileCount > 0) {
      finalWidth = Math.max(
        minWidth,
        Math.floor((availableWidth - (tileCount - 1) * currentGap - selfDrawGap - groupGap) / tileCount)
      )
    }

    setTileSize({
      width: finalWidth,
      height: Math.round(finalWidth * aspectRatio),
    })
    setGap(currentGap)
  }, [selectedTiles.length, tileCountMode, maxTiles, isFullSelfDraw])

  useEffect(() => {
    calculateLayout()
    window.addEventListener("resize", calculateLayout)
    return () => window.removeEventListener("resize", calculateLayout)
  }, [calculateLayout])

  const addTile = (tile: TileData) => {
    setSelectedTiles((prev) => {
      if (prev.length >= maxTiles) return prev
      return [
        ...prev,
        { ...tile, instanceId: `${tile.id}-${Date.now()}-${Math.random()}` },
      ]
    })
  }

  const changeTileCountMode = (mode: TileCountMode) => {
    const nextMaxTiles = mode === "13" ? 14 : mode === "meld" ? 15 : 17
    setTileCountMode(mode)
    setSelectedTiles((prev) => prev.slice(0, nextMaxTiles))
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
    setSelectedTiles((prev) => {
      const hasSelfDraw = isSelfDrawMode && prev.length === maxTiles
      const handTiles = hasSelfDraw ? prev.slice(0, -1) : prev
      const selfDrawTile = hasSelfDraw ? prev[prev.length - 1] : undefined
      const sortedHand = [...handTiles].sort((a, b) => a.sortOrder - b.sortOrder)
      return selfDrawTile ? [...sortedHand, selfDrawTile] : sortedHand
    })
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
    <div className="min-h-screen bg-[#f5f5f2] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#181a17] tracking-tight">
            麻將牌牌站
          </h1>
          <p className="text-[#737373] text-sm">
            點擊下方麻將牌加入牌型，最多 {maxTiles} 張
          </p>
        </div>

        {/* Selected Tiles Area */}
        <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#dde5d7] p-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={sortTiles}
              disabled={selectedTiles.length === 0}
              className="gap-1.5 border-[#dde5d7] text-[#181a17] hover:bg-[#f4faed]"
            >
              <ArrowUpDown className="w-4 h-4" />
              排序
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={removeLastTile}
              disabled={selectedTiles.length === 0}
              className="gap-1.5 border-[#dde5d7] text-[#181a17] hover:bg-[#f4faed]"
            >
              <X className="w-4 h-4" />
              刪除最後一張
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={selectedTiles.length === 0}
              className="gap-1.5 border-[#dde5d7] text-[#181a17] hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              清空
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={downloadPng}
              disabled={selectedTiles.length === 0}
              className="gap-1.5 bg-[#181a17] hover:bg-[#30352d] text-white border border-[#181a17] hover:-translate-y-px transition-transform"
            >
              <Download className="w-4 h-4" />
              下載 PNG
            </Button>
          </div>

          {/* Mahjong Count Mode Toggle */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#737373]">麻將模式：</span>
              <div className="inline-flex rounded-xl border border-[#dde5d7] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => changeTileCountMode("16")}
                  aria-pressed={tileCountMode === "16"}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    tileCountMode === "16"
                      ? "bg-[#b7e84b] text-[#181a17] shadow-none font-bold"
                      : "text-[#737373] hover:text-[#181a17]"
                  }`}
                >
                  16麻
                </button>
                <button
                  type="button"
                  onClick={() => changeTileCountMode("13")}
                  aria-pressed={tileCountMode === "13"}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    tileCountMode === "13"
                      ? "bg-[#b7e84b] text-[#181a17] shadow-none font-bold"
                      : "text-[#737373] hover:text-[#181a17]"
                  }`}
                >
                  13麻
                </button>
                <button
                  type="button"
                  onClick={() => changeTileCountMode("meld")}
                  aria-pressed={tileCountMode === "meld"}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    tileCountMode === "meld"
                      ? "bg-[#b7e84b] text-[#181a17] shadow-none font-bold"
                      : "text-[#737373] hover:text-[#181a17]"
                  }`}
                >
                  吃碰模式
                </button>
              </div>
            </div>

          </div>

          {/* Selected Tiles Display */}
          <div
            ref={containerRef}
            className="bg-[#f8faf5] rounded-xl min-h-[100px] flex items-center justify-center border border-[#dde5d7]"
          >
            {selectedTiles.length === 0 ? (
              <p className="text-[#737373] text-sm py-8">點擊下方麻將牌開始建立牌型</p>
            ) : (
              <div
                ref={selectedAreaRef}
                className="flex items-end justify-center py-4 px-2"
                style={{ gap: `${gap}px` }}
              >
                {selectedTiles.map((tile, index) => (
                  <MahjongTile
                    key={tile.instanceId}
                    tile={tile}
                    onClick={() => removeTile(tile.instanceId)}
                    size="dynamic"
                    style={{
                      width: tileSize.width,
                      height: tileSize.height,
                      fontSize: `${Math.max(10, tileSize.width * 0.22)}px`,
                      marginLeft:
                        tileCountMode === "meld"
                          ? index > 0 && index % 3 === 0
                            ? MELD_GROUP_GAP
                            : 0
                          : index === selectedTiles.length - 1 && isFullSelfDraw
                            ? SELF_DRAW_GAP
                            : 0,
                    }}
                    className="flex-shrink-0 hover:opacity-80 hover:translate-y-0"
                  />
                ))}
              </div>
            )}
          </div>

          <p className="text-center text-xs text-[#737373] mt-2">
            已選 {selectedTiles.length} / {maxTiles} 張（點擊牌可刪除）
          </p>
        </div>

        {/* Tile Selection Area */}
        <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#dde5d7] p-4 md:p-6 space-y-6">
          {/* 萬 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[#181a17] font-semibold flex items-center gap-2">
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
            <h3 className="text-sm font-medium text-[#181a17] font-semibold flex items-center gap-2">
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
            <h3 className="text-sm font-medium text-[#181a17] font-semibold flex items-center gap-2">
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
            <h3 className="text-sm font-medium text-[#181a17] font-semibold flex items-center gap-2">
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
        <p className="text-center text-xs text-[#737373]">
          麻將牌牌站
        </p>
      </div>
    </div>
  )
}
