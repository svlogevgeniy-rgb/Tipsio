"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Download, ExternalLink } from "lucide-react";
import { useTranslations } from "@/i18n/client";
import { QrGenerator } from "@/components/venue/qr-codes/QrGenerator";

type QrCode = {
  id: string;
  type: "PERSONAL" | "TABLE" | "VENUE";
  label: string | null;
  shortCode: string;
  status: string;
};

export default function QrCodesPage() {
  const [venueQr, setVenueQr] = useState<QrCode | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [venueName, setVenueName] = useState<string>("");
  const t = useTranslations('venue.qr');

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    async function fetchData() {
      try {
        const dashRes = await fetch("/api/venues/dashboard?period=week");
        if (!dashRes.ok) throw new Error("Failed to load venue");
        const dashData = await dashRes.json();

        if (dashData.venue?.id) {
          setVenueName(dashData.venue.name || "");

          const qrRes = await fetch(`/api/qr?venueId=${dashData.venue.id}`);
          if (qrRes.ok) {
            const qrData = await qrRes.json();
            const codes = qrData.qrCodes || [];
            // Find venue QR (type VENUE or first TABLE)
            const venueCode = codes.find((qr: QrCode) => qr.type === "VENUE") 
              || codes.find((qr: QrCode) => qr.type === "TABLE")
              || codes[0];
            setVenueQr(venueCode || null);
          }
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(t('failedToLoad'));
      } finally {
        setIsPageLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDownload = async (qrId: string, format: "png" | "svg") => {
    try {
      const response = await fetch(`/api/qr/${qrId}/download?format=${format}`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${venueName.replace(/\s+/g, "-").toLowerCase() || "venue"}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
      setError(t('failedToDownload'));
    }
  };

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Main QR Card - Quick Access */}
      {venueQr ? (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-heading">QR код заведения</CardTitle>
            <CardDescription>
              Базовый QR код для сканирования.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-32 h-32 bg-white rounded-xl p-3 flex items-center justify-center shadow-sm">
                <img 
                  src={`/api/qr/${venueQr.id}/download?format=svg`} 
                  alt="QR Code" 
                  className="w-full h-full"
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="text-lg font-medium mb-1">{venueName || t('venueQr')}</div>
                <div className="text-sm text-muted-foreground mb-4 break-all font-mono">
                  {baseUrl}/tip/{venueQr.shortCode}
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`${baseUrl}/tip/${venueQr.shortCode}`, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Проверить ссылку
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleDownload(venueQr.id, "png")}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Скачать PNG
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleDownload(venueQr.id, "svg")}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Скачать SVG
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {t('qrWillBeCreated')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* New Generator Section */}
      {venueQr && (
        <div className="space-y-4">
           <h2 className="text-xl font-heading font-bold">Конструктор материалов</h2>
           <p className="text-muted-foreground text-sm">
             Создайте стильные материалы для печати: тейбл-тенты, наклейки и визитки.
           </p>
           <Card className="glass border-0 shadow-none bg-transparent">
             <QrGenerator shortCode={venueQr.shortCode} venueName={venueName} />
           </Card>
        </div>
      )}
    </div>
  );
}

