import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Sparkles, ImagePlus, MapPin, Loader2, Wand2, TrendingUp } from "lucide-react";
import { useGenerateListing, type GenerateListingResponse } from "@workspace/api-client-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ResultCard } from "@/components/ResultCard";
import { OptimizeForm } from "@/components/OptimizeForm";

type ActiveTab = "generate" | "optimize";

const formSchema = z.object({
  location: z.string().min(2, "Location is required"),
  propertyType: z.string().min(2, "Property type is required"),
  listingPurpose: z.enum(["sale", "rent"]),
  bedrooms: z.coerce.number().min(0, "Invalid number").max(50),
  bathrooms: z.coerce.number().min(0, "Invalid number").max(50),
  sizeSqft: z.coerce.number().min(10, "Minimum 10 sqft"),
  amenities: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("generate");
  const [resultData, setResultData] = useState<GenerateListingResponse | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: "",
      propertyType: "Apartment",
      listingPurpose: "sale",
      bedrooms: 2,
      bathrooms: 2,
      sizeSqft: 1500,
      amenities: "",
    },
  });

  const mutation = useGenerateListing({
    mutation: {
      onSuccess: (res) => {
        setResultData(res);
        toast({ title: "Listing Generated", description: "Your AI-powered listing is ready." });
      },
      onError: (err) => {
        console.error("API Error", err);
        const data = form.getValues();
        setResultData(getMockData(data));
        toast({
          title: "Using Demo Data",
          description: "Showing mock results for demonstration.",
          variant: "destructive",
        });
      },
    },
  });

  const onSubmit = (data: FormValues) => {
    setResultData(null);
    mutation.mutate({ data: data as any });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };


  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: "generate", label: "Generate Listing", icon: <Wand2 className="w-4 h-4" /> },
    { id: "optimize", label: "Optimize Listing", icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden font-sans pb-24">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src={`${import.meta.env.BASE_URL}images/luxury-bg.png`}
          alt=""
          className="w-full h-full object-cover opacity-[0.15]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* ── Top Nav ── */}
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#FFF5C3] flex items-center justify-center shadow-[0_0_24px_rgba(212,175,55,0.35)]">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span className="text-lg font-display font-bold tracking-widest uppercase text-white/90">
              ListingPilot
            </span>
          </div>

          {/* Tab Switch */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "text-black"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="tab-bg"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] shadow-[0_0_20px_-4px_rgba(212,175,55,0.5)]"
                      transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </motion.nav>

        {/* ── Hero ── */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-10 text-center lg:text-left"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-5 leading-[1.1]">
                Generate and Optimize <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#FFF5C3] to-[#D4AF37]">
                  Real Estate Listings with AI
                </span>
              </h2>
              <p className="text-lg text-white/55 max-w-2xl mx-auto lg:mx-0 font-light">
                Create new listings in seconds or improve existing Zillow, Airbnb, and property listing pages with AI-powered suggestions.
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.header>

        {/* ── Section Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === "generate" ? (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.35 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                {/* Form Column */}
                <div className="lg:col-span-5">
                  <div className="glass-panel rounded-3xl p-6 md:p-8">
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <h3 className="text-xl font-display font-semibold text-white">Property Details</h3>
                      <p className="text-sm text-white/50 mt-1">Enter the specifics to generate your listing</p>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-white/80">Location</Label>
                        <div className="relative group">
                          <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-white/40 group-focus-within:text-primary transition-colors" />
                          <Input
                            id="location"
                            placeholder="e.g. Dubai Marina, UAE or Miami Beach, FL"
                            className="pl-10 h-12 bg-black/40 border-white/10 focus:border-primary text-white placeholder:text-white/30 rounded-xl"
                            {...form.register("location")}
                          />
                        </div>
                        {form.formState.errors.location && (
                          <p className="text-destructive text-sm">{form.formState.errors.location.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-white/80">Property Type</Label>
                          <Controller
                            name="propertyType"
                            control={form.control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="h-12 bg-black/40 border-white/10 text-white focus:ring-primary rounded-xl">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1A1A1C] border-white/10 text-white">
                                  {["Apartment", "Villa", "Penthouse", "Townhouse", "Studio", "Office", "Land"].map((type) => (
                                    <SelectItem key={type} value={type} className="hover:bg-white/10 focus:bg-primary/20 focus:text-primary cursor-pointer">{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white/80">Purpose</Label>
                          <Controller
                            name="listingPurpose"
                            control={form.control}
                            render={({ field }) => (
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex h-12 items-center space-x-4 bg-black/40 border border-white/10 rounded-xl px-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="sale" id="sale" className="border-white/30 text-primary" />
                                  <Label htmlFor="sale" className="text-white/80 cursor-pointer font-normal">Sale</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="rent" id="rent" className="border-white/30 text-primary" />
                                  <Label htmlFor="rent" className="text-white/80 cursor-pointer font-normal">Rent</Label>
                                </div>
                              </RadioGroup>
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bedrooms" className="text-white/80">Beds</Label>
                          <Input id="bedrooms" type="number" min="0" className="h-12 bg-black/40 border-white/10 focus:border-primary text-white rounded-xl text-center" {...form.register("bedrooms")} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bathrooms" className="text-white/80">Baths</Label>
                          <Input id="bathrooms" type="number" min="0" step="0.5" className="h-12 bg-black/40 border-white/10 focus:border-primary text-white rounded-xl text-center" {...form.register("bathrooms")} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sizeSqft" className="text-white/80">Size (sqft)</Label>
                          <Input id="sizeSqft" type="number" min="10" className="h-12 bg-black/40 border-white/10 focus:border-primary text-white rounded-xl text-center" {...form.register("sizeSqft")} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amenities" className="text-white/80">Key Amenities</Label>
                        <Textarea
                          id="amenities"
                          placeholder="e.g. Infinity Pool, Private Gym, Concierge, Sea View..."
                          className="min-h-[100px] bg-black/40 border-white/10 focus:border-primary text-white placeholder:text-white/30 rounded-xl resize-none"
                          {...form.register("amenities")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white/80">Property Photo <span className="text-white/40 text-sm">(Optional)</span></Label>
                        <div className="border-2 border-dashed border-white/10 hover:border-primary/50 transition-all duration-300 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-black/40 relative overflow-hidden group">
                          <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handlePhotoChange} />
                          {photoPreview ? (
                            <div className="absolute inset-0 w-full h-full">
                              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white font-medium flex items-center bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                                  <ImagePlus className="w-4 h-4 mr-2" /> Replace
                                </p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                                <ImagePlus className="w-5 h-5 text-white/60 group-hover:text-primary transition-colors" />
                              </div>
                              <p className="text-white/80 font-medium mb-1">Click to upload image</p>
                              <p className="text-white/40 text-sm">Visuals help inspire the AI</p>
                            </>
                          )}
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-black shadow-[0_0_30px_-5px_rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_-5px_rgba(212,175,55,0.6)] transition-all duration-300 hover:scale-[1.02] border-0 rounded-xl"
                      >
                        {mutation.isPending ? (
                          <><Loader2 className="mr-3 h-5 w-5 animate-spin" />Generating Magic...</>
                        ) : (
                          <><Sparkles className="mr-3 h-5 w-5" />Generate Listing</>
                        )}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Results Column */}
                <div className="lg:col-span-7 flex flex-col">
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
                            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                          </div>
                        </div>
                        <h3 className="text-2xl font-display font-semibold text-white mb-3">AI is analyzing your property</h3>
                        <p className="text-white/50 max-w-sm">Crafting the perfect narrative, estimating market value, and optimizing for maximum engagement...</p>
                      </motion.div>
                    ) : resultData ? (
                      <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <ResultCard
                            title="Estimated Sale Price"
                            highlight
                            copyText={resultData.priceRange.formatted}
                            content={
                              <div>
                                <div className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                                  {resultData.priceRange.formatted}
                                </div>
                                <div className="mt-1 text-xs font-mono text-primary/70 uppercase tracking-widest">{resultData.priceRange.currency}</div>
                              </div>
                            }
                          />
                          <ResultCard
                            title="Estimated Monthly Rent"
                            highlight
                            copyText={resultData.rentRange.formatted}
                            content={
                              <div>
                                <div className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
                                  {resultData.rentRange.formatted}
                                </div>
                                <div className="mt-1 text-xs font-mono text-primary/70 uppercase tracking-widest">{resultData.rentRange.currency}</div>
                              </div>
                            }
                          />
                        </div>

                        <ResultCard title="SEO Optimized Title" content={<span className="text-lg font-semibold text-white/90">{resultData.title}</span>} />
                        <ResultCard title="Professional Description" content={resultData.description} />

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          <ResultCard title="Instagram Caption" content={resultData.instagramCaption} />
                          <ResultCard
                            title="Trending Hashtags"
                            copyText={resultData.hashtags.join(" ")}
                            content={
                              <div className="flex flex-wrap gap-2">
                                {resultData.hashtags.map((tag, i) => (
                                  <span key={i} className="inline-block px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-primary/90">{tag}</span>
                                ))}
                              </div>
                            }
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 glass-panel rounded-3xl relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                        <div className="w-20 h-20 mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-white/40" />
                        </div>
                        <h3 className="text-2xl font-display font-semibold text-white mb-3 relative z-10">AI Awaits Your Details</h3>
                        <p className="text-white/40 max-w-sm relative z-10 font-light">
                          Complete the form on the left and click Generate to create a luxurious, highly-converting listing tailored to your property.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </motion.div>
          ) : (
            <motion.div
              key="optimize"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.35 }}
            >
              <OptimizeForm />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// Mock Data Generator for fallback
const getMockData = (input: any): GenerateListingResponse => {
  const type = input.propertyType || "Property";
  const loc = input.location || "Prime Location";
  const size = input.sizeSqft || 1500;
  return {
    title: `Exquisite ${type} in ${loc} with Unmatched Elegance`,
    description: `Welcome to this extraordinary ${type} located in the highly sought-after enclave of ${loc}. Featuring ${input.bedrooms} spacious bedrooms and ${input.bathrooms} immaculate bathrooms, this ${size} sqft residence offers a perfect blend of modern luxury and timeless comfort.\n\n${input.amenities ? `Residents will enjoy access to world-class amenities including: ${input.amenities}. ` : ""}Floor-to-ceiling windows bathe the open-concept living spaces in natural light, showcasing premium finishes throughout. Don't miss this rare opportunity to elevate your lifestyle.`,
    instagramCaption: `✨ A new standard of luxury just hit the market! ✨\n\nStep inside this breathtaking ${type} in ${loc}. From the incredible finishes to the unbeatable location, this is the one you've been waiting for.\n\n🛏️ ${input.bedrooms} Bedrooms\n🛁 ${input.bathrooms} Bathrooms\n📐 ${size} SqFt\n\nTap the link in our bio for the full tour or DM to schedule a private viewing! 🗝️🥂`,
    hashtags: ["#LuxuryRealEstate", "#DreamHome", `#${type.replace(/\s+/g, "")}`, "#HouseHunting", "#InvestmentProperty", "#LuxuryLiving", "#Architecture", "#InteriorDesign", "#ExclusiveListing", "#RealEstateGoals"],
    priceRange: { min: size * 850, max: size * 1100, currency: "USD", formatted: `$${(size * 850 / 1000).toFixed(0)}K USD – $${(size * 1100 / 1000).toFixed(0)}K USD` },
    rentRange: { min: size * 4.5, max: size * 6, currency: "USD", period: "monthly", formatted: `$${(size * 4.5).toFixed(0)} USD/month – $${(size * 6).toFixed(0)} USD/month` },
  };
};
