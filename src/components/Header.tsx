import { motion } from "framer-motion";
import { Sparkles, Shirt } from "lucide-react";

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-8 md:py-12"
    >
      {/* Logo and Brand Name */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="flex items-center justify-center gap-3 mb-6"
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <Shirt className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-accent-foreground" />
          </div>
        </div>
        <span className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Style<span className="text-primary">Finder</span>
        </span>
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
      >
        <Sparkles className="w-4 h-4" />
        <span className="text-sm font-medium">Busca visual com IA</span>
      </motion.div>

      <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
        Encontre sua roupa
        <span className="block text-primary">nas lojas perto de você</span>
      </h1>

      <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
        Tire uma foto ou envie uma imagem da roupa desejada e descubra onde 
        encontrar peças similares nas lojas da sua região
      </p>
    </motion.header>
  );
};
