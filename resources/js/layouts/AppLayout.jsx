import {
  SpacemanThemeProvider,
  ThemeAnimationType,
} from '@space-man/react-theme-animation'

export default function AppLayout({ children }) {
  return (
    <SpacemanThemeProvider
      defaultTheme="system"
      defaultColorTheme="blue"
      themes={['light', 'dark', 'system']}
      colorThemes={['default', 'blue', 'green', 'purple', 'red']}
      animationType={ThemeAnimationType.BLUR_CIRCLE}
      blurAmount={10}
      duration={1000}
      onThemeChange={theme => {
        console.log('Global theme changed:', theme)
      }}
      onColorThemeChange={colorTheme => {
        console.log('Global color theme changed:', colorTheme)
      }}
    >
      {children}
    </SpacemanThemeProvider>
  )
}