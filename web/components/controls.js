import { Switch } from "@headlessui/react";

export default function Controls({ useWireframe, usePlay }) {
  const [wireframe, onToggleWireframe] = useWireframe();
  const [play, onTogglePlay] = usePlay();

  return (
    <div className="flex space-x-3">
      <section className="max-w-fit rounded-3xl border-4 border-gray-900 p-4 dark:border-white sm:p-6">
        {/* Play/Pause */}
        <Switch.Group className="flex select-none space-x-3" as="div">
          <Switch checked={play} onChange={onTogglePlay}>
            <span className="sr-only">Play / Pause animation</span>
            {play ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 320 512"
                className="h-6 w-6"
                fill="currentColor"
              >
                <path d="M272 63.1l-32 0c-26.51 0-48 21.49-48 47.1v288c0 26.51 21.49 48 48 48L272 448c26.51 0 48-21.49 48-48v-288C320 85.49 298.5 63.1 272 63.1zM80 63.1l-32 0c-26.51 0-48 21.49-48 48v288C0 426.5 21.49 448 48 448l32 0c26.51 0 48-21.49 48-48v-288C128 85.49 106.5 63.1 80 63.1z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 384 512"
                className="h-6 w-6"
                fill="currentColor"
              >
                <path d="M361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215z" />
              </svg>
            )}
          </Switch>
        </Switch.Group>
      </section>

      <section className="max-w-fit rounded-3xl border-4 border-gray-900 p-4 dark:border-white sm:p-6">
        {/* Wireframe toggle */}
        <Switch.Group className="flex select-none space-x-3" as="div">
          <Switch.Label className="font-bold uppercase">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className="h-6 w-6"
              fill="currentColor"
            >
              <path d="M448 32C483.3 32 512 60.65 512 96V416C512 451.3 483.3 480 448 480H64C28.65 480 0 451.3 0 416V96C0 60.65 28.65 32 64 32H448zM152 96H64V160H152V96zM208 160H296V96H208V160zM448 96H360V160H448V96zM64 288H152V224H64V288zM296 224H208V288H296V224zM360 288H448V224H360V288zM152 352H64V416H152V352zM208 416H296V352H208V416zM448 352H360V416H448V352z" />
            </svg>
          </Switch.Label>
          <Switch
            checked={wireframe}
            onChange={onToggleWireframe}
            className={`${
              wireframe ? "bg-red-600" : "bg-black dark:bg-white"
            } relative inline-flex h-6 w-11 items-center rounded-full`}
          >
            <span className="sr-only">Enable wireframe render mode</span>
            <span
              className={`${
                wireframe ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black`}
            />
          </Switch>
        </Switch.Group>
      </section>
    </div>
  );
}
