import Head from "next/head";
import { GithubIcon } from "../components/icons";

export default function Layout({ children }) {
  return (
    <div className="relative mx-auto h-full px-5">
      <Head>
        <title>Wave Gradients</title>
      </Head>

      {/* Navigation */}
      <nav className="container relative z-10 mx-auto flex items-center justify-between pt-5 text-white mix-blend-overlay">
        {/* Logo */}
        <header className="select-none">
          <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-wider lg:text-4xl">
            Wave Gradients
          </h1>
        </header>
        {/* Github repo link */}
        <a href="https://github.com/sa3dany/wave-gradients">
          <span className="sr-only">GitHub repo</span>
          <GithubIcon className="h-8 w-8 lg:h-10 lg:w-10" />
        </a>
      </nav>

      {/* Page */}
      {children}
    </div>
  );
}
