'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api-client';
import { SOURCE_LABELS, SOURCE_COLORS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles, ArrowRight, Check, Loader2, Plug,
  Rocket, PartyPopper, SkipForward,
} from 'lucide-react';

const ALL_SOURCES = ['SLACK', 'GITHUB', 'HUBSPOT', 'JIRA', 'NOTION', 'GOOGLE'] as const;

const SOURCE_DESCRIPTIONS: Record<string, string> = {
  SLACK: 'Team messaging & communication',
  GITHUB: 'Code repos & pull requests',
  HUBSPOT: 'CRM & customer data',
  JIRA: 'Project tracking & issues',
  NOTION: 'Docs & knowledge base',
  GOOGLE: 'Calendar, Drive & Gmail',
};

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedSources, setConnectedSources] = useState<Set<string>>(new Set());

  useEffect(() => {
    api<any[]>('/integrations')
      .then((data) => {
        const connected = new Set(
          data?.filter((i) => i.status === 'CONNECTED').map((i) => i.source) || []
        );
        setConnectedSources(connected);
      })
      .catch(() => {});
  }, []);

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 2));
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  function finish() {
    localStorage.setItem('assemblr_onboarding_dismissed', 'true');
    router.push('/dashboard');
  }

  async function handleConnect(source: string) {
    setConnecting(source);
    try {
      await api('/integrations/connect', {
        method: 'POST',
        body: { source, connectionId: `demo-${source.toLowerCase()}-${Date.now()}` },
      });
      setConnectedSources((prev) => new Set([...prev, source]));
    } catch {
      // ignore
    } finally {
      setConnecting(null);
    }
  }

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-background">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 60%)',
            filter: 'blur(120px)',
          }}
        />
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-10 relative z-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              step === i
                ? 'w-8 bg-primary'
                : step > i
                  ? 'w-2 bg-primary/60'
                  : 'w-2 bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="relative z-10 w-full max-w-2xl px-6">
        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-brand), var(--accent-brand-hover))',
                  boxShadow: 'var(--shadow-glow-lg)',
                }}
              >
                <Sparkles size={28} color="#fff" />
              </motion.div>

              <h1 className="text-3xl font-bold mb-3 text-foreground" style={{ letterSpacing: '-0.03em' }}>
                Welcome, {firstName}!
              </h1>
              <p className="text-base max-w-md mx-auto mb-10 text-muted-foreground" style={{ lineHeight: 1.6 }}>
                Assemblr discovers cross-tool workflow patterns from your integrations
                and compiles them into reusable skill graphs.
              </p>

              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-10">
                {[
                  { icon: Plug, label: 'Connect Tools', desc: 'Link your work apps' },
                  { icon: Sparkles, label: 'Discover Patterns', desc: 'AI-detected workflows' },
                  { icon: Rocket, label: 'Build Skills', desc: 'Reusable automations' },
                ].map((feat, i) => (
                  <motion.div
                    key={feat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="p-5 rounded-xl text-center bg-card border border-border"
                  >
                    <div
                      className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                      style={{ background: 'var(--accent-brand-muted)', color: 'var(--accent-brand)' }}
                    >
                      <feat.icon size={18} />
                    </div>
                    <div className="text-sm font-medium mb-1 text-foreground">
                      {feat.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {feat.desc}
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button variant="glow" size="lg" onClick={goNext}>
                Get Started <ArrowRight size={18} />
              </Button>
            </motion.div>
          )}

          {/* Step 1: Connect Integrations */}
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2 text-foreground" style={{ letterSpacing: '-0.02em' }}>
                  Connect Your Tools
                </h2>
                <p className="text-sm text-muted-foreground">
                  Connect at least one integration to start discovering workflow patterns.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {ALL_SOURCES.map((source, i) => {
                  const isConnected = connectedSources.has(source);
                  const color = SOURCE_COLORS[source] || '#888';
                  const isConnecting = connecting === source;

                  return (
                    <motion.div
                      key={source}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <button
                        onClick={() => !isConnected && handleConnect(source)}
                        disabled={isConnecting}
                        className="w-full text-left rounded-xl transition-all duration-150 bg-card border hover:border-primary"
                        style={{
                          padding: 20,
                          borderColor: isConnected ? 'var(--success)' : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                            style={{
                              background: `color-mix(in srgb, ${color} 15%, transparent)`,
                              color,
                              border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                            }}
                          >
                            {(SOURCE_LABELS[source] || source)[0]}
                          </div>

                          {isConnected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ background: 'var(--success)', color: '#fff' }}
                            >
                              <Check size={14} strokeWidth={3} />
                            </motion.div>
                          )}

                          {isConnecting && (
                            <Loader2 size={18} className="animate-spin text-primary" />
                          )}
                        </div>

                        <div className="text-sm font-medium mb-1 text-foreground">
                          {SOURCE_LABELS[source] || source}
                        </div>
                        <div className="text-xs text-muted-foreground" style={{ lineHeight: 1.4 }}>
                          {SOURCE_DESCRIPTIONS[source]}
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={goBack}>Back</Button>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={finish}>
                    <SkipForward size={14} /> Skip for now
                  </Button>
                  <Button
                    variant="glow"
                    size="lg"
                    onClick={goNext}
                    disabled={connectedSources.size === 0}
                  >
                    Continue <ArrowRight size={18} />
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="text-center mt-6">
                <span className="text-xs text-muted-foreground">
                  {connectedSources.size} of {ALL_SOURCES.length} connected
                </span>
                <div className="mt-2 mx-auto" style={{ width: 200 }}>
                  <Progress value={(connectedSources.size / ALL_SOURCES.length) * 100} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Success */}
          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                style={{
                  background: 'linear-gradient(135deg, var(--success), #16a34a)',
                  boxShadow: '0 0 40px rgba(34, 197, 94, 0.25)',
                }}
              >
                <PartyPopper size={28} color="#fff" />
              </motion.div>

              <h2 className="text-3xl font-bold mb-3 text-foreground" style={{ letterSpacing: '-0.03em' }}>
                You&apos;re All Set!
              </h2>
              <p className="text-base max-w-md mx-auto mb-4 text-muted-foreground" style={{ lineHeight: 1.6 }}>
                {connectedSources.size > 0
                  ? `You've connected ${connectedSources.size} integration${connectedSources.size > 1 ? 's' : ''}. Assemblr will start discovering workflow patterns from your data.`
                  : 'You can connect integrations anytime from the Integrations page.'}
              </p>

              {connectedSources.size > 0 && (
                <div className="flex items-center justify-center gap-2 mb-8">
                  {Array.from(connectedSources).map((source) => {
                    const color = SOURCE_COLORS[source] || '#888';
                    return (
                      <motion.div
                        key={source}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                        style={{
                          background: `color-mix(in srgb, ${color} 15%, transparent)`,
                          color,
                          border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                        }}
                      >
                        {(SOURCE_LABELS[source] || source)[0]}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <Button variant="glow" size="lg" onClick={finish}>
                Go to Dashboard <ArrowRight size={18} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
