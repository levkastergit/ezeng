import manifestJson from '../data/img-manifest.json';

const files = manifestJson as Record<string, string>;

interface Props {
  img?: string;
  size?: number;
  className?: string;
  /** Shown when the word has no illustration, e.g. the first letter. */
  fallback?: string;
}

/** Illustration for a word: a bundled Twemoji SVG picked per word in the course data. */
export function WordImage({ img, size = 96, className = '', fallback = '' }: Props) {
  const file = img ? files[img] : undefined;
  return (
    <div className={`word-img ${className}`.trim()} style={{ width: size, height: size }}>
      {file ? (
        <img src={`${import.meta.env.BASE_URL}img/${file}`} alt="" draggable={false} />
      ) : (
        <span className="word-img-fallback" style={{ fontSize: size * 0.4 }}>
          {fallback}
        </span>
      )}
    </div>
  );
}
