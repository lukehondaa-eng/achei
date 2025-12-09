import { motion } from "framer-motion";
import { Sparkles, Shirt, Palette, Tag } from "lucide-react";

interface AnalysisResultProps {
  analysis: {
    type: string;
    color: string;
    style: string;
    material?: string;
    details?: string;
  };
}

export const AnalysisResult = ({ analysis }: AnalysisResultProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-6 shadow-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-display font-semibold text-lg text-foreground">
          Análise da IA
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <Shirt className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Tipo</p>
            <p className="text-sm font-medium text-foreground capitalize">{analysis.type}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Palette className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Cor</p>
            <p className="text-sm font-medium text-foreground capitalize">{analysis.color}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Tag className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Estilo</p>
            <p className="text-sm font-medium text-foreground capitalize">{analysis.style}</p>
          </div>
        </div>
      </div>

      {analysis.details && (
        <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
          {analysis.details}
        </p>
      )}
    </motion.div>
  );
};
