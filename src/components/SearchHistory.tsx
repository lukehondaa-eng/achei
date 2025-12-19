import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { History, Trash2, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SearchHistoryItem {
  id: string;
  clothing_type: string | null;
  clothing_color: string | null;
  clothing_style: string | null;
  results_count: number | null;
  created_at: string;
}

interface SearchHistoryProps {
  onLoginClick?: () => void;
}

export function SearchHistory({ onLoginClick }: SearchHistoryProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('id, clothing_type, clothing_color, clothing_style, results_count, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchHistory();
    }
  }, [isOpen, user]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Busca removida do histórico');
    } catch (err) {
      console.error('Error deleting:', err);
      toast.error('Erro ao remover busca');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">Histórico</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[90vw] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Buscas
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {!user ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <LogIn className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-2">Faça login para ver</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Para ver o histórico de buscas, faça o login
              </p>
              <Button onClick={() => { setIsOpen(false); onLoginClick?.(); }}>
                Fazer Login
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-2">Nenhuma busca ainda</h3>
              <p className="text-muted-foreground text-sm">
                Suas buscas aparecerão aqui
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-140px)]">
              <div className="space-y-3 pr-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group relative p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.clothing_type || 'Roupa'} {item.clothing_color || ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.clothing_style && `${item.clothing_style} • `}
                          {item.results_count ? `${item.results_count} resultados` : 'Sem resultados'}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(new Date(item.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
