// import ThemeToggle from '@/components/ThemeToggle';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="w-full sticky top-0 z-40 bg-white/60 dark:bg-black/30 backdrop-blur-md border-b border-[hsl(var(--border))]">
      <div className="container mx-auto px-4 h-12 flex items-center justify-between">
        <Link to="/" className="font-semibold text-foreground">
          Supfit
        </Link>
        <div className="flex items-center gap-2">
          {/* ThemeToggle removed as per branding update */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
