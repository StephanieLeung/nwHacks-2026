import littleman from '../assets/lilman.svg'
import pull from '../assets/pull.gif'
import hold_box from '../assets/hold_box.svg'
import luggage from '../assets/luggage.svg'
import { Popover, PopoverContent } from './ui/popover'
import { EllipsisVertical } from 'lucide-react'
import { PopoverPortal, PopoverTrigger } from '@radix-ui/react-popover'
import { useState, useEffect } from 'react'
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { useTerminal } from '../context/TerminalContext'
import { useGit } from '../context/GitContext'  

export interface LittleManProps {
  x?: number
  y?: number
  // characterState?: 'idle' | 'working' | 'dirty'
}

export function LittleMan({ x, y }: LittleManProps) {
  const gitActionMap = [
    { name: 'Commit', image: littleman },
    { name: 'Push', image: littleman },
    { name: 'Pull', image: pull },
    { name: 'Stash', image: luggage },
    { name: 'Unstash', image: hold_box },
  ];

  const stateImageMap = {
    idle: littleman,
    working: pull,
    dirty: hold_box,
    stashed: luggage,
  };

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  // const [showCommitInput, setShowCommitInput] = useState(false);
  const { setCommand } = useTerminal();
  const { handleGitAction, characterState, animationState, showCommitInput } = useGit();
  const [litleMan, setLittleMan] = useState<any>(stateImageMap[characterState]);

  useEffect(() => {
    if (animationState !== 'none') {
      setLittleMan(pull);
    } else {
      setLittleMan(stateImageMap[characterState]);
    }
  }, [characterState, animationState])

  // If positioned (x, y provided), render as inline element positioned absolutely
  if (x !== undefined && y !== undefined) {
    return (
      <div style={{ position: 'absolute', left: `${x}px`, top: `${y}px`, pointerEvents: 'none' }}>
        <img src={litleMan} alt="littleman" className="w-12 h-12" />
      </div>
    );
  }

  // Otherwise render as standalone component with menu
  return (
    <div className="relative grid grid-rows-1 grid-cols-2">
        <img src={litleMan} alt="littleman" className="w-12 h-12" />

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}
      >
        <PopoverTrigger asChild>
          <div className="justify-self-start self-start">
            <button className="w-5 h-5 rounded-2xl border-1 border-zinc-800 shadow-md hover:bg-zinc-100 flex justify-center items-center">
              <EllipsisVertical size={15} color="black" />
            </button>
          </div>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent className="z-50 bg-white shadow-md w-50 p-2">
            <div className="space-y-1 cursor-default">
              {gitActionMap.map(action => {
                if (action.name === 'Commit') 
                    return (
                        <Accordion type="single" collapsible>
                            <AccordionItem 
                                value={action.name}
                                className="px-2 py-1 m-0 rounded-md hover:bg-zinc-100"

                            >
                                <AccordionTrigger>{action.name}</AccordionTrigger>
                                <AccordionContent>
                                    <Input
                                        value={commitMessage}
                                        onChange={e => setCommitMessage(e.target.value)}
                                        placeholder="Enter commit message"
                                        className="mb-2 mt-2"
                                    />
                                    <div className="flex space-x-2">
                                        <button
                                        onClick={() => {
                                          handleGitAction(action.name, commitMessage);
                                          setCommitMessage('');
                                        }}
                                        className="px-3 py-1.5 text-xs font-semibold text-sm text-purple-700 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border-2 border-purple-200 rounded-full shadow-sm"
                                        >
                                        Commit
                                        </button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )
                return (<div
                  key={action.name}
                  className="px-2 py-1 rounded-md hover:bg-zinc-100"
                  onClick={() => {
                    handleGitAction(action.name);
                    setIsPopoverOpen(false);
                  }}
                >
                  {action.name}
                </div>)
                })}
            </div>
          </PopoverContent>
        </PopoverPortal>
      </Popover>
      </div>
  );
}