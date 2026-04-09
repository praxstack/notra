"use client";

import Script from "next/script";

const pixelId = process.env.NEXT_PUBLIC_X_PIXEL_ID;
const ALPHANUMERIC = /^[a-z0-9]+$/i;

export function XPixel() {
  if (!pixelId || !ALPHANUMERIC.test(pixelId)) {
    return null;
  }

  return (
    <>
      <Script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Ads
        dangerouslySetInnerHTML={{
          __html: `!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');`,
        }}
        id="x-pixel-base"
        strategy="afterInteractive"
      />
      <Script id="x-pixel-config" strategy="afterInteractive">
        {`twq('config',${JSON.stringify(pixelId)})`}
      </Script>
    </>
  );
}
