import littleman from '../assets/lilman.svg'
import pull from '../assets/pull.gif'
import hold_box from '../assets/hold_box.svg'
import luggage from '../assets/luggage.svg'
import { Popover, PopoverContent } from './ui/popover'
import { EllipsisVertical } from 'lucide-react'
import { PopoverPortal, PopoverTrigger } from '@radix-ui/react-popover'
import { useState, useEffect } from 'react'
import { Input } from './ui/input';

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
  ];

  const stateImageMap = {
    idle: littleman,
    working: pull,
    dirty: luggage,
  };

  const [litleMan, setLittleMan] = useState<any>(stateImageMap[characterState]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [showCommitInput, setShowCommitInput] = useState(false);

  const handleGitAction = (action: string) => {
    switch (action) {
      case 'Commit':
        setShowCommitInput(true);
        break;
      case 'Push':
        window.API.git.run('push origin HEAD')
          .then(response => console.log('Push successful:', response))
          .catch(error => console.error('Push failed:', error));
        break;
      case 'Pull':
        window.API.git.run('pull')
          .then(response => console.log('Pull successful:', response))
          .catch(error => console.error('Pull failed:', error));
        break;
      case 'Stash':
        window.API.git.run('stash')
          .then(response => console.log('Stash successful:', response))
          .catch(error => console.error('Stash failed:', error));
        break;
      case 'Unstash':
        window.API.git.run('stash pop')
          .then(response => console.log('Unstash successful:', response))
          .catch(error => console.error('Unstash failed:', error));
        break;
      default:
        console.error('Unknown action:', action);
    }
  };

  const handleCommit = () => {
    if (commitMessage.trim()) {
      window.API.git.run(`commit -m "${commitMessage}"`)
        .then(response => {
          console.log('Commit successful:', response);
          setShowCommitInput(false);
          setCommitMessage('');
        })
        .catch(error => console.error('Commit failed:', error));
    } else {
      console.error('Commit message cannot be empty');
    }
  };

  useEffect(() => {
    // Poll the git:hasChanges endpoint every 5 seconds
    const intervalId = setInterval(() => {
      window.API.git.hasChanges()
        .then(response => {
          if (response.hasChanges) {
            setLittleMan(hold_box);
          } else {
            // Revert to the default state based on characterState
            setLittleMan(stateImageMap[characterState]);
          }
        })
        .catch(error => {
          console.error('Error calling git:hasChanges:', error);
        });
    }, 5000); // 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [characterState]);

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
    <div className="grid grid-rows-1 grid-cols-2">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger className="justify-self-end self-start">
          <button className="w-5 h-5 rounded-2xl border-1 border-zinc-800 shadow-md hover:bg-zinc-100 flex justify-center items-center">
            <EllipsisVertical size={15} color="black" />
          </button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent className="z-50 bg-white shadow-md w-50 p-2">
            <div className="space-y-1 cursor-default">
              {gitActionMap.map(action => (
                <div
                  key={action.name}
                  className="px-2 py-1 rounded-md hover:bg-zinc-100"
                  onClick={() => {
                    handleGitAction(action.name);
                    setIsPopoverOpen(false);
                  }}
                >
                  {action.name}
                </div>
              ))}
            </div>
          </PopoverContent>
        </PopoverPortal>
      </Popover>

      {showCommitInput && (
        <div className="flex flex-col items-center">
          <Input
            value={commitMessage}
            onChange={e => setCommitMessage(e.target.value)}
            placeholder="Enter commit message"
            className="mb-2"
          />
          <button
            onClick={handleCommit}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Commit
          </button>
        </div>
      )}

      <img src={litleMan} alt="littleman" className="w-12 h-12" />
    </div>
  );
}