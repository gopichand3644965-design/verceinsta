import { useState, useEffect } from 'react';
import { getImageUrl } from '../api';

export default function SmartImg({ src, alt = '', className = '', placeholder = '/assets/products/default.jpg', retryDelay = 300, ...rest }) {
  const [retryKey, setRetryKey] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Reset when src changes
    setRetryKey(null);
    setFailed(false);
  }, [src]);

  if (!src) {
    return <img src={getImageUrl(placeholder)} alt={alt} className={className} loading="lazy" decoding="async" {...rest} />;
  }

  const fullUrl = getImageUrl(src) + (retryKey ? `?r=${retryKey}` : '');

  return (
    <img
      src={failed ? getImageUrl(placeholder) : fullUrl}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        if (!retryKey) {
          // retry once
          console.warn(`[SmartImg] failed to load ${src}, retrying once`);
          setTimeout(() => setRetryKey(Date.now()), retryDelay);
        } else {
          console.error(`[SmartImg] failed to load ${src} after retry, showing placeholder`);
          setFailed(true);
        }
      }}
      {...rest}
    />
  );
}
