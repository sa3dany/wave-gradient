import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head>
        <style>{`
          html, body, #__next {
            height: 100%;
          }
        `}</style>
      </Head>
      <body className="bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
