import {
  SpacemanThemeProvider,
  ThemeAnimationType,
} from '@space-man/react-theme-animation'
import { useEffect, useState } from 'react'

const setCookie = (name, value, days = 365) => {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

export default function AppLayout({ children }) {
  const [initialTheme, setInitialTheme] = useState('system');

  useEffect(() => {
    const savedAppearance = localStorage.getItem('appearance') || 'system';
    setInitialTheme(savedAppearance);
  }, []);

  return (
    <SpacemanThemeProvider
      defaultTheme={initialTheme}
      defaultColorTheme="blue"
      themes={['light', 'dark', 'system']}
      colorThemes={['default', 'blue', 'green', 'purple', 'red']}
      animationType={ThemeAnimationType.BLUR_CIRCLE}
      blurAmount={10}
      duration={1000}
      onThemeChange={theme => {
        console.log('Global theme changed:', theme)
        localStorage.setItem('appearance', theme);
        setCookie('appearance', theme);
      }}
      onColorThemeChange={colorTheme => {
        console.log('Global color theme changed:', colorTheme)
      }}
    >
      {children}
    </SpacemanThemeProvider>
  )
}