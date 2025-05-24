'use client';
import { useTheme } from '@/contexts/ThemeContext';

// Define color mappings based on the provided image
const themeColorMap = {
  light: {
    '--background': '#FFFFFF', // white
    '--foreground': '#333333', // dark grey
    '--card': '#FBFBFB', // cards bg
    '--card-foreground': '#333333', // dark grey
    '--popover': '#FFFFFF', // white
    '--popover-foreground': '#333333', // dark grey
    '--primary': '#601E8D', // primary
    '--primary-foreground': '#FFFFFF', // white
    '--secondary': '#E9E9E9', // cards bg 2
    '--secondary-foreground': '#333333', // dark grey
    '--muted': '#646464', // light text
    '--muted-foreground': '#DFDFDF', // stroke
    '--accent': '#DFD2E8', // primary light
    '--accent-foreground': '#333333', // dark grey
    '--destructive': '#EF4444', // using a standard red
    '--border': '#DFDFDF', // stroke
    '--input': '#F6F6F6', // input fields
    '--ring': '#B1B1B1', // primary stroke
    '--rating': '#FFD000', // rating
    '--chips-bg': '#F4F4F4', // chips bg
    '--day-mode-icon-bg': '#FFFFFF', // day-mode icon bg (assuming this is for the light theme)
  },
  dark: {
    '--background': '#000000', // black
    '--foreground': '#FFFFFF', // white
    '--card': '#333333', // dark grey
    '--card-foreground': '#FFFFFF', // white
    '--popover': '#333333', // dark grey
    '--popover-foreground': '#FFFFFF', // white
    '--primary': '#DFD2E8', // primary light (inverted for contrast)
    '--primary-foreground': '#333333', // dark grey (inverted for contrast)
    '--secondary': '#646464', // light text (inverted for contrast)
    '--secondary-foreground': '#FFFFFF', // white (inverted for contrast)
    '--muted': '#333333', // dark grey (inverted for contrast)
    '--muted-foreground': '#DFDFDF', // stroke (inverted for contrast)
    '--accent': '#601E8D', // primary (inverted for contrast)
    '--accent-foreground': '#FFFFFF', // white (inverted for contrast)
    '--destructive': '#DC2626', // a darker red
    '--border': '#646464', // light text (inverted for contrast)
    '--input': '#646464', // light text (inverted for contrast)
    '--ring': '#DFDFDF', // stroke (inverted for contrast)
    '--rating': '#FFD000', // rating
    '--chips-bg': '#333333', // dark grey (inverted for contrast)
     '--day-mode-icon-bg': '#333333', // day-mode icon bg
  },
};

export default function ThemeColorsDisplay() {
  const { theme } = useTheme();

  // Get the current theme's colors
  const currentThemeColors = themeColorMap[theme] || themeColorMap.light; // Default to light if theme is undefined

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Current Theme Colors ({theme})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(currentThemeColors).map(([variable, value]) => (
            <div key={variable} className="p-4 rounded-md shadow-md bg-card text-card-foreground">
              <div
                className="w-full h-16 rounded-md mb-2 border border-gray-200"
                style={{ backgroundColor: value }}
              ></div>
              <p className="text-sm font-medium">{variable}</p>
              <p className="text-xs text-muted-foreground">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
