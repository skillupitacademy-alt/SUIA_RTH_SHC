"use client";

import { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

import { useBrand } from "../../brand";
import { getAnalyticsRuntimeConfig } from "../../config/analytics";
import { trackPageView } from "../../lib/analytics/tracker";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function GTMProviderInner() {
  const brand = useBrand();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const config = getAnalyticsRuntimeConfig({ brandId: brand.id });

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    trackPageView(brand.id, url, typeof document !== "undefined" ? document.title : undefined);
  }, [brand.id, pathname, searchParams]);

  if (!config.enabled) {
    return null;
  }

  return (
    <>
      {config.brand.gtmContainerId ? (
        <>
          <Script
            id="analytics-datalayer-bootstrap"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: "window.dataLayer = window.dataLayer || [];",
            }}
          />
          <Script
            id="analytics-gtm"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${config.brand.gtmContainerId}');
              `,
            }}
          />
        </>
      ) : null}

      {config.brand.ga4MeasurementId ? (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${config.brand.ga4MeasurementId}`}
          />
          <Script
            id="analytics-ga4"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${config.brand.ga4MeasurementId}', {
                  send_page_view: false
                });
              `,
            }}
          />
        </>
      ) : null}

      {config.brand.metaPixelId ? (
        <Script
          id="analytics-meta-pixel"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
              (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${config.brand.metaPixelId}');
            `,
          }}
        />
      ) : null}

      {config.brand.hotjarSiteId ? (
        <Script
          id="analytics-hotjar"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(h,o,t,j,a,r){
                  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                  h._hjSettings={hjid:${config.brand.hotjarSiteId},hjsv:6};
                  a=o.getElementsByTagName('head')[0];
                  r=o.createElement('script');r.async=1;
                  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                  a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `,
          }}
        />
      ) : null}

      {config.brand.linkedInPartnerId ? (
        <Script
          id="analytics-linkedin"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              _linkedin_partner_id = "${config.brand.linkedInPartnerId}";
              window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
              window._linkedin_data_partner_ids.push(_linkedin_partner_id);
              (function(l) {
                if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
                window.lintrk.q=[]}
                var s = document.getElementsByTagName("script")[0];
                var b = document.createElement("script");
                b.type = "text/javascript";b.async = true;
                b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
                s.parentNode.insertBefore(b, s);
              })(window.lintrk);
            `,
          }}
        />
      ) : null}
    </>
  );
}

export function GTMProvider() {
  return (
    <Suspense fallback={null}>
      <GTMProviderInner />
    </Suspense>
  );
}
