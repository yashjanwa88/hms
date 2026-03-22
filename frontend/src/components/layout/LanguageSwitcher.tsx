import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1">
        <Button
          variant={i18n.language === 'en' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage('en')}
          className="px-2 py-1 h-auto text-xs"
        >
          EN
        </Button>
        <Button
          variant={i18n.language === 'hi' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage('hi')}
          className="px-2 py-1 h-auto text-xs"
        >
          हिन्दी
        </Button>
        <Button
          variant={i18n.language === 'ar' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage('ar')}
          className="px-2 py-1 h-auto text-xs"
        >
          العربية
        </Button>
      </div>
    </div>
  );
}
