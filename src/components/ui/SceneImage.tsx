import { useEffect, useRef, useState } from "react";
import { SCENES, type Scene } from "../../lib/scenes";

export function SceneImage({
  scene,
  className = "",
  kenburns = false,
  children,
}: {
  scene: Scene;
  className?: string;
  kenburns?: boolean;
  children?: React.ReactNode;
}) {
  const meta = SCENES[scene];
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) setFailed(true);
  }, [meta.src]);
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${meta.tone} to-zinc-800 ${className}`}>
      <img
          ref={imageRef}
          // The remote source is the verified production-safe image. The
          // bundled local asset remains in the registry for offline-capable
          // Git-based deployments where binary uploads are preserved.
          src={meta.fallbackSrc}
          alt={meta.alt}
          onError={() => setFailed(true)}
          loading="lazy"
          className={`h-full w-full object-cover ${kenburns ? "animate-kenburns" : ""}`}
        />
      {/* scrim keeps overlaid text readable */}
      <div className={`absolute inset-0 bg-gradient-to-t ${meta.tone} via-transparent`} />
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}
