'use client'

import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { setLocale, getLocale } from '@/i18n/client'

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', shortCode: 'ENG' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', shortCode: 'RUS' },
]

export function LanguageSwitcher() {
  const currentLocale = getLocale()
  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 px-3 gap-1.5">
          <span className="text-base">{currentLanguage.flag}</span>
          <span className="text-sm font-medium">{currentLanguage.shortCode}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-white/10">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={`cursor-pointer ${lang.code === currentLocale ? 'bg-primary/10' : ''}`}
          >
            <span className="mr-2 text-base">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {lang.code === currentLocale && (
              <span className="ml-2 text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
