import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProgressContext } from './lib/progressContext';
import type { Progress } from './lib/storage';
import { loadProgress, saveProgress } from './lib/storage';
import { dueWords, streakDays } from './lib/srs';
import { Sidebar } from './components/Sidebar';
import type { NavName } from './components/Sidebar';
import { Home } from './screens/Home';
import { LessonScreen } from './screens/LessonScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { Dictionary } from './screens/Dictionary';
import { Profile } from './screens/Profile';
import { SettingsScreen } from './screens/Settings';
import { SoundsScreen } from './screens/SoundsScreen';
import { TwistersScreen } from './screens/TwistersScreen';
import { SongsScreen } from './screens/SongsScreen';
import { TalesScreen } from './screens/TalesScreen';
import { TestScreen } from './screens/TestScreen';

type Screen = { name: NavName } | { name: 'lesson'; lessonId: string };

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const update = useCallback((fn: (p: Progress) => Progress) => setProgress((p) => fn(p)), []);
  const ctx = useMemo(() => ({ progress, update }), [progress, update]);

  const inLesson = screen.name === 'lesson';
  const dueCount = dueWords(progress.words, Date.now()).length;

  return (
    <ProgressContext.Provider value={ctx}>
      <div className={'app' + (inLesson ? ' app-session' : '')}>
        {!inLesson && (
          <Sidebar
            current={screen.name as NavName}
            onNavigate={(name) => setScreen({ name })}
            dueCount={dueCount}
            streak={streakDays(progress.days)}
            xp={progress.xp}
          />
        )}
        <div className="content">
          {screen.name === 'home' && (
            <Home onOpenLesson={(id) => setScreen({ name: 'lesson', lessonId: id })} onReview={() => setScreen({ name: 'review' })} />
          )}
          {screen.name === 'lesson' && <LessonScreen key={screen.lessonId} lessonId={screen.lessonId} onExit={() => setScreen({ name: 'home' })} />}
          {screen.name === 'review' && <ReviewScreen onGoHome={() => setScreen({ name: 'home' })} />}
          {screen.name === 'dictionary' && <Dictionary />}
          {screen.name === 'sounds' && <SoundsScreen />}
          {screen.name === 'twisters' && <TwistersScreen />}
          {screen.name === 'songs' && <SongsScreen />}
          {screen.name === 'tales' && <TalesScreen />}
          {screen.name === 'test' && <TestScreen />}
          {screen.name === 'profile' && <Profile />}
          {screen.name === 'settings' && <SettingsScreen />}
        </div>
      </div>
    </ProgressContext.Provider>
  );
}
