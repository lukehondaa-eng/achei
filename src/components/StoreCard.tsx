import { motion } from "framer-motion";
import { MapPin, ExternalLink, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StoreCardProps {
  store: {
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
  };
  index: number;
}

export const StoreCard = ({ store, index }: StoreCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300"
    >
      <div className="relative">
        <img
          src={store.productImage}
          alt={store.productName}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge className="absolute top-3 right-3 bg-background/90 text-foreground hover:bg-background">
          {store.similarity}% similar
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground line-clamp-1">
            {store.productName}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{store.name}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xl font-semibold text-primary font-body">
            {store.priceRange}
          </span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Navigation className="w-4 h-4" />
            <span>{store.distance}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{store.address}</span>
        </div>

        <div className="flex gap-3 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl h-10 text-sm font-medium border-border hover:bg-secondary hover:border-primary/30 transition-all"
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`, '_blank')}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Ver no mapa
          </Button>
          <a
            href={store.onlineLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button
              size="sm"
              className="w-full rounded-xl h-10 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Comprar
            </Button>
          </a>
        </div>
      </div>
    </motion.div>
  );
};
