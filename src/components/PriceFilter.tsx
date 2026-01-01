import { useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

interface PriceFilterProps {
  minPrice: number | null;
  maxPrice: number | null;
  onFilterChange: (min: number | null, max: number | null) => void;
}

export const PriceFilter = ({ minPrice, maxPrice, onFilterChange }: PriceFilterProps) => {
  const [localMin, setLocalMin] = useState<string>(minPrice?.toString() || "");
  const [localMax, setLocalMax] = useState<string>(maxPrice?.toString() || "");
  const [open, setOpen] = useState(false);

  const hasActiveFilter = minPrice !== null || maxPrice !== null;

  const handleApply = () => {
    const min = localMin ? parseFloat(localMin) : null;
    const max = localMax ? parseFloat(localMax) : null;
    onFilterChange(min, max);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalMin("");
    setLocalMax("");
    onFilterChange(null, null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasActiveFilter ? "default" : "outline"}
          size="sm"
          className="gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Preço</span>
          {hasActiveFilter && (
            <span className="text-xs bg-primary-foreground/20 px-1.5 py-0.5 rounded">
              {minPrice && maxPrice
                ? `R$${minPrice}-${maxPrice}`
                : minPrice
                ? `+R$${minPrice}`
                : `até R$${maxPrice}`}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Filtrar por preço</h4>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="minPrice" className="text-xs text-muted-foreground">
                Mínimo (R$)
              </Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="0"
                value={localMin}
                onChange={(e) => setLocalMin(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">
                Máximo (R$)
              </Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="999"
                value={localMax}
                onChange={(e) => setLocalMax(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleApply} className="flex-1">
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
