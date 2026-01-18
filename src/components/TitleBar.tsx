import {FolderGit2, Minus, X} from 'lucide-react'

export function TitleBar() {
    return (
        <div className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 px-4 py-3 flex items-center justify-between [app-region:drag]">
            <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-purple-700" />
            <span className="text-sm text-purple-800 font-semibold">✨ git visualizer</span>
            </div>
            <div className="flex items-center gap-2 text-purple-800 [app-region:no-drag]">
                <button 
                    onClick={window.windowControls.minimize}
                    className="w-3 h-3 rounded-full bg-yellow-300 hover:bg-yellow-400 shadow-sm flex justify-center items-center"
                >
                    <Minus size={8} />
                </button>
                <button 
                    onClick={window.windowControls.close}
                    className="w-3 h-3 rounded-full bg-pink-300 hover:bg-pink-400 shadow-sm flex justify-center items-center"
                >
                    <X size={8} />
                </button>
            </div>
        </div>
    )
}