export interface RecentVocabularyItem {
  reviewCardId: string
  surface: string
  meaning: string | null
  createdAt: number
  sourceContentItemId: string
}

export interface WeeklyActivityPoint {
  date: string
  cardsReviewed: number
  minutesStudied: number
  isToday: boolean
}

export interface ResumeContext {
  contentItemId: string
  title: string
  provenanceLabel: string
  activeBlockId: string | null
  updatedAt: number
}

export interface HomeDashboardSnapshot {
  generatedAt: number
  todayDueCount: number
  streakDays: number
  dailyGoal: number
  recentVocabulary: RecentVocabularyItem[]
  weeklyActivity: WeeklyActivityPoint[]
  resumeContext: ResumeContext | null
}