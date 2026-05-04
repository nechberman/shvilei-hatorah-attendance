import { useEffect, useState } from 'react'

interface HebrewCalendarData {
  hebrewDate: string       // e.g. "ו׳ אייר תשפ״ו"
  gregorianDate: string    // e.g. "יום ראשון, 3 במאי 2026"
  parasha: string | null   // e.g. "פרשת בהר-בחוקותי"
  loading: boolean
}

export function useHebrewCalendar(): HebrewCalendarData {
  const now = new Date()
  const [hebrewDate, setHebrewDate] = useState<string>('')
  const [parasha, setParasha] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const gregorianDate = new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)

  useEffect(() => {
    async function fetchCalendarData() {
      try {
        const gy = now.getFullYear()
        const gm = now.getMonth() + 1
        const gd = now.getDate()

        // Fetch Hebrew date from Hebcal converter
        const [dateRes, parashaRes] = await Promise.all([
          fetch(
            `https://www.hebcal.com/converter?cfg=json&gy=${gy}&gm=${gm}&gd=${gd}&g2h=1`,
            { signal: AbortSignal.timeout(4000) }
          ),
          fetch(
            'https://www.hebcal.com/shabbat/?cfg=json&geonameid=293397&m=50&lg=he&b=18&M=on',
            { signal: AbortSignal.timeout(4000) }
          ),
        ])

        const dateData = await dateRes.json() as { hebrew?: string }
        if (dateData.hebrew) setHebrewDate(dateData.hebrew)

        const parashaData = await parashaRes.json() as { items?: { category: string; title: string; hebrew?: string }[] }
        const parashaItem = parashaData.items?.find(i => i.category === 'parashat')
        if (parashaItem) setParasha(parashaItem.hebrew ?? parashaItem.title)
      } catch {
        // fallback to Intl if API fails
        try {
          const fallback = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
            year: 'numeric', month: 'long', day: 'numeric',
          }).format(now)
          setHebrewDate(fallback)
        } catch {
          setHebrewDate('')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchCalendarData()
  }, [])

  return { hebrewDate, gregorianDate, parasha, loading }
}
