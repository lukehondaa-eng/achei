import { motion } from "framer-motion";

export const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-8 md:py-12"
    >
      {/* Brand Name */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="flex items-center justify-center gap-2 mb-6"
      >
        <span className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Style<span className="text-primary">Finder</span>
        </span>
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
