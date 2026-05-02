import { useState } from 'react';
import { BlogManagement } from './BlogManagement';
import { BlogEditor } from './BlogEditor';

type Mode = { kind: 'list' } | { kind: 'new' } | { kind: 'edit'; id: string };

export function BlogModule() {
  const [mode, setMode] = useState<Mode>({ kind: 'list' });

  if (mode.kind === 'new') return <BlogEditor onBack={() => setMode({ kind: 'list' })} />;
  if (mode.kind === 'edit') return <BlogEditor postId={mode.id} onBack={() => setMode({ kind: 'list' })} />;
  return (
    <BlogManagement
      onNew={() => setMode({ kind: 'new' })}
      onEdit={(id) => setMode({ kind: 'edit', id })}
    />
  );
}
