"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTranslations } from "@/i18n/client";
import { ArrowLeft, ArrowRight, X, Check, Loader2, Building2, CreditCard, Users } from "lucide-react";

// Step 1: Basic info
const step1Schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  venueName: z.string().min(2, "Venue name must be at least 2 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Step 2: Midtrans
const step2Schema = z.object({
  clientKey: z.string().min(1, "Client Key is required"),
  serverKey: z.string().min(1, "Server Key is required"),
  merchantId: z.string().min(1, "Merchant ID is required"),
});

// Step 3: Distribution mode
const step3Schema = z.object({
  distributionMode: z.enum(["POOLED", "PERSONAL"]),
});

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;
type Step3Form = z.infer<typeof step3Schema>;

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations('venue.register');

  // Восстанавливаем состояние из sessionStorage при монтировании
  const [step, setStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('venueRegisterStep');
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const [midtransValid, setMidtransValid] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('venueRegisterMidtransValid');
      return saved === 'true';
    }
    return false;
  });

  // Form data storage
  const [step1Data, setStep1Data] = useState<Step1Form | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('venueRegisterStep1');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [step2Data, setStep2Data] = useState<Step2Form | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('venueRegisterStep2');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  // Сохраняем состояние в sessionStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('venueRegisterStep', step.toString());
    }
  }, [step]);

  useEffect(() => {
    if (typeof window !== 'undefined' && step1Data) {
      sessionStorage.setItem('venueRegisterStep1', JSON.stringify(step1Data));
    }
  }, [step1Data]);

  useEffect(() => {
    if (typeof window !== 'undefined' && step2Data) {
      sessionStorage.setItem('venueRegisterStep2', JSON.stringify(step2Data));
    }
  }, [step2Data]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('venueRegisterMidtransValid', midtransValid.toString());
    }
  }, [midtransValid]);

  // Step 1 form
  const form1 = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data || undefined,
  });

  // Step 2 form
  const form2 = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: step2Data || undefined,
  });

  // Step 3 form
  const form3 = useForm<Step3Form>({
    resolver: zodResolver(step3Schema),
    defaultValues: { distributionMode: "POOLED" },
  });

  const handleStep1Submit = (data: Step1Form) => {
    setStep1Data(data);
    setStep(2);
    setError(null);
  };

  const testMidtransConnection = async () => {
    const data = form2.getValues();
    if (!data.clientKey || !data.serverKey || !data.merchantId) {
      setError("Please fill all Midtrans fields");
      return;
    }

    setIsTesting(true);
    setError(null);

    try {
      const response = await fetch("/api/venues/midtrans/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Invalid Midtrans credentials");
        setMidtransValid(false);
        return;
      }

      setMidtransValid(true);
      setStep2Data(data);
    } catch {
      setError("Failed to validate Midtrans credentials");
      setMidtransValid(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleStep2Submit = (data: Step2Form) => {
    if (!midtransValid) {
      setError("Please validate Midtrans credentials first");
      return;
    }
    setStep2Data(data);
    setStep(3);
    setError(null);
  };

  const handleFinalSubmit = async (data: Step3Form) => {
    if (!step1Data || !step2Data) return;

    setIsLoading(true);
    setError(null);

    try {
      // Register venue
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: step1Data.email,
          password: step1Data.password,
          venueName: step1Data.venueName,
          venueType: "OTHER", // Default type
          distributionMode: data.distributionMode,
          midtrans: {
            clientKey: step2Data.clientKey,
            serverKey: step2Data.serverKey,
            merchantId: step2Data.merchantId,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Registration failed");
        return;
      }

      // Очищаем sessionStorage после успешной регистрации
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('venueRegisterStep');
        sessionStorage.removeItem('venueRegisterStep1');
        sessionStorage.removeItem('venueRegisterStep2');
        sessionStorage.removeItem('venueRegisterMidtransValid');
      }

      // Auto-login after registration
      const signInResult = await signIn("credentials", {
        email: step1Data.email,
        password: step1Data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/venue/login?registered=true");
      } else {
        router.push("/venue/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Aurora Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-14 glass-heavy border-b border-white/10 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          {step > 1 ? (
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Link href="/">
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            {t('step')} {step}/3
          </span>
        </div>
        <LanguageSwitcher />
      </div>

      <Card className="glass w-full max-w-md mt-14">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {step === 1 && <Building2 className="h-12 w-12 text-primary" />}
            {step === 2 && <CreditCard className="h-12 w-12 text-primary" />}
            {step === 3 && <Users className="h-12 w-12 text-primary" />}
          </div>
          <CardTitle className="text-2xl font-heading text-gradient">
            {step === 1 && t('step1Title')}
            {step === 2 && t('step2Title')}
            {step === 3 && t('step3Title')}
          </CardTitle>
          <CardDescription>
            {step === 1 && t('step1Subtitle')}
            {step === 2 && t('step2Subtitle')}
            {step === 3 && t('step3Subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <form onSubmit={form1.handleSubmit(handleStep1Submit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="venueName">{t('venueName')}</Label>
                <Input
                  id="venueName"
                  placeholder={t('venueNamePlaceholder')}
                  {...form1.register("venueName")}
                  className="h-12"
                />
                {form1.formState.errors.venueName && (
                  <p className="text-sm text-destructive">{form1.formState.errors.venueName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...form1.register("email")}
                  className="h-12"
                />
                {form1.formState.errors.email && (
                  <p className="text-sm text-destructive">{form1.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...form1.register("password")}
                  className="h-12"
                />
                {form1.formState.errors.password && (
                  <p className="text-sm text-destructive">{form1.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...form1.register("confirmPassword")}
                  className="h-12"
                />
                {form1.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">{form1.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-14 text-lg font-heading font-bold">
                {t('continue')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {t('haveAccount')}{" "}
                <Link href="/venue/login" className="text-primary hover:underline">
                  {t('signIn')}
                </Link>
              </p>
            </form>
          )}

          {/* Step 2: Midtrans */}
          {step === 2 && (
            <form onSubmit={form2.handleSubmit(handleStep2Submit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="merchantId">{t('merchantId')}</Label>
                <Input
                  id="merchantId"
                  placeholder="G123456789"
                  {...form2.register("merchantId")}
                  className="h-12"
                />
                {form2.formState.errors.merchantId && (
                  <p className="text-sm text-destructive">{form2.formState.errors.merchantId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientKey">{t('clientKey')}</Label>
                <Input
                  id="clientKey"
                  type="password"
                  placeholder="SB-Mid-client-..."
                  {...form2.register("clientKey")}
                  className="h-12"
                />
                {form2.formState.errors.clientKey && (
                  <p className="text-sm text-destructive">{form2.formState.errors.clientKey.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serverKey">{t('serverKey')}</Label>
                <Input
                  id="serverKey"
                  type="password"
                  placeholder="SB-Mid-server-..."
                  {...form2.register("serverKey")}
                  className="h-12"
                />
                {form2.formState.errors.serverKey && (
                  <p className="text-sm text-destructive">{form2.formState.errors.serverKey.message}</p>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={testMidtransConnection}
                disabled={isTesting}
                className="w-full h-12"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('testing')}
                  </>
                ) : midtransValid ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-success" />
                    {t('connected')}
                  </>
                ) : (
                  t('testConnection')
                )}
              </Button>

              <Button
                type="submit"
                disabled={!midtransValid}
                className="w-full h-14 text-lg font-heading font-bold"
              >
                {t('continue')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          )}

          {/* Step 3: Distribution Mode */}
          {step === 3 && (
            <form onSubmit={form3.handleSubmit(handleFinalSubmit)} className="space-y-4">
              <div className="space-y-3">
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form3.watch("distributionMode") === "POOLED"
                      ? "border-primary bg-primary/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    value="POOLED"
                    {...form3.register("distributionMode")}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold">{t('pooledMode')}</div>
                    <div className="text-sm text-muted-foreground">{t('pooledModeDesc')}</div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form3.watch("distributionMode") === "PERSONAL"
                      ? "border-primary bg-primary/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    value="PERSONAL"
                    {...form3.register("distributionMode")}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold">{t('personalMode')}</div>
                    <div className="text-sm text-muted-foreground">{t('personalModeDesc')}</div>
                  </div>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 text-lg font-heading font-bold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('creating')}
                  </>
                ) : (
                  <>
                    {t('createAccount')}
                    <Check className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
