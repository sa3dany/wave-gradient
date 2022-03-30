export default function PageHeader({ children, className }) {
  return (
    <header className={`font-bold leading-none tracking-wider ${className}`}>
      <h1 className="flex h-full max-w-fit select-none items-end rounded-b-3xl bg-gray-900 p-4 font-display text-3xl uppercase text-white dark:bg-gray-50 dark:text-black sm:p-6 sm:text-5xl">
        {children}
      </h1>
    </header>
  );
}
