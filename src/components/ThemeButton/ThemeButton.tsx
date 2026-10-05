import { Button } from "@maxhub/max-ui";
import { texts } from "@/app/texts";
import { useTheme } from "@/app/theme";
import { MoonIcon, SunIcon } from "@/components/Icons";

export function ThemeButton({ stretched = false }: { stretched?: boolean }) {
    const { theme, toggleTheme } = useTheme();
    const light = theme === "light";

    return (
        <Button
            type="button"
            variant="secondary"
            size="small"
            stretched={stretched}
            aria-pressed={light}
            iconBefore={light ? <MoonIcon /> : <SunIcon />}
            onClick={toggleTheme}
        >
            {light ? texts.app.darkTheme : texts.app.lightTheme}
        </Button>
    );
}
