import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { NetworkingProvider } from "./contexts/NetworkingContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
	<NetworkingProvider>
		<App />
	</NetworkingProvider>
);
