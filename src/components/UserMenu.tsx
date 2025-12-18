import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { WelcomeModal } from '@/components/WelcomeModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, LogOut, History, RefreshCw, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export function UserMenu() {
  const { user, isGuest, signOut, setIsGuest } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setIsGuest(false);
    setShowWelcome(true);
    toast.success('Logout realizado com sucesso');
  };

  const handleSwitchAccount = () => {
    setShowWelcome(true);
  };

  const handleViewHistory = () => {
    toast.info('Histórico de buscas em breve!');
  };

  const handleLogin = () => {
    setShowWelcome(true);
  };

  // Guest user - show login button
  if (isGuest && !user) {
    return (
      <>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleLogin}
          className="gap-2"
        >
          <LogIn className="w-4 h-4" />
          Entrar
        </Button>
        <WelcomeModal open={showWelcome} onOpenChange={setShowWelcome} />
      </>
    );
  }

  // Logged in user - show menu
  if (user) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline max-w-[120px] truncate">
                {user.user_metadata?.display_name || user.email?.split('@')[0]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleViewHistory} className="gap-2 cursor-pointer">
              <History className="w-4 h-4" />
              Histórico de buscas
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSwitchAccount} className="gap-2 cursor-pointer">
              <RefreshCw className="w-4 h-4" />
              Trocar de conta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive">
              <LogOut className="w-4 h-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <WelcomeModal open={showWelcome} onOpenChange={setShowWelcome} />
      </>
    );
  }

  return null;
}
