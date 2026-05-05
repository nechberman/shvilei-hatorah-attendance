import { useState, useEffect } from 'react'

export function useHebrewDate(dateStr: string): string {
  const [hebrewDate, setHebrewDate] = useState('')

  useEffect(() => {
    if (!dateStr) return
    let cancelled = false
    const [gy, gm, gd] = dateStr.split('-').map(Number)
    fetch(
      `https://www.hebcal.com/converter?cfg=json&gy=${gy}&gm=${gm}&gd=${gd}&g2h=1`,
      { signal: AbortSignal.timeout(4000) }
    )
      .then(r => r.json())
      .then((data: { hebrew?: string }) => {
        if (!cancelled && data.hebrew) setHebrewDate(data.hebrew)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [dateStr])

  return hebrewDate
}
