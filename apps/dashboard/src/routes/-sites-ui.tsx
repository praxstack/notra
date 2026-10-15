import {
  type AnyRoute,
  createRoute,
  notFound,
  Outlet,
  redirect,
} from "@tanstack/react-router";

import { NewSitePageSkeleton as NewSiteLoading } from "@/app/(dashboard)/[slug]/sites/new/skeleton";
import { SitesPageSkeleton as SitesLoading } from "@/app/(dashboard)/[slug]/sites/skeleton";
import { SitesLiveProvider } from "@/components/providers/sites-live-provider";
import { SiteLayout } from "@/components/sites/site-layout";
import {
  SitePageSkeleton as SiteLoading,
  SiteSectionSkeleton as SiteSectionLoading,
  SiteDeploymentSkeleton as SiteDeploymentLoading,
} from "@/components/sites/site-page-skeleton";
import { SITE_SECTION_PAGES } from "@/constants/site-ui-pages";
import { lazyPage } from "@/utils/lazy-page";
import { sitePreviewDeploymentsHref } from "@/utils/site-links";

import { loadSitesEnabled } from "./-sites-loaders";
import { createUiRoute } from "./-ui-route";

const Sites = lazyPage(
  () => import("@/app/(dashboard)/[slug]/sites/page-client")
);
const NewSite = lazyPage(
  () => import("@/app/(dashboard)/[slug]/sites/new/page-client")
);
const Overview = lazyPage(() =>
  import("@/components/sites/pages/site-overview-page").then((module) => ({
    default: module.SiteOverviewPage,
  }))
);
const DeploymentDetail = lazyPage(() =>
  import("@/components/sites/pages/site-deployment-detail-page").then(
    (module) => ({ default: module.SiteDeploymentDetailPage })
  )
);

export function createSitesUiRoutes(organization: AnyRoute) {
  function SitesRouteLayout() {
    const { slug } = organization.useParams();
    return (
      <SitesLiveProvider organizationSlug={slug}>
        <Outlet />
      </SitesLiveProvider>
    );
  }

  const sites = createRoute({
    getParentRoute: () => organization,
    path: "sites",
    beforeLoad: async ({ params, search }) => {
      const enabled = await loadSitesEnabled({
        data: { params, searchParams: search },
      });
      if (!enabled) {
        throw notFound();
      }
    },
    component: SitesRouteLayout,
  });
  function SiteRouteLayout() {
    const { slug, siteId } = site.useParams();
    return (
      <SiteLayout organizationSlug={slug} siteId={siteId}>
        <Outlet />
      </SiteLayout>
    );
  }

  const site = createRoute({
    getParentRoute: () => sites,
    path: "$siteId",
    pendingComponent: SiteLoading,
    component: SiteRouteLayout,
  });

  const siteRoutes = [
    createRoute({
      getParentRoute: () => site,
      path: "previews",
      beforeLoad: ({ params }) => {
        throw redirect({
          href: sitePreviewDeploymentsHref(params.slug, params.siteId),
          replace: true,
        });
      },
    }),
    createUiRoute({
      parent: site,
      path: "/",
      title: { namespace: "sites.detail.tabs", key: "overview" },
      pendingComponent: SiteSectionLoading,
      preload: Overview.preload,
      component: () => <Overview />,
    }),
    ...SITE_SECTION_PAGES.map(({ section, page: Page }) =>
      createUiRoute({
        parent: site,
        path: section,
        title: { namespace: "sites.detail.tabs", key: section },
        pendingComponent: SiteSectionLoading,
        preload: Page.preload,
        component: () => <Page />,
      })
    ),
    createUiRoute({
      parent: site,
      path: "deployments/$deploymentId",
      title: { namespace: "sites.deploymentPage", key: "title" },
      pendingComponent: SiteDeploymentLoading,
      preload: DeploymentDetail.preload,
      component: ({ params }) => (
        <DeploymentDetail deploymentId={params.deploymentId} />
      ),
    }),
  ];

  return [
    sites.addChildren([
      createUiRoute({
        parent: sites,
        path: "/",
        title: { namespace: "sites", key: "title" },
        pendingComponent: SitesLoading,
        preload: Sites.preload,
        component: ({ params, searchParams }) => (
          <Sites
            organizationSlug={params.slug}
            showAll={searchParams.view === "all"}
          />
        ),
      }),
      createUiRoute({
        parent: sites,
        path: "new",
        title: { namespace: "sites.new", key: "title" },
        pendingComponent: NewSiteLoading,
        preload: NewSite.preload,
        component: ({ params }) => <NewSite organizationSlug={params.slug} />,
      }),
      site.addChildren(siteRoutes),
    ]),
  ];
}
