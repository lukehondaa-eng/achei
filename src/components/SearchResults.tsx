import { motion } from "framer-motion";
import { StoreCard } from "./StoreCard";
import { Loader2, Store, ShoppingBag, RefreshCw, CheckCircle2, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface Product {
  id: string;
  name: string;
  image?: string;
  productImage: string;
  productName: string;
  priceRange: string;
  distance: string;
  address: string;
  onlineLink: string;
  similarity: number;
  isExact?: boolean;
}

interface SearchResultsProps {
  isLoading: boolean;
  exactProducts?: Product[];
  similarProducts?: Product[];
  results?: Product[]; // Legacy support
  message?: string | null;
  onRetry?: () => void;
}

export const SearchResults = ({ 
  isLoading, 
  exactProducts = [], 
  similarProducts = [], 
  results = [],
  message,
  onRetry 
}: SearchResultsProps) => {
  // Legacy support: if results is provided but not exactProducts/similarProducts
  const hasLegacyResults = results.length > 0 && exactProducts.length === 0 && similarProducts.length === 0;
  const displayExact = hasLegacyResults ? [] : exactProducts;
  const displaySimilar = hasLegacyResults ? results : similarProducts;
  
  const hasExact = displayExact.length > 0;
  const hasSimilar = displaySimilar.length > 0;
  const hasAnyResults = hasExact || hasSimilar;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 gap-4"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-primary/20 -z-10"
          />
        </div>
        <div className="text-center">
          <p className="font-display text-lg text-foreground">Analisando sua roupa com IA...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Identificando marca, tipo, cor e estilo
          </p>
        </div>
      </motion.div>
    );
  }

  if (!hasAnyResults) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
          <Store className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-display text-lg text-foreground">Envie uma foto</p>
          <p className="text-sm text-muted-foreground mt-1">
            A IA vai identificar a marca e buscar produtos idênticos ou similares
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Message when no exact match found */}
      {message && !hasExact && hasSimilar && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">{message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              As opções abaixo possuem a mesma cor e modelo da sua peça.
            </p>
          </div>
        </motion.div>
      )}

      {/* Exact matches section */}
      {hasExact && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Peça Exata Encontrada!
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Encontramos a mesma marca e modelo à venda
              </p>
            </div>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refazer
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayExact.map((store, index) => (
              <StoreCard key={store.id} store={store} index={index} isExact />
            ))}
          </div>
        </div>
      )}

      {/* Similar products section */}
      {hasSimilar && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {hasExact ? "Opções Semelhantes" : `${displaySimilar.length} Produtos Semelhantes`}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Peças com mesma cor e modelo
              </p>
            </div>
            {!hasExact && onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refazer
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displaySimilar.map((store, index) => (
              <StoreCard key={store.id} store={store} index={index} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
