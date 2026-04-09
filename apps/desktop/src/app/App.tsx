import { AppShell } from "./AppShell";
import { useResumeBuilder } from "../features/state/useResumeBuilder";

export const App = () => {
  const builder = useResumeBuilder();

  return <AppShell builder={builder} />;
};
