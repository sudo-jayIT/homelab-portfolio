import { notFound } from "next/navigation";
import { SkyMotion } from "@/components/sky/SkyMotion";

/**
 * Builder preview routes (/dev/*). Never shipped: production requests 404.
 * The root layout's intro gate only runs on "/", so these pages always render
 * in classic view. SkyMotion is mounted here so parallax previews work.
 */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <>
      <SkyMotion />
      {children}
    </>
  );
}
