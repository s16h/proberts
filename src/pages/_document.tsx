import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en" className="antialiased">
        <Head />
        <body className="bg-gray-50 text-gray-900 dark:bg-dark-900 dark:text-white">
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const savedTheme = localStorage.getItem('theme');
                    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                      document.documentElement.classList.add('dark');
                    }
                  } catch (e) {}
                })()
              `,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;