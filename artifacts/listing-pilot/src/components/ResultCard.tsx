import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ResultCardProps {
  title: string;
  content: React.ReactNode;
  copyText?: string;
  highlight?: boolean;
}

export function ResultCard({ title, content, copyText, highlight = false }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    let textToCopy = copyText || "";
    if (!textToCopy && typeof content === "string") {
      textToCopy = content;
    }
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 ${
      highlight 
        ? 'border-primary/40 shadow-[0_0_30px_-15px_rgba(212,175,55,0.3)] bg-primary/5' 
        : 'bg-black/40 backdrop-blur-xl border-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-black/50'
    }`}>
      <CardContent className="p-5 md:p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className={`font-display font-semibold text-xl ${highlight ? 'text-primary' : 'text-white/90'}`}>
            {title}
          </h3>
          <button
            onClick={handleCopy}
            className="text-muted-foreground hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 active:scale-95"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-white/80 leading-relaxed text-[15px] whitespace-pre-wrap">
          {content}
        </div>
      </CardContent>
    </Card>
  );
}
