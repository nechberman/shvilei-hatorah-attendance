import { Sheet, ExternalLink, Info } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'

export default function SheetsSync() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="סנכרון Sheets" subtitle="ייצוא נתונים ל-Google Sheets" icon={Sheet} />
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sheet size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-700 mb-2">סנכרון עם Google Sheets</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
            ניתן לייצא נתוני נוכחות, תפקוד שבועי ורשימת תלמידים לגוגל שיטס לצורך דיווח וניתוח
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-blue-500 bg-blue-50 px-4 py-2 rounded-xl max-w-sm mx-auto">
            <Info size={13} />
            <span>תכונה זו תהיה זמינה בקרוב</span>
          </div>
        </div>
      </div>
    </div>
  )
}
