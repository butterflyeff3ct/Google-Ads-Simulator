'use client';

import { SessionProvider } from 'next-auth/react';
import MenuBar from '../components/MenuBar';
import ActivityTracker from '../components/ActivityTracker';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ActivityTracker>
        <MenuBar />
        <main className="pt-16">{children}</main>
      </ActivityTracker>
    </SessionProvider>
  );
}
