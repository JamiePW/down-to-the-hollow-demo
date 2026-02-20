'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Sword, 
  Heart, 
  Coins, 
  Zap, 
  Shield, 
  Skull, 
  Star, 
  Package, 
  Store, 
  Bed, 
  AlertTriangle,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react'

// ==================== 类型定义 ====================

type GridType = 
  | 'start' 
  | 'battle' 
  | 'elite' 
  | 'boss' 
  | 'resource' 
  | 'event' 
  | 'rest' 
  | 'shop' 
  | 'mystery' 
  | 'trap' 
  | 'empty'
  | 'locked'

type GamePhase = 'exploration' | 'battle' | 'shop' | 'rest' | 'event' | 'victory' | 'gameover'

interface Position {
  x: number
  y: number
}

interface GridCell {
  type: GridType
  revealed: boolean
  cleared: boolean
  position: Position
}

interface Emblem {
  id: string
  name: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  effect: {
    type: 'attack' | 'defense' | 'heal' | 'pressure' | 'coins' | 'crit' | 'special'
    value: number
  }
  icon: React.ReactNode
}

interface Erosion {
  id: string
  name: string
  description: string
  effect: {
    type: 'damage' | 'defense' | 'attack' | 'heal'
    value: number
  }
}

interface Player {
  hp: number
  maxHp: number
  attack: number
  defense: number
  coins: number
  pressure: number
  maxPressure: number
  position: Position
  emblems: Emblem[]
  erosions: Erosion[]
  critChance: number
}

interface Enemy {
  name: string
  hp: number
  maxHp: number
  attack: number
  defense: number
  isBoss: boolean
  reward: {
    coins: number
    emblem?: Emblem
  }
}

// ==================== 常量数据 ====================

const GRID_SIZE = 7

const GRID_TYPE_CONFIG: Record<GridType, { name: string; color: string; icon: React.ReactNode; description: string }> = {
  start: { name: '起点', color: 'bg-emerald-500', icon: <Sparkles className="w-5 h-5" />, description: '开始探索' },
  battle: { name: '战斗', color: 'bg-red-500', icon: <Sword className="w-5 h-5" />, description: '遭遇敌人' },
  elite: { name: '精英', color: 'bg-orange-500', icon: <Skull className="w-5 h-5" />, description: '精英敌人' },
  boss: { name: 'BOSS', color: 'bg-purple-600', icon: <AlertTriangle className="w-5 h-5" />, description: '区域Boss' },
  resource: { name: '资源', color: 'bg-yellow-500', icon: <Coins className="w-5 h-5" />, description: '获得资源' },
  event: { name: '事件', color: 'bg-blue-500', icon: <Zap className="w-5 h-5" />, description: '随机事件' },
  rest: { name: '休息', color: 'bg-green-500', icon: <Bed className="w-5 h-5" />, description: '休息恢复' },
  shop: { name: '商店', color: 'bg-cyan-500', icon: <Store className="w-5 h-5" />, description: '购买装备' },
  mystery: { name: '神秘', color: 'bg-violet-500', icon: <Star className="w-5 h-5" />, description: '未知事件' },
  trap: { name: '陷阱', color: 'bg-gray-600', icon: <AlertTriangle className="w-5 h-5" />, description: '触发陷阱' },
  empty: { name: '空地', color: 'bg-gray-400', icon: <Package className="w-5 h-5" />, description: '空无一物' },
  locked: { name: '锁定', color: 'bg-gray-700', icon: <Shield className="w-5 h-5" />, description: '需要钥匙' }
}

const EMBLEMS_POOL: Emblem[] = [
  { id: 'e1', name: '攻击徽章', description: '攻击力+3', rarity: 'common', effect: { type: 'attack', value: 3 }, icon: <Sword className="w-4 h-4" /> },
  { id: 'e2', name: '防御徽章', description: '防御力+2', rarity: 'common', effect: { type: 'defense', value: 2 }, icon: <Shield className="w-4 h-4" /> },
  { id: 'e3', name: '生命徽章', description: '最大生命+10', rarity: 'common', effect: { type: 'heal', value: 10 }, icon: <Heart className="w-4 h-4" /> },
  { id: 'e4', name: '压力缓解', description: '压力上限+20', rarity: 'rare', effect: { type: 'pressure', value: 20 }, icon: <Zap className="w-4 h-4" /> },
  { id: 'e5', name: '财富徽章', description: '金币获取+50%', rarity: 'rare', effect: { type: 'coins', value: 50 }, icon: <Coins className="w-4 h-4" /> },
  { id: 'e6', name: '暴击徽章', description: '暴击率+15%', rarity: 'rare', effect: { type: 'crit', value: 15 }, icon: <Star className="w-4 h-4" /> },
  { id: 'e7', name: '狂战徽章', description: '攻击力+8，防御-3', rarity: 'epic', effect: { type: 'attack', value: 8 }, icon: <Skull className="w-4 h-4" /> },
  { id: 'e8', name: '钢铁意志', description: '防御力+10', rarity: 'epic', effect: { type: 'defense', value: 10 }, icon: <Shield className="w-4 h-4" /> },
  { id: 'e9', name: '不死徽章', description: '生命值+30', rarity: 'legendary', effect: { type: 'heal', value: 30 }, icon: <Heart className="w-4 h-4" /> },
  { id: 'e10', name: '致命打击', description: '暴击率+30%', rarity: 'legendary', effect: { type: 'crit', value: 30 }, icon: <TrendingUp className="w-4 h-4" /> },
]

const EROSION_POOL: Erosion[] = [
  { id: 'er1', name: '虚弱', description: '攻击力-2', effect: { type: 'attack', value: -2 } },
  { id: 'er2', name: '脆弱', description: '防御力-2', effect: { type: 'defense', value: -2 } },
  { id: 'er3', name: '流血', description: '每回合损失3点生命', effect: { type: 'damage', value: 3 } },
  { id: 'er4', name: '迟缓', description: '暴击率-10%', effect: { type: 'attack', value: -10 } },
]

const ENEMY_TEMPLATES = [
  { name: '以骸·小兵', hp: 30, attack: 8, defense: 2, isBoss: false, rewardCoins: 15 },
  { name: '以骸·精英', hp: 50, attack: 12, defense: 4, isBoss: false, rewardCoins: 30 },
  { name: '空洞猎手', hp: 45, attack: 15, defense: 3, isBoss: false, rewardCoins: 25 },
  { name: '腐化体', hp: 60, attack: 10, defense: 5, isBoss: false, rewardCoins: 35 },
]

const BOSS_TEMPLATES = [
  { name: '尼尼微', hp: 150, attack: 25, defense: 10, isBoss: true, rewardCoins: 100 },
  { name: '空洞之主', hp: 200, attack: 30, defense: 12, isBoss: true, rewardCoins: 150 },
]

// ==================== 工具函数 ====================

const getRandomEmblem = (rarity?: 'common' | 'rare' | 'epic' | 'legendary'): Emblem => {
  const pool = rarity ? EMBLEMS_POOL.filter(e => e.rarity === rarity) : EMBLEMS_POOL
  return pool[Math.floor(Math.random() * pool.length)]
}

const getRandomErosion = (): Erosion => {
  return EROSION_POOL[Math.floor(Math.random() * EROSION_POOL.length)]
}

const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common': return 'text-gray-400 border-gray-400'
    case 'rare': return 'text-blue-400 border-blue-400'
    case 'epic': return 'text-purple-400 border-purple-400'
    case 'legendary': return 'text-yellow-400 border-yellow-400'
    default: return 'text-gray-400 border-gray-400'
  }
}

// ==================== 主组件 ====================

export default function GridWalkerGame() {
  // 游戏状态
  const [grid, setGrid] = useState<GridCell[][]>([])
  const [player, setPlayer] = useState<Player>({
    hp: 100,
    maxHp: 100,
    attack: 15,
    defense: 5,
    coins: 0,
    pressure: 0,
    maxPressure: 100,
    position: { x: 0, y: 0 },
    emblems: [],
    erosions: [],
    critChance: 5
  })
  const [gamePhase, setGamePhase] = useState<GamePhase>('exploration')
  const [currentFloor, setCurrentFloor] = useState(1)
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [eventMessage, setEventMessage] = useState('')
  const [shopItems, setShopItems] = useState<Emblem[]>([])
  const [selectedCell, setSelectedCell] = useState<Position | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogContent, setDialogContent] = useState<{ title: string; description: string; choices?: { text: string; action: () => void }[] }>({ title: '', description: '' })
  const [isMoving, setIsMoving] = useState(false)

  // 初始化棋盘
  const initializeGrid = useCallback(() => {
    const newGrid: GridCell[][] = []
    
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: GridCell[] = []
      for (let x = 0; x < GRID_SIZE; x++) {
        let type: GridType = 'empty'
        
        // 起点固定在左上角
        if (x === 0 && y === 0) {
          type = 'start'
        }
        // Boss固定在右下角
        else if (x === GRID_SIZE - 1 && y === GRID_SIZE - 1) {
          type = 'boss'
        }
        // 其他格子随机生成
        else {
          const rand = Math.random()
          if (rand < 0.25) type = 'battle'
          else if (rand < 0.35) type = 'resource'
          else if (rand < 0.42) type = 'event'
          else if (rand < 0.48) type = 'rest'
          else if (rand < 0.53) type = 'shop'
          else if (rand < 0.60) type = 'elite'
          else if (rand < 0.68) type = 'mystery'
          else if (rand < 0.75) type = 'trap'
          else type = 'empty'
        }
        
        // 揭示起点及起点相邻的格子（玩家初始位置周围可见）
        const isStart = x === 0 && y === 0
        const isAdjacentToStart = (x === 1 && y === 0) || (x === 0 && y === 1)
        
        row.push({
          type,
          revealed: isStart || isAdjacentToStart,
          cleared: false,
          position: { x, y }
        })
      }
      newGrid.push(row)
    }
    
    setGrid(newGrid)
    setPlayer(prev => ({
      ...prev,
      position: { x: 0, y: 0 },
      hp: prev.maxHp,
      pressure: 0,
      emblems: [],
      erosions: []
    }))
    setCurrentFloor(1)
    setGamePhase('exploration')
    setEventMessage('欢迎来到空洞！点击相邻格子开始探索，目标：击败右下角的BOSS！')
  }, [])

  // 组件加载时初始化
  useEffect(() => {
    initializeGrid()
  }, [initializeGrid])

  // 检查是否可以移动到目标格子
  const canMoveTo = (target: Position): boolean => {
    const dx = Math.abs(target.x - player.position.x)
    const dy = Math.abs(target.y - player.position.y)
    
    // 只能移动到相邻格子（上下左右）
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      if (target.x >= 0 && target.x < GRID_SIZE && target.y >= 0 && target.y < GRID_SIZE) {
        return true
      }
    }
    return false
  }

  // 获取可移动的格子
  const getMovableCells = (): Position[] => {
    const movable: Position[] = []
    const { x, y } = player.position
    
    [[x-1, y], [x+1, y], [x, y-1], [x, y+1]].forEach(([nx, ny]) => {
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        movable.push({ x: nx, y: ny })
      }
    })
    
    return movable
  }

  // 移动到格子
  const moveToCell = (target: Position) => {
    if (!canMoveTo(target) || gamePhase !== 'exploration' || isMoving) return
    
    setIsMoving(true)
    
    // 揭示目标格子及周围的格子
    setGrid(prev => {
      const newGrid = [...prev.map(row => [...row])]
      // 揭示目标格子
      newGrid[target.y][target.x].revealed = true
      // 揭示目标格子周围的格子
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
      dirs.forEach(([dx, dy]) => {
        const nx = target.x + dx
        const ny = target.y + dy
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          newGrid[ny][nx].revealed = true
        }
      })
      return newGrid
    })
    
    // 更新玩家位置
    setPlayer(prev => {
      // 增加压力值
      let newPressure = prev.pressure + 5
      
      // 检查压力过载
      if (newPressure >= prev.maxPressure) {
        const erosion = getRandomErosion()
        newPressure = 0
        
        setTimeout(() => {
          setDialogContent({
            title: '⚠️ 压力过载！',
            description: `你受到了侵蚀症状：${erosion.name} - ${erosion.description}`,
            choices: [{ text: '确认', action: () => setDialogOpen(false) }]
          })
          setDialogOpen(true)
        }, 100)
        
        return {
          ...prev,
          position: target,
          pressure: newPressure,
          erosions: [...prev.erosions, erosion]
        }
      }
      
      return {
        ...prev,
        position: target,
        pressure: newPressure
      }
    })
    
    // 延迟触发格子事件
    setTimeout(() => {
      triggerCellEvent(target)
      setIsMoving(false)
    }, 300)
  }

  // 触发格子事件
  const triggerCellEvent = (position: Position) => {
    const cell = grid[position.y][position.x]
    if (cell.cleared && cell.type !== 'boss') {
      setEventMessage('这里已经清理过了。')
      return
    }
    
    switch (cell.type) {
      case 'battle':
        startBattle(false)
        break
      case 'elite':
        startBattle(true)
        break
      case 'boss':
        startBossBattle()
        break
      case 'resource':
        handleResourceCell()
        break
      case 'event':
        handleEventCell()
        break
      case 'rest':
        handleRestCell()
        break
      case 'shop':
        handleShopCell()
        break
      case 'mystery':
        handleMysteryCell()
        break
      case 'trap':
        handleTrapCell()
        break
      case 'empty':
        setEventMessage('这里空无一物...')
        break
      case 'start':
        setEventMessage('新的探索即将开始！')
        break
    }
    
    // 标记格子已清理
    setGrid(prev => {
      const newGrid = [...prev.map(row => [...row])]
      newGrid[position.y][position.x].cleared = true
      return newGrid
    })
  }

  // ==================== 战斗系统 ====================

  const startBattle = (isElite: boolean) => {
    const templates = isElite 
      ? ENEMY_TEMPLATES.filter(e => e.name.includes('精英') || e.name.includes('猎手'))
      : ENEMY_TEMPLATES.filter(e => !e.name.includes('精英') && !e.name.includes('猎手'))
    
    const template = templates[Math.floor(Math.random() * templates.length)]
    
    const enemy: Enemy = {
      name: template.name,
      hp: template.hp,
      maxHp: template.hp,
      attack: template.attack,
      defense: template.defense,
      isBoss: template.isBoss,
      reward: {
        coins: template.rewardCoins + Math.floor(Math.random() * 20),
        emblem: Math.random() < (isElite ? 0.4 : 0.2) ? getRandomEmblem() : undefined
      }
    }
    
    setCurrentEnemy(enemy)
    setBattleLog([`遭遇了 ${enemy.name}！`])
    setGamePhase('battle')
  }

  const startBossBattle = () => {
    const template = BOSS_TEMPLATES[Math.floor(Math.random() * BOSS_TEMPLATES.length)]
    
    const boss: Enemy = {
      name: template.name,
      hp: template.hp,
      maxHp: template.hp,
      attack: template.attack,
      defense: template.defense,
      isBoss: true,
      reward: {
        coins: template.rewardCoins,
        emblem: getRandomEmblem('legendary')
      }
    }
    
    setCurrentEnemy(boss)
    setBattleLog([`⚠️ BOSS战开始！${boss.name} 出现了！`])
    setGamePhase('battle')
  }

  const calculateDamage = (attacker: { attack: number }, defender: { defense: number }, isCrit: boolean = false): number => {
    const baseDamage = Math.max(1, attacker.attack - defender.defense)
    const damage = isCrit ? Math.floor(baseDamage * 1.5) : baseDamage
    return damage
  }

  const playerAttack = () => {
    if (!currentEnemy) return
    
    // 检查暴击
    const isCrit = Math.random() * 100 < player.critChance
    const damage = calculateDamage(player, currentEnemy, isCrit)
    const newEnemyHp = currentEnemy.hp - damage
    
    const logEntry = isCrit 
      ? `💥 暴击！你对 ${currentEnemy.name} 造成了 ${damage} 点伤害！`
      : `⚔️ 你对 ${currentEnemy.name} 造成了 ${damage} 点伤害`
    
    if (newEnemyHp <= 0) {
      setBattleLog(prev => [...prev, logEntry, `🎉 ${currentEnemy.name} 被击败！`])
      handleBattleVictory()
    } else {
      // 敌人反击
      const enemyDamage = calculateDamage(currentEnemy, player)
      const newPlayerHp = player.hp - enemyDamage
      
      setBattleLog(prev => [...prev, logEntry, `💥 ${currentEnemy.name} 对你造成了 ${enemyDamage} 点伤害`])
      
      setCurrentEnemy(prev => prev ? { ...prev, hp: newEnemyHp } : null)
      setPlayer(prev => ({ ...prev, hp: Math.max(0, newPlayerHp) }))
      
      if (newPlayerHp <= 0) {
        handleBattleDefeat()
      }
    }
  }

  const handleBattleVictory = () => {
    if (!currentEnemy) return
    
    const { coins, emblem } = currentEnemy.reward
    
    setPlayer(prev => ({
      ...prev,
      coins: prev.coins + coins,
      emblems: emblem ? [...prev.emblems, emblem] : prev.emblems
    }))
    
    const rewardText = emblem 
      ? `获得 ${coins} 金币和 ${emblem.name}！`
      : `获得 ${coins} 金币！`
    
    setBattleLog(prev => [...prev, rewardText])
    
    // 如果是Boss，游戏胜利
    if (currentEnemy.isBoss) {
      setTimeout(() => {
        setGamePhase('victory')
      }, 1500)
    } else {
      setTimeout(() => {
        setGamePhase('exploration')
        setCurrentEnemy(null)
      }, 1500)
    }
  }

  const handleBattleDefeat = () => {
    setBattleLog(prev => [...prev, '💀 你被击败了...'])
    setTimeout(() => {
      setGamePhase('gameover')
    }, 1500)
  }

  // ==================== 格子事件处理 ====================

  const handleResourceCell = () => {
    const coins = 20 + Math.floor(Math.random() * 30)
    setPlayer(prev => ({ ...prev, coins: prev.coins + coins }))
    setEventMessage(`发现宝藏！获得 ${coins} 金币`)
  }

  const handleEventCell = () => {
    const eventType = Math.random()
    
    if (eventType < 0.3) {
      // 恢复事件
      const heal = 20 + Math.floor(Math.random() * 20)
      setPlayer(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + heal) }))
      setEventMessage(`发现治疗水晶！恢复 ${heal} 生命值`)
    } else if (eventType < 0.6) {
      // 压力缓解
      const pressureReduce = 20 + Math.floor(Math.random() * 20)
      setPlayer(prev => ({ ...prev, pressure: Math.max(0, prev.pressure - pressureReduce) }))
      setEventMessage(`找到宁静之地！压力减少 ${pressureReduce}`)
    } else {
      // 随机增益
      const emblem = getRandomEmblem('common')
      setPlayer(prev => ({ ...prev, emblems: [...prev.emblems, emblem] }))
      setEventMessage(`幸运！获得了 ${emblem.name}`)
    }
  }

  const handleRestCell = () => {
    const healPercent = 30 + Math.floor(Math.random() * 20)
    const healAmount = Math.floor(player.maxHp * healPercent / 100)
    
    setPlayer(prev => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + healAmount),
      pressure: Math.max(0, prev.pressure - 30)
    }))
    
    setEventMessage(`在休息区恢复！生命+${healAmount}，压力-30`)
    setGamePhase('rest')
    
    // 提供选择
    setTimeout(() => {
      setDialogContent({
        title: '休息区',
        description: `你恢复了 ${healAmount} 生命值，压力减少30。是否继续探索？`,
        choices: [
          { text: '继续探索', action: () => { setGamePhase('exploration'); setDialogOpen(false) } },
          { text: '强化武器 (+5攻击, -20金币)', action: () => {
            if (player.coins >= 20) {
              setPlayer(prev => ({ ...prev, attack: prev.attack + 5, coins: prev.coins - 20 }))
              setEventMessage('武器强化成功！攻击+5')
            } else {
              setEventMessage('金币不足！')
            }
            setGamePhase('exploration')
            setDialogOpen(false)
          }}
        ]
      })
      setDialogOpen(true)
    }, 500)
  }

  const handleShopCell = () => {
    const items: Emblem[] = [
      getRandomEmblem('common'),
      getRandomEmblem('rare'),
      getRandomEmblem(Math.random() < 0.3 ? 'epic' : 'rare')
    ]
    setShopItems(items)
    setGamePhase('shop')
  }

  const handleMysteryCell = () => {
    const outcome = Math.random()
    
    if (outcome < 0.4) {
      // 好事件
      const choices = ['attack', 'defense', 'hp', 'coins'] as const
      const choice = choices[Math.floor(Math.random() * choices.length)]
      
      switch (choice) {
        case 'attack':
          setPlayer(prev => ({ ...prev, attack: prev.attack + 5 }))
          setEventMessage('神秘力量！攻击力+5')
          break
        case 'defense':
          setPlayer(prev => ({ ...prev, defense: prev.defense + 3 }))
          setEventMessage('神秘力量！防御力+3')
          break
        case 'hp':
          setPlayer(prev => ({ ...prev, maxHp: prev.maxHp + 20, hp: prev.hp + 20 }))
          setEventMessage('神秘力量！最大生命+20')
          break
        case 'coins':
          const bonus = 50 + Math.floor(Math.random() * 50)
          setPlayer(prev => ({ ...prev, coins: prev.coins + bonus }))
          setEventMessage(`神秘力量！获得 ${bonus} 金币`)
          break
      }
    } else if (outcome < 0.7) {
      // 鸣徽
      const emblem = getRandomEmblem()
      setPlayer(prev => ({ ...prev, emblems: [...prev.emblems, emblem] }))
      setEventMessage(`发现隐藏宝物！获得 ${emblem.name}`)
    } else {
      // 陷阱
      const damage = 10 + Math.floor(Math.random() * 15)
      setPlayer(prev => ({ 
        ...prev, 
        hp: Math.max(1, prev.hp - damage),
        pressure: prev.pressure + 20
      }))
      setEventMessage(`陷阱触发！受到 ${damage} 伤害，压力+20`)
    }
  }

  const handleTrapCell = () => {
    const trapType = Math.random()
    
    if (trapType < 0.5) {
      const damage = 15 + Math.floor(Math.random() * 10)
      setPlayer(prev => ({ ...prev, hp: Math.max(1, prev.hp - damage) }))
      setEventMessage(`触发陷阱！受到 ${damage} 点伤害`)
    } else {
      setPlayer(prev => ({ 
        ...prev, 
        pressure: Math.min(prev.maxPressure, prev.pressure + 30)
      }))
      setEventMessage('触发压力陷阱！压力+30')
    }
  }

  // ==================== 商店系统 ====================

  const buyEmblem = (emblem: Emblem) => {
    const prices: Record<string, number> = {
      common: 30,
      rare: 60,
      epic: 100,
      legendary: 200
    }
    
    const price = prices[emblem.rarity]
    
    if (player.coins >= price) {
      setPlayer(prev => ({
        ...prev,
        coins: prev.coins - price,
        emblems: [...prev.emblems, emblem]
      }))
      setShopItems(prev => prev.filter(e => e.id !== emblem.id))
      setEventMessage(`购买了 ${emblem.name}！`)
    } else {
      setEventMessage('金币不足！')
    }
  }

  // ==================== 计算玩家属性（含鸣徽和侵蚀效果） ====================

  const getEffectiveStats = () => {
    let attack = player.attack
    let defense = player.defense
    let maxHp = player.maxHp
    let critChance = player.critChance
    let maxPressure = player.maxPressure
    let coinBonus = 0
    
    // 鸣徽效果
    player.emblems.forEach(emblem => {
      switch (emblem.effect.type) {
        case 'attack':
          attack += emblem.effect.value
          break
        case 'defense':
          defense += emblem.effect.value
          break
        case 'heal':
          maxHp += emblem.effect.value
          break
        case 'crit':
          critChance += emblem.effect.value
          break
        case 'pressure':
          maxPressure += emblem.effect.value
          break
        case 'coins':
          coinBonus += emblem.effect.value
          break
      }
    })
    
    // 侵蚀效果
    player.erosions.forEach(erosion => {
      switch (erosion.effect.type) {
        case 'attack':
          attack += erosion.effect.value
          break
        case 'defense':
          defense += erosion.effect.value
          break
      }
    })
    
    return { attack, defense, maxHp, critChance, maxPressure, coinBonus }
  }

  const effectiveStats = getEffectiveStats()

  // ==================== 渲染 ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      {/* 顶部状态栏 */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-700 p-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* 生命和压力 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" />
                <div className="w-32">
                  <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-400 transition-all duration-300" 
                      style={{ width: `${(player.hp / effectiveStats.maxHp) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-300">{player.hp}/{effectiveStats.maxHp}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <div className="w-24">
                  <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-300" 
                      style={{ width: `${(player.pressure / effectiveStats.maxPressure) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-300">{player.pressure}/{effectiveStats.maxPressure}</span>
                </div>
              </div>
            </div>
            
            {/* 属性 */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Sword className="w-4 h-4 text-orange-500" />
                <span>{effectiveStats.attack}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>{effectiveStats.defense}</span>
              </div>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span>{player.coins}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-purple-500" />
                <span>{effectiveStats.critChance}%</span>
              </div>
            </div>
            
            {/* 层数 */}
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              <Clock className="w-4 h-4 mr-1" />
              第 {currentFloor} 层
            </Badge>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-6xl mx-auto p-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 棋盘 */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2 text-white">
                  <Package className="w-5 h-5 text-cyan-500" />
                  空洞探索
                </CardTitle>
                <CardDescription className="text-gray-400">点击相邻格子移动，探索空洞深处</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
                  {grid.map((row, y) =>
                    row.map((cell, x) => {
                      const isPlayer = player.position.x === x && player.position.y === y
                      const isMovable = gamePhase === 'exploration' && canMoveTo({ x, y })
                      const config = GRID_TYPE_CONFIG[cell.type]
                      
                      return (
                        <button
                          key={`${x}-${y}`}
                          onClick={() => moveToCell({ x, y })}
                          disabled={!isMovable}
                          className={`
                            aspect-square rounded-lg flex flex-col items-center justify-center
                            transition-all duration-200 relative overflow-hidden
                            ${cell.revealed ? config.color : 'bg-gray-700'}
                            ${isPlayer ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 z-10' : ''}
                            ${isMovable ? 'hover:scale-105 cursor-pointer ring-2 ring-cyan-400/50 hover:ring-cyan-400' : 'cursor-default'}
                            ${isMovable && !cell.revealed ? 'ring-2 ring-cyan-400/30 bg-gray-600' : ''}
                            ${cell.cleared && cell.type !== 'boss' ? 'opacity-50' : ''}
                            disabled:opacity-60 disabled:cursor-not-allowed
                          `}
                        >
                          {cell.revealed ? (
                            <>
                              <div className={`${isPlayer ? 'text-white' : 'text-white/90'}`}>
                                {config.icon}
                              </div>
                              <span className="text-[10px] mt-0.5 text-white/80 hidden sm:block">{config.name}</span>
                              {isPlayer && (
                                <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                </div>
                              )}
                            </>
                          ) : (
                            <span className={`text-lg ${isMovable ? 'text-cyan-400' : 'text-gray-500'}`}>?</span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
                
                {/* 事件消息 */}
                {eventMessage && (
                  <div className="mt-4 p-3 bg-gray-700/50 rounded-lg text-center text-cyan-300 animate-pulse">
                    {eventMessage}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-4">
            {/* 鸣徽 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Star className="w-5 h-5 text-yellow-500" />
                  鸣徽 ({player.emblems.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {player.emblems.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-2">暂无鸣徽</p>
                  ) : (
                    player.emblems.map((emblem, index) => (
                      <div key={`${emblem.id}-${index}`} className={`p-2 rounded border ${getRarityColor(emblem.rarity)} bg-gray-700/30`}>
                        <div className="flex items-center gap-2">
                          {emblem.icon}
                          <span className="text-sm font-medium">{emblem.name}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{emblem.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 侵蚀症状 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Skull className="w-5 h-5 text-red-500" />
                  侵蚀症状 ({player.erosions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {player.erosions.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-2">暂无侵蚀</p>
                  ) : (
                    player.erosions.map((erosion, index) => (
                      <div key={`${erosion.id}-${index}`} className="p-2 rounded bg-red-900/30 border border-red-500/30">
                        <span className="text-sm font-medium text-red-400">{erosion.name}</span>
                        <p className="text-xs text-gray-400">{erosion.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 图例 */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">格子说明</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                  {Object.entries(GRID_TYPE_CONFIG).slice(0, 8).map(([type, config]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${config.color}`}>
                        {config.icon}
                      </div>
                      <span>{config.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 战斗界面 */}
      {gamePhase === 'battle' && currentEnemy && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {currentEnemy.isBoss ? '⚔️ BOSS战' : '⚔️ 战斗'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 敌人信息 */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-lg font-bold ${currentEnemy.isBoss ? 'text-red-400' : 'text-orange-400'}`}>
                    {currentEnemy.name}
                  </span>
                  <Badge variant="outline" className="text-gray-400">
                    ATK:{currentEnemy.attack} DEF:{currentEnemy.defense}
                  </Badge>
                </div>
                <Progress value={(currentEnemy.hp / currentEnemy.maxHp) * 100} className="h-3 bg-gray-600" />
                <div className="text-right text-sm text-gray-400 mt-1">
                  HP: {currentEnemy.hp}/{currentEnemy.maxHp}
                </div>
              </div>
              
              {/* 玩家信息 */}
              <div className="bg-cyan-900/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-cyan-400">探索者</span>
                  <Badge variant="outline" className="text-gray-400">
                    ATK:{effectiveStats.attack} DEF:{effectiveStats.defense}
                  </Badge>
                </div>
                <Progress value={(player.hp / effectiveStats.maxHp) * 100} className="h-3 bg-gray-600" />
                <div className="text-right text-sm text-gray-400 mt-1">
                  HP: {player.hp}/{effectiveStats.maxHp}
                </div>
              </div>
              
              {/* 战斗日志 */}
              <div className="bg-gray-900 rounded-lg p-3 h-32 overflow-y-auto">
                {battleLog.map((log, index) => (
                  <p key={index} className="text-sm text-gray-300">{log}</p>
                ))}
              </div>
              
              {/* 战斗按钮 */}
              <div className="flex gap-3">
                <Button 
                  onClick={playerAttack} 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Sword className="w-4 h-4 mr-2" />
                  攻击
                </Button>
                <Button 
                  onClick={() => {
                    setPlayer(prev => ({ ...prev, hp: Math.min(effectiveStats.maxHp, prev.hp + 15) }))
                    setBattleLog(prev => [...prev, '💚 恢复了 15 点生命'])
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  治疗
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 商店界面 */}
      {gamePhase === 'shop' && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                <Store className="w-6 h-6 text-cyan-500" />
                商店
              </CardTitle>
              <CardDescription className="text-center">
                当前金币: <span className="text-yellow-400 font-bold">{player.coins}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {shopItems.map((emblem) => {
                const prices: Record<string, number> = {
                  common: 30,
                  rare: 60,
                  epic: 100,
                  legendary: 200
                }
                const price = prices[emblem.rarity]
                
                return (
                  <div 
                    key={emblem.id} 
                    className={`p-3 rounded-lg border ${getRarityColor(emblem.rarity)} bg-gray-700/30 flex items-center justify-between`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {emblem.icon}
                        <span className="font-medium">{emblem.name}</span>
                      </div>
                      <p className="text-sm text-gray-400">{emblem.description}</p>
                    </div>
                    <Button 
                      onClick={() => buyEmblem(emblem)}
                      disabled={player.coins < price}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {price} 金币
                    </Button>
                  </div>
                )
              })}
              
              <Button 
                onClick={() => setGamePhase('exploration')} 
                variant="outline" 
                className="w-full mt-4"
              >
                离开商店
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 胜利界面 */}
      {gamePhase === 'victory' && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gradient-to-br from-yellow-900 to-gray-800 border-yellow-500">
            <CardHeader>
              <CardTitle className="text-3xl text-center text-yellow-400">
                🎉 胜利！
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-xl">恭喜你成功探索了空洞！</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-700/50 rounded p-2">
                  <div className="text-2xl font-bold text-yellow-400">{player.coins}</div>
                  <div className="text-gray-400">获得金币</div>
                </div>
                <div className="bg-gray-700/50 rounded p-2">
                  <div className="text-2xl font-bold text-purple-400">{player.emblems.length}</div>
                  <div className="text-gray-400">鸣徽收集</div>
                </div>
              </div>
              <Button onClick={initializeGrid} className="w-full bg-yellow-600 hover:bg-yellow-700">
                再次挑战
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 游戏结束界面 */}
      {gamePhase === 'gameover' && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-gradient-to-br from-red-900 to-gray-800 border-red-500">
            <CardHeader>
              <CardTitle className="text-3xl text-center text-red-400">
                💀 探索失败
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-xl">空洞的侵蚀击败了你...</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-700/50 rounded p-2">
                  <div className="text-2xl font-bold text-yellow-400">{player.coins}</div>
                  <div className="text-gray-400">获得金币</div>
                </div>
                <div className="bg-gray-700/50 rounded p-2">
                  <div className="text-2xl font-bold text-cyan-400">第 {currentFloor} 层</div>
                  <div className="text-gray-400">探索深度</div>
                </div>
              </div>
              <Button onClick={initializeGrid} className="w-full bg-red-600 hover:bg-red-700">
                重新开始
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 通用对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-600 text-white [&>button]:text-white [&>button]:hover:text-gray-300">
          <DialogHeader>
            <DialogTitle className="text-white">{dialogContent.title}</DialogTitle>
            <DialogDescription className="text-gray-300 whitespace-pre-line">{dialogContent.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2">
            {dialogContent.choices?.map((choice, index) => (
              <Button key={index} onClick={choice.action} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                {choice.text}
              </Button>
            ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-700 p-3">
        <div className="max-w-6xl mx-auto flex justify-center gap-3">
          <Button onClick={initializeGrid} className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
            <Sparkles className="w-4 h-4" />
            新游戏
          </Button>
          <Button 
            onClick={() => {
              setDialogContent({
                title: '📖 游戏说明',
                description: '【属性说明】\n❤️ 生命：角色血量，归零则失败\n⚡ 压力：满100获得负面侵蚀\n⚔️ 攻击：造成伤害的能力\n🛡️ 防御：减少受到的伤害\n💰 金币：商店购买鸣徽\n⭐ 暴击：暴击率\n\n【玩法说明】\n这是对《绝区零》"走格子"玩法的还原。核心机制包括：\n1. 棋盘探索：点击相邻格子移动\n2. 压力系统：每次移动增加压力，压力满时获得负面效果\n3. 鸣徽系统：战斗和事件中获得增益道具\n4. 战斗系统：简化版回合制战斗\n5. 资源管理：金币用于商店购买鸣徽\n\n目标：击败右下角的BOSS！'
              })
              setDialogOpen(true)
            }}
            className="gap-2 bg-gray-600 hover:bg-gray-500 text-white"
          >
            <ChevronRight className="w-4 h-4" />
            游戏说明
          </Button>
        </div>
      </div>
    </div>
  )
}
