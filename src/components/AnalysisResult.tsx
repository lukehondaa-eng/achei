import { motion } from "framer-motion";
import { Sparkles, Shirt, Palette, Tag, Award } from "lucide-react";

interface AnalysisResultProps {
  analysis: {
    type: string;
    color: string;
    style: string;
    brand?: string | null;
    material?: string;
    pattern?: string;
    details?: string;
  };
}

export const AnalysisResult = ({ analysis }: AnalysisResultProps) => {
  const hasBrand = analysis.brand && analysis.brand !== "null" && analysis.brand !== null;
  
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

      {hasBrand && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-primary font-medium uppercase tracking-wide">Marca Identificada</p>
              <p className="text-lg font-display font-bold text-foreground">{analysis.brand}</p>
            </div>
          </div>
        </motion.div>
      )}

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

      {analysis.pattern && analysis.pattern !== 'liso' && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Padrão:</span> {analysis.pattern}
          </p>
        </div>
      )}

      {analysis.details && (
        <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
          {analysis.details}
        </p>
      )}
    </motion.div>
  );
};
