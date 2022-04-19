import Head from "next/head";
import { GithubIcon } from "../components/icons";

export default function Layout({ children }) {
  return (
    <div className="mx-auto h-full px-5">
      <Head>
        <title>Wave Gradients</title>
      </Head>

      <nav
        className="
          container mx-auto
          flex items-center justify-between pt-5
          text-white"
      >
        {/* Logo */}
        <header className="select-none mix-blend-overlay">
          <h1
            className="
              font-display text-3xl font-bold
              uppercase leading-none tracking-wider
              lg:text-4xl"
          >
            Wave Gradients
          </h1>
        </header>

        {/* Github repo link */}
        <a
          href="https://github.com/sa3dany/wave-gradients"
          className="
            mix-blend-overlay
            hover:mix-blend-normal
            focus:mix-blend-normal"
        >
          <span className="sr-only">GitHub repo</span>
          <GithubIcon className="h-8 w-8 lg:h-10 lg:w-10" />
        </a>
      </nav>

      {/* Page contents goes here */}
      {children}
    </div>
  );
}
