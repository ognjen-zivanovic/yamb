import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { NetworkingProvider } from "./NetworkingContext";

createRoot(document.getElementById("root")!).render(
	<NetworkingProvider>
		<App />
	</NetworkingProvider>
);
