import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";
import Home from "./pages/home";
import AnimeList from "./pages/anime-list";
import AnimeDetail from "./pages/anime-detail";
import Watch from "./pages/watch";
import Schedule from "./pages/schedule";
import Community from "./pages/community";
import { MyProfile, PublicProfile } from "./pages/profile";
import Settings from "./pages/settings";
import Login from "./pages/login";
import NotFound from "./pages/not-found";

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/anime" component={AnimeList} />
        <Route path="/anime/:slug" component={AnimeDetail} />
        <Route path="/watch/:slug/:ep" component={Watch} />
        <Route path="/jadwal" component={Schedule} />
        <Route path="/komunitas" component={Community} />
        <Route path="/profil" component={MyProfile} />
        <Route path="/u/:username" component={PublicProfile} />
        <Route path="/pengaturan" component={Settings} />
        <Route path="/login" component={Login} />
        <Route component={NotFound} />
      </Switch>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      <div className="hidden md:block">
        <RunableBadge />
      </div>
    </Provider>
  );
}

export default App;
