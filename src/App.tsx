import "./styles/App.css";
import "./styles/index.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthProvider from "./components/Auth/AuthProvider";
import MainLayout from "./layout/MainLayout";
import { useAuth } from "./lib/session";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Experience from "./pages/Experience";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Skills from "./pages/Skills";

/** Nothing but the login screen until someone logs in or picks "Login as a Guest". */
const Site = () => {
  const { session } = useAuth();
  if (!session) return <Login />;
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <AuthProvider>
    <Site />
  </AuthProvider>
);

export default App;
