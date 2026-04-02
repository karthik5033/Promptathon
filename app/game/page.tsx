import dynamic from 'next/dynamic';

const GameCanvas = dynamic(() => import('@/components/game/GameCanvas'), { 
  ssr: false, 
});

export default function GamePage() {
  return <GameCanvas />;
}
