import { Switch } from "@headlessui/react";

export default function Controls({ useWireframe }) {
  const [wireframe, onToggleWireframe] = useWireframe();

  return (
    <section className="max-w-fit rounded-3xl border-4 border-gray-900 p-6 dark:border-white">
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
  );
}
