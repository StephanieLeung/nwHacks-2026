import { Button } from './ui/button'

interface LandingProps {
  onContinue: () => void
}

export function Landing({ onContinue }: LandingProps) {
  return (
    <div className="h-screen w-full bg-[#1e1e1e] flex items-center justify-center">
      <div className="text-center space-y-8 max-w-2xl px-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-[#d4d4d4]">
            Git Visualizer
          </h1>
          <p className="text-xl text-[#858585]">
            Visualize your git repository history
          </p>
        </div>

        <div className="font-mono text-sm text-[#4ec9b0] whitespace-pre">
{`    *
    |
    *
   /|\\
  * | *
    |
    *`}
        </div>

        {/* <Button 
          onClick={onContinue}
          className="bg-[#0e639c] hover:bg-[#1177bb] text-white px-8 py-6 text-lg"
        >
          Get Started
        </Button> */}
      </div>
    </div>
  )
}