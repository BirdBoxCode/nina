'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

interface IntroContextType {
  contentVisible: boolean
  cursorOverride: { x: number; y: number } | null
  setCursorOverride: (pos: { x: number; y: number } | null) => void
  showContent: () => void
}

const IntroContext = createContext<IntroContextType>({
  contentVisible: true,
  cursorOverride: null,
  setCursorOverride: () => {},
  showContent: () => {},
})

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [contentVisible, setContentVisible] = useState(false)
  const [cursorOverride, setCursorOverrideState] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (sessionStorage.getItem('introPlayed')) {
      setContentVisible(true)
    }
  }, [])

  const setCursorOverride = useCallback((pos: { x: number; y: number } | null) => {
    setCursorOverrideState(pos)
  }, [])

  const showContent = useCallback(() => setContentVisible(true), [])

  return (
    <IntroContext.Provider value={{ contentVisible, cursorOverride, setCursorOverride, showContent }}>
      {children}
    </IntroContext.Provider>
  )
}

export function useIntro() {
  return useContext(IntroContext)
}

export function MainContent({ children }: { children: React.ReactNode }) {
  const { contentVisible } = useIntro()
  return (
    <div
      style={{
        opacity: contentVisible ? 1 : 0,
        pointerEvents: contentVisible ? 'auto' : 'none',
        transition: contentVisible ? 'opacity 0.3s ease' : 'none',
      }}
    >
      {children}
    </div>
  )
}
