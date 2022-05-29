import Head from "next/head";
import { GithubIcon } from "../components/icons";

export default function Layout({ children }) {
  return (
    <div className="mx-auto h-full px-5">
      <Head>
        <title>Wave Gradients</title>
      </Head>

      <div className="absolute inset-x-0">
        <nav
          className="
          container mx-auto
          flex items-center justify-between px-5 pt-5
          text-white"
        >
          {/* Logo */}
          <header className="select-none mix-blend-overlay">
            <h1
              className="
              text-3xl font-semibold
              leading-none tracking-normal"
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
      </div>

      {/* Page contents goes here */}
      {children}
    </div>
  );
}
