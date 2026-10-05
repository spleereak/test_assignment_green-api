import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import { Providers } from "@/app/providers";
import "@maxhub/max-ui/dist/styles.css";
import "@/app/app.css";

const root = document.getElementById("root");
if (!root) throw new Error("Не найден корневой элемент");

createRoot(root).render(
    <StrictMode>
        <Providers>
            <App />
        </Providers>
    </StrictMode>,
);
