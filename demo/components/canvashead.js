export default function CanvasHeader({ children }) {
  return (
    <header className="absolute top-6 left-6 z-10 font-bold mix-blend-exclusion">
      <h2 className="select-none text-xl text-white md:text-3xl">{children}</h2>
    </header>
  );
}
