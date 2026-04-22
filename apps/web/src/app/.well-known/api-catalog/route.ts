import { API_URL, DOCS_URL } from "@/utils/urls";

export function GET() {
  const body = {
    linkset: [
      {
        anchor: API_URL,
        "service-desc": [
          {
            href: `${API_URL}/openapi.json`,
            type: "application/openapi+json",
          },
        ],
        "service-doc": [
          {
            href: DOCS_URL,
            type: "text/html",
          },
        ],
        status: [
          {
            href: `${API_URL}/ping`,
            type: "text/plain",
          },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/linkset+json",
      "cache-control": "public, max-age=3600",
    },
  });
}
