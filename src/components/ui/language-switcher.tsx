'use client'

import { useState, useEffect } from 'react'
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
  { code: 'en', name: 'English', shortCode: 'EN' },
  { code: 'ru', name: 'Русский', shortCode: 'RU' },
]

export function LanguageSwitcher() {
  const [mounted, setMounted] = useState(false)
  const [currentLocale, setCurrentLocale] = useState('en')

  useEffect(() => {
    setCurrentLocale(getLocale())
    setMounted(true)
  }, [])

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0]

  const handleLocaleChange = (code: string) => {
    setLocale(code)
    setCurrentLocale(code)
  }

  // Prevent hydration mismatch by showing placeholder until mounted
  if (!mounted) {
    return (
      <Button variant="ghost" className="h-9 px-3 gap-1.5">
        <span className="text-sm font-medium">...</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 px-3 gap-1.5">
          <span className="text-sm font-medium">{currentLanguage.shortCode}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-white/10">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code)}
            className={`cursor-pointer text-black ${lang.code === currentLocale ? 'bg-primary/10' : ''}`}
          >
            <span className="flex-1 text-black">{lang.shortCode}</span>
            {lang.code === currentLocale && (
              <span className="ml-2 text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
