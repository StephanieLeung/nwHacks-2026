import littleman from '../assets/lilman.svg'
import pull from '../assets/pull.gif'
import hold_box from '../assets/hold_box.svg'
import luggage from '../assets/luggage.svg'
import { Popover, PopoverContent } from './ui/popover'
import { EllipsisVertical } from 'lucide-react'
import { PopoverPortal, PopoverTrigger } from '@radix-ui/react-popover'
import { useState } from 'react'

export interface LittleManProps {
  x?: number
  y?: number
  characterState?: 'idle' | 'working' | 'dirty'
  onActionSelect?: (action: string) => void
}

export function LittleMan({ x, y, characterState = 'idle', onActionSelect }: LittleManProps) {
    const gitActionMap = [
        { name: 'Commit', image: littleman },
        { name: 'Push', image: littleman },
        { name: 'Pull', image: pull },
        { name: 'Stash', image: luggage },
        { name: 'Unstash', image: hold_box },
    ]
    
    const stateImageMap = {
      idle: littleman,
      working: pull,
      dirty: luggage
    }
    
    const [ litleMan, setLittleMan ] = useState<any>(stateImageMap[characterState]);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // If positioned (x, y provided), render as inline element positioned absolutely
    if (x !== undefined && y !== undefined) {
      return (
        <div style={{ position: 'absolute', left: `${x}px`, top: `${y}px`, pointerEvents: 'none' }}>
          <img 
            src={litleMan} 
            alt="littleman" 
            className='w-12 h-12' 
          />
        </div>
      )
    }

    // Otherwise render as standalone component with menu
    return (
        <div className='grid grid-rows-1 grid-cols-2'>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger className='justify-self-end self-start'>
                    <button className='w-5 h-5 rounded-2xl border-1 border-zinc-800 shadow-md hover:bg-zinc-100 flex justify-center items-center'>
                        <EllipsisVertical size={15} color='black'/>
                    </button>
                </PopoverTrigger>
                <PopoverPortal>
                    <PopoverContent className='z-50 bg-white shadow-md w-50 p-2'>
                        <div className='space-y-1 cursor-default'>
                            {gitActionMap.map(action => 
                                <div 
                                    key={action.name} 
                                    className='px-2 py-1 rounded-md hover:bg-zinc-100'
                                    onClick={() => {
                                        setLittleMan(action.image);
                                        setIsPopoverOpen(false);
                                        onActionSelect?.(action.name);
                                    }}
                                >
                                    {action.name}
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </PopoverPortal>
            </Popover>
            
            <img 
                src={litleMan} 
                alt="littleman" 
                className='w-12 h-12' 
            />
        </div>
    )
}