import { Switch } from "@headlessui/react";
import { PauseIcon, PlayIcon, WireframeIcon } from "./icons";

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
            {play ? <PlayIcon /> : <PauseIcon />}
          </Switch>
        </Switch.Group>
      </section>

      <section className="max-w-fit rounded-3xl border-4 border-gray-900 p-4 dark:border-white sm:p-6">
        {/* Wireframe toggle */}
        <Switch.Group className="flex select-none space-x-3" as="div">
          <Switch.Label className="font-bold uppercase">
            <WireframeIcon />
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
