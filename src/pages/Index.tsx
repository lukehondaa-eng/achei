import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { ImageUploader } from "@/components/ImageUploader";
import { SearchResults } from "@/components/SearchResults";
import { AnalysisResult } from "@/components/AnalysisResult";
import { ApiKeySetup } from "@/components/ApiKeySetup";
import { WelcomeModal } from "@/components/WelcomeModal";
import { MapPin, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ClothingAnalysis {
  type: string;
  color: string;
  style: string;
  material?: string;
  details?: string;
  searchQuery: string;
}

interface Product {
  id: string;
  name: string;
  productImage: string;
  productName: string;
  priceRange: string;
  distance: string;
  address: string;
  onlineLink: string;
  similarity: number;
}

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [analysis, setAnalysis] = useState<ClothingAnalysis | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const { toast } = useToast();
  const { user, isGuest, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && !isGuest) {
      setShowWelcome(true);
    }
  }, [user, isGuest, loading]);

  const handleImageUpload = useCallback(async (file: File, preview: string) => {
    setUploadedImage(preview);
    setIsLoading(true);
    setResults([]);
    setAnalysis(null);
    setNeedsApiKey(false);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-clothing', {
        body: { 
          imageBase64: preview,
          location: "São Paulo, Brazil"
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        setError(data.error);
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
      }

      if (data.needsApiKey) {
        setNeedsApiKey(true);
        toast({
          title: "Configuração necessária",
          description: "Para buscar produtos reais, configure a chave da SerpAPI.",
        });
      }

      if (data.products && data.products.length > 0) {
        setResults(data.products);
        toast({
          title: "Sucesso!",
          description: `Encontramos ${data.products.length} produtos similares.`,
        });
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Falha ao analisar imagem. Tente novamente.");
      toast({
        title: "Erro",
        description: "Falha ao analisar imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleRetry = useCallback(() => {
    if (uploadedImage) {
      // Re-trigger the search with the same image
      setIsLoading(true);
      setResults([]);
      setError(null);
      
      supabase.functions.invoke('analyze-clothing', {
        body: { 
          imageBase64: uploadedImage,
          location: "São Paulo, Brazil"
        }
      }).then(({ data, error }) => {
        if (error || data.error) {
          setError(data?.error || "Falha ao analisar imagem. Tente novamente.");
          toast({
            title: "Erro",
            description: data?.error || "Falha ao analisar imagem.",
            variant: "destructive",
          });
        } else {
          if (data.analysis) setAnalysis(data.analysis);
          if (data.products?.length > 0) {
            setResults(data.products);
            toast({
              title: "Sucesso!",
              description: `Encontramos ${data.products.length} produtos similares.`,
            });
          }
        }
      }).finally(() => setIsLoading(false));
    }
  }, [uploadedImage, toast]);

  const handleClear = useCallback(() => {
    setUploadedImage(null);
    setResults([]);
    setAnalysis(null);
    setNeedsApiKey(false);
    setError(null);
    setIsLoading(false);
  }, []);

  return (
    <div className="min-h-screen gradient-hero">
      <WelcomeModal open={showWelcome} onOpenChange={setShowWelcome} />
      
      <div className="container max-w-6xl mx-auto px-4 pb-16">
        <Header />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8"
        >
          <MapPin className="w-4 h-4 text-primary" />
          <span>Buscando em São Paulo, SP</span>
          <button className="text-primary hover:underline underline-offset-2">
            Alterar
          </button>
        </motion.div>

        <div className="max-w-xl mx-auto mb-8">
          <ImageUploader
            onImageUpload={handleImageUpload}
            uploadedImage={uploadedImage}
            onClear={handleClear}
          />
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </motion.div>
        )}

        {analysis && (
          <div className="max-w-xl mx-auto mb-8">
            <AnalysisResult analysis={analysis} />
          </div>
        )}

        {needsApiKey && (
          <div className="max-w-xl mx-auto mb-8">
            <ApiKeySetup />
          </div>
        )}

        <SearchResults isLoading={isLoading} results={results} onRetry={handleRetry} />
      </div>

      <footer className="border-t border-border py-8 mt-auto">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            Desenvolvido com ❤️ para facilitar suas compras
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
