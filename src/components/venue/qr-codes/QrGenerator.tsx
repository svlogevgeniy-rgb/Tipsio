"use client";

import React, { useState, useEffect } from 'react';
import { QrDesignState, MaterialType, MATERIAL_TYPES, DEFAULT_CTA_TEXTS } from '@/lib/qr-materials';
import { MaterialPreview } from './MaterialPreview';
import { QrPdfDocument } from './PdfTemplates';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QRCode from 'qrcode';
import { Download, Upload, Palette } from 'lucide-react';

interface QrGeneratorProps {
  shortCode: string;
  venueName: string;
}

const PRESET_COLORS = [
  { name: 'Classic White', base: '#FFFFFF', accent: '#000000' },
  { name: 'Midnight Black', base: '#1F2937', accent: '#FFFFFF' },
  { name: 'Tipsio Green', base: '#059669', accent: '#FFFFFF' },
  { name: 'Ocean Blue', base: '#0EA5E9', accent: '#FFFFFF' },
  { name: 'Sunset Orange', base: '#F97316', accent: '#FFFFFF' },
  { name: 'Berry Red', base: '#DC2626', accent: '#FFFFFF' },
];

export function QrGenerator({ shortCode, venueName }: QrGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [design, setDesign] = useState<QrDesignState>({
    materialType: 'table-tent',
    baseColor: '#FFFFFF',
    accentColor: '#000000',
    ctaText: 'Оставьте чаевые',
    showLogo: false,
    logoUrl: undefined
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const generateQr = async () => {
      try {
        // Use the full URL for the QR code
        const url = `${window.location.origin}/tip/${shortCode}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 512,
          margin: 1,
          color: {
            dark: design.accentColor === '#FFFFFF' && design.baseColor !== '#FFFFFF' ? design.baseColor : '#000000', // Optimizing contrast for scanner
            // Actually, standard QR should usually be dark on light. 
            // If background is dark, we might need inverted QR or a white box.
            // For simplicity, let's keep QR standard black on white box in preview, 
            // or use `color` options if we want to blend it.
            // Let's stick to standard black QR for high readability for now, 
            // or match accent if contrast is high enough.
            light: '#FFFFFF00' // Transparent background
          }
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error("QR Generation failed", err);
      }
    };
    generateQr();
  }, [shortCode, design.accentColor, design.baseColor]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDesign(prev => ({ ...prev, logoUrl: reader.result as string, showLogo: true }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isClient) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* LEFT: Mobile-First Preview (Top on mobile) */}
      <div className="flex-1 lg:sticky lg:top-6 self-start w-full">
        <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-xl p-4 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center min-h-[400px]">
          <div className="w-full max-w-md shadow-2xl rounded-lg overflow-hidden transition-all duration-500 ease-in-out">
             <MaterialPreview design={design} qrDataUrl={qrDataUrl} venueName={venueName} />
          </div>
        </div>
      </div>

      {/* RIGHT: Controls (Bottom on mobile) */}
      <div className="w-full lg:w-[400px] space-y-6 pb-20 lg:pb-0">
        
        {/* Material Selector */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Выберите формат</Label>
          <Tabs 
            value={design.materialType} 
            onValueChange={(v) => setDesign(d => ({ ...d, materialType: v as MaterialType }))} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
               {MATERIAL_TYPES.map(type => (
                 <TabsTrigger key={type.id} value={type.id} className="text-xs px-1">
                   {type.label.ru}
                 </TabsTrigger>
               ))}
            </TabsList>
          </Tabs>
          <p className="text-sm text-muted-foreground">
            {MATERIAL_TYPES.find(t => t.id === design.materialType)?.description.ru}
          </p>
        </div>

        {/* Content Controls */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-base font-semibold">Наполнение</Label>
          
          <div className="space-y-2">
            <Label htmlFor="cta">Призыв к действию</Label>
            <Select 
              value={design.ctaText} 
              onValueChange={(v) => setDesign(d => ({ ...d, ctaText: v }))}
            >
              <SelectTrigger id="cta">
                <SelectValue placeholder="Выберите текст" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_CTA_TEXTS.map(text => (
                  <SelectItem key={text} value={text}>{text}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input 
              placeholder="Или свой вариант..." 
              value={design.ctaText}
              onChange={(e) => setDesign(d => ({ ...d, ctaText: e.target.value }))}
              className="mt-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="logo-mode" className="cursor-pointer">Логотип заведения</Label>
            <Switch 
              id="logo-mode" 
              checked={design.showLogo}
              onCheckedChange={(c) => setDesign(d => ({ ...d, showLogo: c }))}
            />
          </div>
          
          {design.showLogo && (
            <div className="flex gap-2 items-center">
               <Button variant="outline" className="w-full relative overflow-hidden">
                 <Upload className="w-4 h-4 mr-2" /> 
                 {design.logoUrl ? 'Изменить лого' : 'Загрузить лого'}
                 <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleLogoUpload}
                 />
               </Button>
            </div>
          )}
        </div>

        {/* Style Controls */}
        <div className="space-y-4 border-t pt-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4" /> Дизайн
          </Label>
          
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((c, i) => (
              <button
                key={i}
                className={`w-8 h-8 rounded-full border-2 ${design.baseColor === c.base ? 'border-black dark:border-white ring-2 ring-offset-2' : 'border-transparent'}`}
                style={{ backgroundColor: c.base }}
                onClick={() => setDesign(d => ({ ...d, baseColor: c.base, accentColor: c.accent }))}
                title={c.name}
              />
            ))}
            <div className="relative">
               <input 
                 type="color" 
                 className="w-8 h-8 rounded-full overflow-hidden p-0 border-0 cursor-pointer opacity-0 absolute inset-0"
                 value={design.baseColor}
                 onChange={(e) => setDesign(d => ({ ...d, baseColor: e.target.value }))}
               />
               <div className="w-8 h-8 rounded-full border border-gray-300 bg-gradient-to-br from-white to-black pointer-events-none" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <Label className="text-xs mb-1 block">Фон</Label>
                <div className="flex gap-2 items-center">
                  <div className="w-6 h-6 rounded border" style={{ backgroundColor: design.baseColor }} />
                  <Input 
                     value={design.baseColor} 
                     onChange={(e) => setDesign(d => ({ ...d, baseColor: e.target.value }))} 
                     className="h-8 font-mono text-xs"
                  />
                </div>
             </div>
             <div>
                <Label className="text-xs mb-1 block">Текст</Label>
                <div className="flex gap-2 items-center">
                  <div className="w-6 h-6 rounded border" style={{ backgroundColor: design.accentColor }} />
                  <Input 
                     value={design.accentColor} 
                     onChange={(e) => setDesign(d => ({ ...d, accentColor: e.target.value }))} 
                     className="h-8 font-mono text-xs"
                  />
                </div>
             </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t mt-auto">
          {isClient && qrDataUrl && (
            <PDFDownloadLink
              document={<QrPdfDocument design={design} qrDataUrl={qrDataUrl} venueName={venueName} />}
              fileName={`tipsio-${design.materialType}.pdf`}
              className="w-full"
            >
              {({ loading }) => (
                <Button className="w-full" size="lg" disabled={loading || !qrDataUrl}>
                  {loading ? (
                      <>Генерация...</>
                  ) : (
                      <>
                          <Download className="w-4 h-4 mr-2" /> Скачать PDF для печати
                      </>
                  )}
                </Button>
              )}
            </PDFDownloadLink>
          )}
          {(!isClient || !qrDataUrl) && (
            <Button className="w-full" size="lg" disabled>
              <Download className="w-4 h-4 mr-2" /> Загрузка...
            </Button>
          )}
          <p className="text-xs text-center text-muted-foreground mt-2">
            PDF высокого качества (вектор)
          </p>
        </div>
      </div>
    </div>
  );
}
