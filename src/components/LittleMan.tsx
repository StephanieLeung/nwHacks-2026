import littleman from '../assets/lilman.svg'
import pull from '../assets/pull.gif'
import hold_box from '../assets/hold_box.svg'
import luggage from '../assets/luggage.svg'
import { Popover, PopoverContent } from './ui/popover'
import { EllipsisVertical } from 'lucide-react'
import { PopoverPortal, PopoverTrigger } from '@radix-ui/react-popover'
import { useState } from 'react'

export function LittleMan() {
    const gitActionMap = [
        { name: 'Commit', image: littleman },
        { name: 'Push', image: littleman },
        { name: 'Pull', image: pull },
        { name: 'Stash', image: luggage },
        { name: 'Unstash', image: hold_box },

    ]
    const [ litleMan, setLittleMan ] = useState<any>(littleman);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    return (
        <div className='grid grid-rows-1 grid-cols-2'>
            <img 
                src={litleMan} 
                alt={litleMan} 
                className={'w-12 h-12'} 
            />
        
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger className='justify-self-start self-start'>
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
                                    }}
                                >
                                    {action.name}
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </PopoverPortal>
            </Popover>
        </div>
    )
}