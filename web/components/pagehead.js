export default function PageHeader({ children, className }) {
  return (
    <header className={`font-bold leading-none tracking-wider ${className}`}>
      <h1 className="max-w-fit select-none rounded-b-3xl bg-gray-900 px-6 py-6 font-display text-3xl uppercase text-white dark:bg-gray-50 dark:text-black sm:text-5xl">
        {children}
      </h1>
    </header>
  );
}
