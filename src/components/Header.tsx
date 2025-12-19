import { useState } from "react";
import { motion } from "framer-motion";
import { UserMenu } from "./UserMenu";
import { SearchHistory } from "./SearchHistory";
import { WelcomeModal } from "./WelcomeModal";

export const Header = () => {
  const [showWelcome, setShowWelcome] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="py-8 md:py-12"
    >
      {/* Top bar with user menu */}
      <div className="flex justify-end gap-2 mb-4">
        <SearchHistory onLoginClick={() => setShowWelcome(true)} />
        <UserMenu />
      </div>
      <WelcomeModal open={showWelcome} onOpenChange={setShowWelcome} />

      {/* Brand Name */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="flex items-center justify-center gap-2 mb-6"
      >
        <span className="font-display text-6xl md:text-7xl lg:text-8xl font-bold text-primary drop-shadow-lg">
          achei
        </span>
      </motion.div>

      <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground leading-tight text-center">
        Encontre sua roupa
        <span className="block text-primary">nas lojas perto de você</span>
      </h1>

      <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-balance text-center">
        Tire uma foto ou envie uma imagem da roupa desejada e descubra onde 
        encontrar peças similares nas lojas da sua região
      </p>
    </motion.header>
  );
};
