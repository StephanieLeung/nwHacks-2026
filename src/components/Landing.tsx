import React, { useState } from "react";
import { usePath } from "../context/PathContext";


export default function Landing() {
  const [busy, setBusy] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { setPath } = usePath();

  // Open native folder chooser (main process) and set repo path
  async function chooseRepository() {
    setBusy(true);
    setError(null);

    try {
      // Ask main to open dialog and return chosen path (or null if cancelled)
      const path = await window.API.path.select();

      if (path) {
        setSelectedPath(path);

        // Persist the path in the main process repoPath too
        await window.API.path.set(path);

        // Update App state so it switches to GitVisualizer
        setPath(path);
      } else {
        // user cancelled
        setError(null);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to Git Visualizer</h1>
      <p className="mb-6 text-center max-w-lg">
        Choose a local git repository folder to visualize its branches and commits.
      </p>

      <div className="flex gap-4">
        <button
          onClick={chooseRepository}
          disabled={busy}
          className="px-4 py-2 rounded bg-slate-800 text-white disabled:opacity-60"
        >
          {busy ? "Opening..." : "Open Repository…"}
        </button>
      </div>

      {selectedPath && (
        <p className="mt-4 text-sm break-all">Selected: {selectedPath}</p>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500">Error: {error}</p>
      )}

      <p className="mt-8 text-xs text-gray-400">
        Tip: select the top-level folder that contains the `.git` directory.
      </p>
    </div>
  );
}
