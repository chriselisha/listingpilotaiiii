import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Loader2, Search, TrendingUp, Star, AlertCircle, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResultCard } from "@/components/ResultCard";
import { useAnalyzeListing, type AnalyzeListingResponse } from "@workspace/api-client-react";

const optimizeSchema = z.object({
  listingUrl: z.string().url("Please enter a valid URL"),
  platform: z.string().optional(),
  notes: z.string().optional(),
});

type OptimizeFormValues = z.infer<typeof optimizeSchema>;

// ─── Score Gauge ──────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 75 ? "#4ade80" : score >= 55 ? "#D4AF37" : "#f87171";
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
          <span className="text-xs text-white/50">/100</span>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color }}>
        {score >= 75 ? "Strong Listing" : score >= 55 ? "Needs Improvement" : "Weak Listing"}
      </p>
    </div>
  );
}

// ─── Results Panel ─────────────────────────────────────────────────────────

function ResultsPanel({ result }: { result: AnalyzeListingResponse }) {
  const wasBlocked = result.extractionStatus === "blocked";
  const wasPartial = result.extractionStatus === "partial";

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Extraction status banner */}
      {(wasBlocked || wasPartial) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-3 rounded-2xl border px-5 py-4 ${
            wasBlocked
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-blue-500/10 border-blue-500/30 text-blue-300"
          }`}
        >
          <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="text-sm leading-relaxed">
            {wasBlocked
              ? "This site blocked direct access — analysis was generated using URL signals and platform context. Results are still highly useful as improvement guidance."
              : "Only partial metadata was extracted from this page. Some fields may be estimated. Full results shown below."}
          </div>
        </motion.div>
      )}

      {/* Score + Platform Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-primary/20 bg-primary/5">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreGauge score={result.listingScore} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium uppercase tracking-wider">Listing Score</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              Your listing scored <strong className="text-white">{result.listingScore}/100</strong>
              {result.listingScore < 85
                ? " — below the top-performing threshold of 85. The AI improvements below can increase visibility, engagement, and conversion significantly."
                : " — this is a strong listing. The suggestions below can push it even further."}
            </p>
            <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs text-white/40">Platform detected:</span>
              <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                {result.platform}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Original vs Improved Titles */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ResultCard
          title="Original Title"
          content={<span className="text-white/60 line-through decoration-white/30 text-sm">{result.originalTitle}</span>}
          copyText={result.originalTitle}
        />
        <ResultCard
          title="Improved Title"
          highlight
          content={<span className="text-white font-semibold">{result.improvedTitle}</span>}
          copyText={result.improvedTitle}
        />
      </div>

      {/* Detected Image */}
      {result.detectedImage ? (
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-display font-semibold text-white/90">Detected Main Image</h3>
            <span className="text-xs text-white/40 bg-white/5 border border-white/10 px-3 py-1 rounded-full">From og:image</span>
          </div>
          <div className="rounded-xl overflow-hidden aspect-video bg-black/40">
            <img
              src={result.detectedImage}
              alt="Detected listing image"
              className="w-full h-full object-cover opacity-85"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <p className="text-xs text-white/40 mt-2">
            Tip: High-resolution hero images (min. 1920×1080px) can boost click-through rates by up to 40%.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-white/30" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/60">No main image detected</p>
            <p className="text-xs text-white/40 mt-1">
              This page did not expose an og:image tag. Adding a high-quality hero image can significantly improve click-through rates.
            </p>
          </div>
        </div>
      )}

      {/* Original Description */}
      <ResultCard
        title="Original Description"
        content={
          <span className="text-white/50 text-sm italic leading-relaxed">
            {result.originalDescription.slice(0, 400)}
            {result.originalDescription.length > 400 ? "..." : ""}
          </span>
        }
        copyText={result.originalDescription}
      />

      {/* Improved Description */}
      <ResultCard
        title="Improved Description"
        highlight
        content={result.improvedDescription}
        copyText={result.improvedDescription}
      />

      {/* Pricing Suggestion */}
      <ResultCard
        title="Pricing Suggestion"
        content={result.pricingSuggestion}
        copyText={result.pricingSuggestion}
      />

      {/* SEO Keywords */}
      <ResultCard
        title="SEO Keywords"
        copyText={result.seoKeywords.join(", ")}
        content={
          <div className="flex flex-wrap gap-2">
            {result.seoKeywords.map((kw, i) => (
              <span key={i} className="inline-block px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-primary/90">
                {kw}
              </span>
            ))}
          </div>
        }
      />
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function OptimizeForm() {
  const [result, setResult] = useState<AnalyzeListingResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<OptimizeFormValues>({
    resolver: zodResolver(optimizeSchema),
    defaultValues: { listingUrl: "", platform: "", notes: "" },
  });

  const mutation = useAnalyzeListing({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
        setApiError(null);
      },
      onError: (err: any) => {
        console.error("Analyze API error:", err);
        setApiError(
          err?.message || "Could not reach the analysis service. Please check the URL and try again."
        );
      },
    },
  });

  const onSubmit = (data: OptimizeFormValues) => {
    setResult(null);
    setApiError(null);
    mutation.mutate({
      data: {
        url: data.listingUrl,
        platform: data.platform || undefined,
        notes: data.notes || undefined,
      },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

      {/* ── Form Column ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-5"
      >
        <div className="glass-panel rounded-3xl p-6 md:p-8">
          <div className="mb-6 pb-6 border-b border-white/10">
            <h3 className="text-xl font-display font-semibold text-white">Listing Analysis</h3>
            <p className="text-sm text-white/50 mt-1">Paste a listing URL to get AI-powered improvements</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <div className="space-y-2">
              <Label htmlFor="listingUrl" className="text-white/80">Listing URL</Label>
              <div className="relative group">
                <Link2 className="absolute left-3 top-3.5 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
                <Input
                  id="listingUrl"
                  placeholder="https://www.zillow.com/homedetails/..."
                  className="pl-10 h-12 bg-black/40 border-white/10 focus:border-primary text-white placeholder:text-white/30 rounded-xl"
                  {...form.register("listingUrl")}
                />
              </div>
              {form.formState.errors.listingUrl && (
                <p className="text-destructive text-sm">{form.formState.errors.listingUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-white/80">Platform <span className="text-white/40 text-sm">(Optional)</span></Label>
              <Controller
                name="platform"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-12 bg-black/40 border-white/10 text-white focus:ring-primary rounded-xl">
                      <SelectValue placeholder="Auto-detect from URL" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1C] border-white/10 text-white">
                      {["Zillow", "Airbnb", "Realtor.com", "Booking.com", "Bayut", "PropertyFinder", "Other"].map((p) => (
                        <SelectItem key={p} value={p} className="hover:bg-white/10 focus:bg-primary/20 focus:text-primary cursor-pointer">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white/80">Notes <span className="text-white/40 text-sm">(Optional)</span></Label>
              <Textarea
                id="notes"
                placeholder="e.g. Target luxury buyers, emphasize sea view, increase nightly rate..."
                className="min-h-[100px] bg-black/40 border-white/10 focus:border-primary text-white placeholder:text-white/30 rounded-xl resize-none"
                {...form.register("notes")}
              />
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black shadow-[0_0_30px_-5px_rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_-5px_rgba(212,175,55,0.6)] transition-all duration-300 hover:scale-[1.02] border-0 rounded-xl"
            >
              {mutation.isPending ? (
                <><Loader2 className="mr-3 h-5 w-5 animate-spin" />Analyzing Listing...</>
              ) : (
                <><Search className="mr-3 h-5 w-5" />Analyze Listing</>
              )}
            </Button>
          </form>
        </div>
      </motion.div>

      {/* ── Results Column ── */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-7 flex flex-col"
      >
        <AnimatePresence mode="wait">
          {mutation.isPending ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-8 glass-panel rounded-3xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
              <div className="w-24 h-24 mb-8 relative">
                <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary animate-spin" style={{ animationDuration: "1.5s" }} />
                <div className="absolute inset-2 rounded-full border-b-2 border-l-2 border-amber-200/50 animate-spin" style={{ animationDirection: "reverse", animationDuration: "2s" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-display font-semibold text-white mb-3">Analyzing Your Listing</h3>
              <p className="text-white/50 max-w-sm">
                Fetching page content, extracting metadata, scoring performance, and generating AI-powered improvements...
              </p>
            </motion.div>
          ) : apiError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 glass-panel rounded-3xl border border-destructive/30"
            >
              <div className="w-16 h-16 mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-display font-semibold text-white mb-2">Analysis Failed</h3>
              <p className="text-white/50 max-w-sm mb-6">{apiError}</p>
              <Button
                variant="outline"
                onClick={() => { setApiError(null); setResult(null); }}
                className="border-white/20 text-white/80 hover:bg-white/10"
              >
                Try Again
              </Button>
            </motion.div>
          ) : result ? (
            <ResultsPanel result={result} />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 glass-panel rounded-3xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
              <div className="w-20 h-20 mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="text-2xl font-display font-semibold text-white mb-3 relative z-10">Ready to Analyze</h3>
              <p className="text-white/40 max-w-sm relative z-10 font-light">
                Paste any Zillow, Airbnb, Bayut, PropertyFinder, or property listing URL and we'll extract its content and generate AI-powered improvements.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
