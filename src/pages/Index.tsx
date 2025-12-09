import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { ImageUploader } from "@/components/ImageUploader";
import { SearchResults } from "@/components/SearchResults";
import { mockStores } from "@/data/mockStores";
import { MapPin } from "lucide-react";

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<typeof mockStores>([]);

  const handleImageUpload = useCallback((file: File, preview: string) => {
    setUploadedImage(preview);
    setIsLoading(true);
    setResults([]);

    // Simulate API call for image analysis
    setTimeout(() => {
      setIsLoading(false);
      setResults(mockStores);
    }, 2500);
  }, []);

  const handleClear = useCallback(() => {
    setUploadedImage(null);
    setResults([]);
    setIsLoading(false);
  }, []);

  return (
    <div className="min-h-screen gradient-hero">
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

        <div className="max-w-xl mx-auto mb-12">
          <ImageUploader
            onImageUpload={handleImageUpload}
            uploadedImage={uploadedImage}
            onClear={handleClear}
          />
        </div>

        <SearchResults isLoading={isLoading} results={results} />
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
