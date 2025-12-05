import React from 'react';
import { QrDesignState } from '@/lib/qr-materials';
import { Scissors } from 'lucide-react';

interface MaterialPreviewProps {
  design: QrDesignState;
  qrDataUrl: string;
  venueName: string;
}

export const MaterialPreview = ({ design, qrDataUrl, venueName }: MaterialPreviewProps) => {
  const { materialType, baseColor, accentColor, ctaText, showLogo, logoUrl } = design;

  // Common styles
  const bgStyle = { backgroundColor: baseColor };
  const textStyle = { color: accentColor };
  const qrContainerStyle = { backgroundColor: 'white', padding: '0.5rem', borderRadius: '0.5rem' };

  const Content = ({ scale = 1 }: { scale?: number }) => (
    <div className="flex flex-col items-center justify-center text-center p-4 h-full w-full relative">
      {showLogo && logoUrl && (
        <img src={logoUrl} alt="Logo" className="w-8 h-8 mb-2 object-contain" />
      )}
      <h3 className="font-bold mb-3 leading-tight" style={{ ...textStyle, fontSize: `${1.2 * scale}rem` }}>
        {ctaText}
      </h3>
      
      <div style={qrContainerStyle} className="shadow-sm">
        <img src={qrDataUrl} alt="QR Code" className="block" style={{ width: `${120 * scale}px`, height: `${120 * scale}px` }} />
      </div>

      <p className="mt-3 text-xs opacity-80 font-medium" style={textStyle}>
        {venueName}
      </p>
    </div>
  );

  // Render Table Tent (Front Face Preview)
  if (materialType === 'table-tent') {
    return (
      <div className="w-full aspect-[210/297] bg-white shadow-lg rounded-lg overflow-hidden relative flex flex-col">
        {/* Simulation of A4 Sheet */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
             {/* Top Half (Back - Faded/Inverted) */}
            <div className="h-1/2 border-b-2 border-dashed border-gray-300 flex items-center justify-center opacity-30 bg-gray-50">
                 <div className="transform rotate-180"><Content scale={0.8} /></div>
            </div>
            {/* Bottom Half (Front) */}
            <div className="h-1/2 flex items-center justify-center" style={bgStyle}>
                <Content />
            </div>
        </div>
        <div className="absolute top-2 right-2 text-[10px] text-gray-400 border border-gray-200 px-1 rounded bg-white">
            A4 Preview
        </div>
      </div>
    );
  }

  // Render Sticker
  if (materialType === 'sticker') {
    return (
      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden relative">
         <div className="w-[70%] aspect-square rounded-full shadow-xl flex items-center justify-center relative overflow-hidden" style={bgStyle}>
            <Content scale={0.9} />
         </div>
         <div className="absolute bottom-2 text-xs text-gray-400 flex items-center gap-1">
            <Scissors size={12} /> Cut along the edge
         </div>
      </div>
    );
  }

  // Render Card (Simple Rectangle)
  if (materialType === 'card') {
      return (
        <div className="w-full aspect-[1.6] bg-gray-100 flex items-center justify-center rounded-lg relative">
            <div className="w-[80%] h-[80%] shadow-xl flex items-center justify-center rounded-lg relative overflow-hidden" style={bgStyle}>
                <Content scale={0.8} />
            </div>
        </div>
      );
  }
  
  // Poster (A4 Full)
  if (materialType === 'poster') {
      return (
        <div className="w-full aspect-[210/297] shadow-lg rounded-lg overflow-hidden relative flex items-center justify-center" style={bgStyle}>
             <div className="transform scale-125">
                 <Content scale={1.5} />
             </div>
        </div>
      );
  }

  return <div>Unknown Type</div>;
};
