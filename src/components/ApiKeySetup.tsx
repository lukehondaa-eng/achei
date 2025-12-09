import { motion } from "framer-motion";
import { Key, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ApiKeySetup = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-secondary/50 rounded-2xl p-6 border border-border"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Key className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-display font-semibold text-lg text-foreground mb-2">
            Configure a busca de produtos reais
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Para buscar produtos reais à venda em lojas, você precisa configurar uma chave da 
            <strong> SerpAPI</strong> (Google Shopping API). A IA já analisou sua roupa, 
            mas precisa dessa integração para encontrar produtos similares.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => window.open('https://serpapi.com/', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Obter chave SerpAPI
            </Button>
            <p className="text-xs text-muted-foreground self-center">
              Plano gratuito disponível com 100 buscas/mês
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
