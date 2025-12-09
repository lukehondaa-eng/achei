import { motion } from "framer-motion";
import { StoreCard } from "./StoreCard";
import { Loader2, Store, ShoppingBag } from "lucide-react";

interface SearchResultsProps {
  isLoading: boolean;
  results: Array<{
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
  }>;
}

export const SearchResults = ({ isLoading, results }: SearchResultsProps) => {
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
            Identificando tipo, cor e estilo
          </p>
        </div>
      </motion.div>
    );
  }

  if (results.length === 0) {
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
            A IA vai analisar e buscar produtos similares à venda
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
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="font-display text-2xl font-semibold text-foreground">
              {results.length} produtos encontrados
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Produtos reais à venda com base na sua imagem
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((store, index) => (
          <StoreCard key={store.id} store={store} index={index} />
        ))}
      </div>
    </motion.div>
  );
};
