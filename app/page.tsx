import { Chat } from '../components/Chat';
import { liveEnabled } from '../lib/chat-request';
import { listFixtures } from '../lib/fixtures';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <Chat liveEnabled={liveEnabled()} fixtures={listFixtures()} />;
}
