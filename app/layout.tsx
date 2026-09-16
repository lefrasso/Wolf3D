import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "WOLF3D — Castle Escape", description: "Una reinterpretación jugable del FPS clásico: tres niveles, secretos y combate en una fortaleza en HD.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body>{children}</body></html>; }
