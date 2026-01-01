import { motion } from "framer-motion";
import { StoreCard } from "./StoreCard";
import { PriceFilter } from "./PriceFilter";
import { Loader2, Store, RefreshCw, CheckCircle2, Sparkles, AlertTriangle, Package } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useMemo } from "react";

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

// Parse price from string like "R$ 99,90" or "99.90"
const parsePrice = (priceStr: string): number | null => {
  if (!priceStr || priceStr === "Consulte") return null;
  const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

export const SearchResults = ({ 
  isLoading, 
  exactProducts = [], 
  similarProducts = [], 
  results = [],
  message,
  onRetry 
}: SearchResultsProps) => {
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  // Apply price filter client-side for immediate feedback
  const filterByPrice = (products: Product[]): Product[] => {
    if (minPrice === null && maxPrice === null) return products;
    
    return products.filter(product => {
      const price = parsePrice(product.priceRange);
      if (price === null) return true; // Keep products without price
      if (minPrice !== null && price < minPrice) return false;
      if (maxPrice !== null && price > maxPrice) return false;
      return true;
    });
  };

  // Legacy support: if results is provided but not exactProducts/similarProducts
  const hasLegacyResults = results.length > 0 && exactProducts.length === 0 && similarProducts.length === 0;
  
  const filteredExact = useMemo(() => filterByPrice(hasLegacyResults ? [] : exactProducts), [exactProducts, minPrice, maxPrice, hasLegacyResults]);
  const filteredSimilar = useMemo(() => filterByPrice(hasLegacyResults ? results : similarProducts), [similarProducts, results, minPrice, maxPrice, hasLegacyResults]);
  
  const hasExact = filteredExact.length > 0;
  const hasSimilar = filteredSimilar.length > 0;
  const hasAnyResults = hasExact || hasSimilar;
  const hasActiveFilter = minPrice !== null || maxPrice !== null;

  const handleFilterChange = (min: number | null, max: number | null) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

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
          <p className="font-display text-lg text-foreground">Identificando modelo exato...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Analisando marca, modelo, cor, estilo e detalhes
          </p>
        </div>
      </motion.div>
    );
  }

  if (!hasAnyResults && !hasActiveFilter && exactProducts.length === 0 && similarProducts.length === 0) {
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
            A IA vai identificar o modelo exato e buscar peças idênticas ou muito similares
          </p>
        </div>
      </motion.div>
    );
  }

  // Show message when filter removes all results
  if (!hasAnyResults && hasActiveFilter) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PriceFilter 
            minPrice={minPrice} 
            maxPrice={maxPrice} 
            onFilterChange={handleFilterChange} 
          />
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refazer
            </Button>
          )}
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-display text-lg text-foreground">Nenhum produto nesta faixa de preço</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajuste o filtro de preço para ver mais resultados
            </p>
          </div>
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
      {/* Price Filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PriceFilter 
          minPrice={minPrice} 
          maxPrice={maxPrice} 
          onFilterChange={handleFilterChange} 
        />
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refazer busca
          </Button>
        )}
      </div>

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
              Mostrando apenas peças com a mesma cor, tipo e modelo.
            </p>
          </div>
        </motion.div>
      )}

      {/* Exact matches section */}
      {hasExact && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              Modelo Exato Encontrado!
            </h2>
            <span className="text-sm text-muted-foreground">
              ({filteredExact.length} resultado{filteredExact.length !== 1 ? 's' : ''})
            </span>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Mesma marca e modelo identificados
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredExact.map((store, index) => (
              <StoreCard key={store.id} store={store} index={index} isExact />
            ))}
          </div>
        </div>
      )}

      {/* Similar products section */}
      {hasSimilar && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-semibold text-foreground">
              {hasExact ? "Opções Semelhantes" : "Produtos Muito Similares"}
            </h2>
            <span className="text-sm text-muted-foreground">
              ({filteredSimilar.length} resultado{filteredSimilar.length !== 1 ? 's' : ''})
            </span>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Mesma cor, tipo e estilo
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSimilar.map((store, index) => (
              <StoreCard key={store.id} store={store} index={index} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
