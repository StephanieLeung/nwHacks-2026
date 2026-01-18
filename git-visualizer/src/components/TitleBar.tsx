import {FolderGit2} from 'lucide-react'

export function TitleBar() {
    return (
        <div className="bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 px-4 py-3 flex items-center justify-between [app-region:drag]">
            <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-purple-700" />
            <span className="text-sm text-purple-800 font-semibold">✨ git visualizer</span>
            </div>
            <div className="flex items-center gap-2">
            <button className="w-3 h-3 rounded-full bg-yellow-300 hover:bg-yellow-400 shadow-sm"></button>
            <button className="w-3 h-3 rounded-full bg-green-300 hover:bg-green-400 shadow-sm"></button>
            <button className="w-3 h-3 rounded-full bg-pink-300 hover:bg-pink-400 shadow-sm"></button>
            </div>
        </div>
    )
}