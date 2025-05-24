// components/ThemeScript.jsx
import Script from 'next/script';

export function ThemeScript() {
  return (
    <Script id="theme-script" strategy="beforeInteractive">
      {`
        (function() {
          const savedTheme = localStorage.getItem('theme');
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

          if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.classList.add('dark');
          }
        })();
      `}
    </Script>
  );
}
