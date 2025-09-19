export default function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Royal Academy K.I.",
    "alternateName": "opd.agency K.I. Training Academy",
    "url": "https://b6t.de",
    "logo": "https://b6t.de/logo-royal-academy.svg",
    "description": "Führende KI-gestützte Plattform für professionelle Online-Trainings mit GPT-4, Claude und LangGraph Workflows.",
    "founder": {
      "@type": "Organization",
      "name": "opd.agency"
    },
    "service": [
      {
        "@type": "Service",
        "name": "KI-Training Academy Erstellung",
        "description": "Erstellen Sie Ihre eigene KI-gestützte Training Academy"
      },
      {
        "@type": "Service",
        "name": "KI-Kurs Generator",
        "description": "Automatische Kurserstellung mit GPT-4 und Claude"
      },
      {
        "@type": "Service",
        "name": "LangGraph Workflows",
        "description": "Intelligente Automatisierung für Trainingsprozesse"
      }
    ],
    "offers": [
      {
        "@type": "Offer",
        "name": "Kostenloser Plan",
        "price": "0",
        "priceCurrency": "EUR",
        "description": "Kostenloses Ausprobieren der Plattform"
      },
      {
        "@type": "Offer",
        "name": "Basis Plan",
        "price": "19",
        "priceCurrency": "EUR",
        "description": "Professionelle Training Academy mit eigener Subdomain"
      },
      {
        "@type": "Offer",
        "name": "Pro Plan",
        "price": "49",
        "priceCurrency": "EUR",
        "description": "Vollständige KI-Integration mit GPT-4, Claude und CrewAI"
      }
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "url": "https://b6t.de/contact"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}